#!/usr/bin/env python3
"""Image integration: select current host tools, plan calls, validate/store assets. Does not call tools on the agent's behalf."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import sys
import time
import uuid

import capabilities as c


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inspect_image(path):
    try:
        from PIL import Image
    except ImportError:
        raise c.ConfigError('图片验收需要Pillow；状态探查不需要。请按环境安装依赖') from None
    try:
        payload=Path(path).read_bytes()
        with Image.open(io.BytesIO(payload)) as im:
            fmt=im.format
            if fmt not in ('PNG','JPEG','WEBP'):
                raise c.ConfigError('支持PNG/JPEG/WEBP静态素材')
            if getattr(im,'n_frames',1)!=1:
                raise c.ConfigError('多帧图片请先明确选帧，不隐式截取')
            im.verify()
        with Image.open(io.BytesIO(payload)) as im:
            im.load()
            alpha=im.convert('RGBA').getchannel('A').getextrema()
            return {'width':im.width,'height':im.height,'format':fmt.lower(),
                    'has_transparency':alpha[0]<255,'has_visible_pixels':alpha[1]>0,'sha256':hashlib.sha256(payload).hexdigest()}
    except c.ConfigError:raise
    except Exception as e:
        raise c.ConfigError('图片无法完整解码：'+type(e).__name__) from None


def runtime_tools(path, session):
    data=c.read_json(Path(path))
    if data.get('session_id')!=session or not session:
        raise c.ConfigError('宿主能力快照不属于本次会话')
    if data.get('host') not in ('codex','claude-code','kimi','other'):
        raise c.ConfigError('未知宿主；可使用other但须提供真实工具声明')
    observed=data.get('observed_at')
    if not isinstance(observed,(int,float)) or not 0<=time.time()-observed<=900:
        raise c.ConfigError('工具快照已过期，请从当前会话重新取得（15分钟内）')
    tools=data.get('tools')
    if not isinstance(tools,list):raise c.ConfigError('工具快照需要tools列表；不可用时显式给空列表')
    ids=set()
    for tool in tools:
        if not isinstance(tool,dict) or not isinstance(tool.get('id'),str) or not tool['id'].strip() or tool['id'] in ids:
            raise c.ConfigError('工具ID缺失或重复')
        ids.add(tool['id'])
        if tool.get('kind') not in ('host','mcp') or tool.get('cost') not in ('subscription','paid_api','unknown','none') or tool.get('network') not in ('cloud','local'):
            raise c.ConfigError('工具必须声明执行来源、计费类型和网络范围')
        if not isinstance(tool.get('operations'),list) or not tool['operations'] or any(x not in ('generate','edit') for x in tool['operations']):
            raise c.ConfigError('工具操作声明无效')
        for key in ('reference_images','transparent_background'):
            if not isinstance(tool.get(key),bool):raise c.ConfigError('缺少工具特性：'+key)
    return data


def request_data(path):
    data=c.read_json(Path(path))
    if set(data)-{'prompt','operation','references','transparent_background','min_width','min_height'}:
        raise c.ConfigError('图片需求包含不支持字段')
    if not isinstance(data.get('prompt'),str) or not data['prompt'].strip():
        raise c.ConfigError('需要非空图片描述')
    data.setdefault('operation','generate');data.setdefault('references',[])
    data.setdefault('transparent_background',False);data.setdefault('min_width',1);data.setdefault('min_height',1)
    if data['operation'] not in ('generate','edit') or not isinstance(data['references'],list) or not isinstance(data['transparent_background'],bool):
        raise c.ConfigError('图片需求类型不正确')
    for key in ('min_width','min_height'):
        if type(data[key]) is not int or not 1<=data[key]<=16384:raise c.ConfigError('尺寸须为1—16384的整数')
    if data['operation']=='edit' and not data['references']:raise c.ConfigError('改图需要明确输入图片')
    refs=[]
    for item in data['references']:
        if not isinstance(item,str):raise c.ConfigError('参考图须为本地文件路径')
        p=Path(item).expanduser()
        if not p.is_absolute():p=Path(path).resolve().parent/p
        meta=inspect_image(p)
        refs.append({'path':str(p.resolve()),'sha256':meta['sha256']})
    data['references']=refs
    return data


def choose(config, runtime=None, request=None, mode=None, provider=None, grants=()):
    prefs=config['preferences']['image']; chosen=mode or prefs['mode']
    result={'capability':'image','mode':chosen,'status':'ready','reasons':[]}
    if config['policy']['image_generation']=='deny' and chosen=='generate':
        return dict(result,status='blocked',reasons=['图片生成已被明确禁止'])
    if chosen=='off':return dict(result,status='skipped',reasons=['不启用图片生成'])
    if chosen=='existing':return dict(result,status='needs_input',reasons=['提供现有图片，通过use-image导入'])
    if chosen=='unconfigured':return dict(result,status='needs_configuration',prompt=config['onboarding']['image']!='manual',reasons=['可选现有素材、当前宿主生图或跳过'])
    if chosen!='generate':raise c.ConfigError('图片方式不支持')
    if not runtime:return dict(result,status='needs_runtime',reasons=['需当前会话实际暴露的工具快照；不能按Agent名称推断'])
    request=request or {'operation':'generate','references':[],'transparent_background':False}
    selected=provider or prefs['provider']
    candidates=[]
    for tool in runtime['tools']:
        if selected!='auto' and tool['id']!=selected:continue
        if request['operation'] not in tool['operations']:continue
        if request['references'] and not tool['reference_images']:continue
        if request['transparent_background'] and not tool['transparent_background']:continue
        candidates.append(tool)
    if not candidates:return dict(result,status='unavailable',reasons=['当前无满足要求的工具；可导入现有素材，不自动接API'])
    ready=[];missing=[];blocked=[]
    for tool in candidates:
        needs=['image_generation']
        if tool['network']=='cloud':needs.append('cloud')
        if tool['cost']=='paid_api':needs.append('paid_api')
        if tool['cost']=='unknown':needs.append('unknown_image_cost')
        if request['references'] and tool['network']=='cloud':needs.append('reference_upload')
        deny=[k for k in needs if config['policy'][k]=='deny']
        ask=[k for k in needs if config['policy'][k]!='allow' and k not in grants]
        if deny:blocked.append({'tool_id':tool['id'],'denied':deny})
        elif ask:missing.append({'tool_id':tool['id'],'needs':ask})
        else:ready.append(tool)
    if len(ready)>1:return dict(result,status='needs_selection',candidates=[x['id'] for x in ready],reasons=['多个工具可用，请选择本次供应商或设置偏好'])
    if not ready:
        return dict(result,status='needs_permission' if missing else 'blocked',candidates=missing or blocked,reasons=['探查不授予调用权；沿用用户已经明确的本次授权'])
    return dict(result,status='host_action_required',host=runtime['host'],tool=ready[0],operation=request['operation'],
                reasons=['由当前Agent按真实工具schema执行；Python不会调用宿主工具'])


def no_overwrite(path, payload):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('xb') as f:f.write(payload)


def config_fingerprint(config):
    selected={'preferences':config['preferences']['image'], 'policy':{k:config['policy'][k] for k in ('image_generation','cloud','paid_api','reference_upload','unknown_image_cost')}}
    return hashlib.sha256(json.dumps(selected,sort_keys=True).encode()).hexdigest()


def make_plan(config, request, runtime, session, out, mode=None, provider=None, grants=()):
    decision=choose(config,runtime,request,mode,provider,grants)
    if decision['status']!='host_action_required':return decision
    plan={'schema_version':1,'plan_id':str(uuid.uuid4()),'session_id':session,'created_at':time.time(),
          'host':runtime['host'],'tool':decision['tool'],'request':request,'configuration_sha256':config_fingerprint(config),
          'instruction':'Agent调用当前真实工具；成功后保存回执，accept-image重新核验授权与产物。'}
    no_overwrite(out,(json.dumps(plan,ensure_ascii=False,indent=2)+'\n').encode())
    return {'status':'host_action_required','plan':str(out),'plan_id':plan['plan_id'],'tool_id':plan['tool']['id']}


def accept(config, plan_path, receipt_path, file, out, runtime, session, grants=()):
    plan=c.read_json(Path(plan_path));receipt=c.read_json(Path(receipt_path))
    if plan.get('schema_version')!=1 or plan.get('session_id')!=session or plan.get('host')!=runtime['host']:
        raise c.ConfigError('计划不属于当前宿主/会话')
    created=plan.get('created_at')
    if not isinstance(created,(int,float)) or not 0<=time.time()-created<=3600:
        raise c.ConfigError('图片计划超过1小时，重新解析当前授权与要求')
    if plan.get('configuration_sha256')!=config_fingerprint(config):
        raise c.ConfigError('图片相关配置已改变，请重新生成计划')
    req=plan.get('request')
    if not isinstance(req,dict) or not isinstance(req.get('prompt'),str) or req.get('operation') not in ('generate','edit') or not isinstance(req.get('references'),list) or type(req.get('transparent_background')) is not bool:
        raise c.ConfigError('图片计划的需求结构无效')
    if any(type(req.get(k)) is not int or not 1<=req[k]<=16384 for k in ('min_width','min_height')):
        raise c.ConfigError('图片计划尺寸无效')
    for ref in req['references']:
        if not isinstance(ref,dict) or not isinstance(ref.get('path'),str) or not isinstance(ref.get('sha256'),str):
            raise c.ConfigError('计划参考图结构无效')
    tool=plan.get('tool',{})
    if not isinstance(tool,dict):raise c.ConfigError('计划工具声明无效')
    current=next((t for t in runtime['tools'] if t['id']==tool.get('id')),None)
    if current!=tool:raise c.ConfigError('工具能力发生变化或已不可用，不能复用旧计划')
    for ref in plan['request']['references']:
        if sha(ref['path'])!=ref['sha256']:raise c.ConfigError('参考图已变化，重新生成计划')
    decision=choose(config,runtime,plan['request'],mode='generate',provider=tool['id'],grants=grants)
    if decision['status']!='host_action_required':raise c.ConfigError('当前配置不再允许接收该生成任务：'+decision['status'])
    meta=inspect_image(file)
    expected={'status':'success','plan_id':plan['plan_id'],'session_id':session,'tool_id':tool['id'],'output_sha256':meta['sha256']}
    if any(receipt.get(k)!=v for k,v in expected.items()):raise c.ConfigError('回执未成功或与计划/文件不一致')
    req=plan['request']
    if not meta['has_visible_pixels']:raise c.ConfigError('生成图片全透明，缺少可见内容')
    if meta['width']<req['min_width'] or meta['height']<req['min_height']:
        raise c.ConfigError('图片尺寸小于任务要求')
    if req['transparent_background'] and not meta['has_transparency']:
        raise c.ConfigError('要求透明背景，但产物没有实际透明像素')
    meta.update(generated=True,tool_id=tool['id'],host=runtime['host'],plan_id=plan['plan_id'],
                prompt_sha256=hashlib.sha256(req['prompt'].encode()).hexdigest(),receipt_sha256=sha(receipt_path),
                provenance='agent_reported_tool_call',source_proof='回执关联已检查，非平台签名来源认证')
    return import_artifact(file,out,meta)


def import_artifact(file,out,meta):
    out=Path(out);sidecar=out.with_name(out.name+'.json')
    suffix={'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp'}.get(out.suffix.lower())
    if suffix!=meta['format']:raise c.ConfigError('目标扩展名须与真实图片格式一致；此入口不转码')
    if out.exists() or sidecar.exists():raise c.ConfigError('目标图片或元数据已存在，请使用新版本文件名')
    payload=Path(file).read_bytes()
    if hashlib.sha256(payload).hexdigest()!=meta['sha256']:raise c.ConfigError('验收期间图片已改变')
    meta=dict(meta,path=out.name)
    # Companion-script lock serializes paired writes; never overwrite user's existing version.
    with c.locked(out):
        if out.exists() or sidecar.exists():raise c.ConfigError('目标已被其他进程创建')
        no_overwrite(out,payload)
        no_overwrite(sidecar,(json.dumps(meta,ensure_ascii=False,indent=2)+'\n').encode())
    return {'status':'complete','output':str(out),'metadata':str(sidecar),'sha256':meta['sha256']}


def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    for name in ('image-status','image-plan','accept-image','use-image'):
        q=sub.add_parser(name);q.add_argument('--config');q.add_argument('--project')
        if name!='use-image':
            q.add_argument('--host-tools');q.add_argument('--session')
            for key in ('image-generation','cloud','paid-api','reference-upload','unknown-image-cost'):
                q.add_argument('--allow-'+key,action='store_true',help='仅表达已有的本次授权，不覆盖deny')
        if name in ('image-status','image-plan'):
            q.add_argument('--mode',choices=['off','existing','generate']);q.add_argument('--provider')
            q.add_argument('--request',required=name=='image-plan')
        if name in ('image-plan','accept-image','use-image'):q.add_argument('--out',required=True)
        if name in ('accept-image','use-image'):q.add_argument('--file',required=True)
        if name=='accept-image':q.add_argument('--plan',required=True);q.add_argument('--receipt',required=True)
    a=p.parse_args();config,_=c.effective(a.config,a.project)
    grants=[key for key in ('image_generation','cloud','paid_api','reference_upload','unknown_image_cost') if getattr(a,'allow_'+key,False)]
    runtime=runtime_tools(a.host_tools,a.session) if getattr(a,'host_tools',None) else None
    if a.command=='use-image':
        meta=inspect_image(a.file);meta.update(generated=False,mode='existing',provenance='provided_file')
        result=import_artifact(a.file,a.out,meta)
    elif a.command=='accept-image':
        if not runtime:raise c.ConfigError('需要本次最新宿主工具快照')
        result=accept(config,a.plan,a.receipt,a.file,a.out,runtime,a.session,grants)
    else:
        request=request_data(a.request) if a.request else None
        if a.command=='image-status':result=choose(config,runtime,request,a.mode,a.provider,grants)
        else:
            if not runtime:raise c.ConfigError('需要本次宿主工具快照，不能猜测工具')
            result=make_plan(config,request,runtime,a.session,a.out,a.mode,a.provider,grants)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if a.command=='image-plan' and result['status']!='host_action_required':raise SystemExit(2)


if __name__=='__main__':
    try:main()
    except (c.ConfigError,OSError,ValueError,KeyError,TypeError) as e:
        print(json.dumps({'status':'error','message':str(e) if isinstance(e,c.ConfigError) else type(e).__name__},ensure_ascii=False),file=sys.stderr)
        raise SystemExit(2)
