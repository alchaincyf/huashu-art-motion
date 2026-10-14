#!/usr/bin/env python3
"""Incremental release check: scans actual Git objects pending release and verifies the final file manifest; does not push."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

MANIFEST='release-manifest.json'
SECRET=re.compile(rb'/Users/[A-Za-z0-9_.-]+/|/home/[A-Za-z0-9_.-]+/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{30,}|ghp_[A-Za-z0-9]{30,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}')


def git(repo,*args):
    return subprocess.check_output(['git','--no-replace-objects','-C',str(repo),*args])


def tree(repo,ref):
    files={}
    command=['ls-files','--stage','-z'] if ref=='INDEX' else ['ls-tree','-r','-z',ref]
    for row in git(repo,*command).split(b'\0'):
        if not row:continue
        meta,name=row.split(b'\t',1);parts=meta.decode().split();name=name.decode()
        mode,oid=parts[0],parts[1] if ref=='INDEX' else parts[2]
        if SECRET.search(name.encode()):raise ValueError('文件路径名含敏感形态，标识：'+hashlib.sha256(name.encode()).hexdigest()[:12])
        if mode not in ('100644','100755'):raise ValueError('不发布软链、子模块或冲突文件：'+name)
        if ref=='INDEX' and parts[2]!='0':raise ValueError('索引存在合并冲突')
        files[name]={'mode':mode,'oid':oid}
    return files


def forbidden(name):
    p=Path(name)
    if any(x in p.parts for x in ('_private','_archive','.huashu','__pycache__','node_modules','.venv')):return True
    if p.name in ('voices.json','media.local.json'):return True
    if p.name.startswith('.env') and p.name!='.env.example':return True
    if p.name=='media.json' and name!='defaults/media.json':return True
    return p.suffix in ('.pem','.key','.p12','.pfx','.wav','.mov','.mp4','.pyc','.log')


def inspect(repo,ref):
    hashes={}
    for name,entry in tree(repo,ref).items():
        if SECRET.search(name.encode()):raise ValueError('文件路径名含敏感形态，标识：'+hashlib.sha256(name.encode()).hexdigest()[:12])
        if forbidden(name):raise ValueError('包含私人配置或过程产物：'+name)
        data=git(repo,'cat-file','blob',entry['oid'])
        if SECRET.search(data):raise ValueError('发现私人路径或凭据形态：'+name)
        if name!=MANIFEST:hashes[name]=hashlib.sha256(data).hexdigest()
    return hashes


def build_manifest(repo):
    if git(repo,'diff','--name-only').strip():raise ValueError('有未暂存修改，先审查并暂存再生成清单')
    return {'schema_version':1,'files':inspect(repo,'INDEX')}


def check(repo,ref,base=None,email=None):
    if git(repo,'rev-parse','--is-shallow-repository').strip()==b'true':
        raise ValueError('浅克隆无法证明完整待发历史，请先获取完整历史')
    graft=Path(git(repo,'rev-parse','--git-path','info/grafts').decode().strip())
    if not graft.is_absolute():graft=repo/graft
    if graft.exists() and graft.stat().st_size:
        raise ValueError('存在grafts历史改写，不能作为发布依据')
    if ref!='INDEX' and git(repo,'cat-file','-t',ref).strip()!=b'commit':
        raise ValueError('此门禁仅处理commit引用；标签对象需单独审查')
    expected=inspect(repo,ref)
    spec=':'+MANIFEST if ref=='INDEX' else ref+':'+MANIFEST
    try:manifest=json.loads(git(repo,'show',spec))
    except (ValueError,subprocess.CalledProcessError):raise ValueError('缺少有效发布清单') from None
    if manifest!={'schema_version':1,'files':expected}:raise ValueError('已审清单与Git文件树不一致，需重新生成并复核')
    commits=[]
    if ref!='INDEX':
        revision=base+'..'+ref if base and set(base)!={'0'} else ref
        commits=git(repo,'rev-list',revision).decode().splitlines()
        # Scan every outgoing commit to prevent secrets committed and then deleted being invisible at HEAD-only checks.
        for commit in commits:
            raw=git(repo,'cat-file','commit',commit)
            if SECRET.search(raw):raise ValueError('提交元数据/说明含私人路径或凭据形态：'+commit[:12])
            inspect(repo,commit)
            if email:
                identities=git(repo,'show','-s','--format=%ae%n%ce',commit).decode().splitlines()
                if any(x!=email for x in identities):raise ValueError('待发提交邮箱不符合配置：'+commit[:12])
    return {'status':'passed','ref':ref,'files':len(expected),'outgoing_commits_checked':len(commits)}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['manifest','check'])
    p.add_argument('--repo',type=Path,required=True);p.add_argument('--ref',default='HEAD');p.add_argument('--base');p.add_argument('--author-email');p.add_argument('--pre-push',action='store_true')
    a=p.parse_args();repo=a.repo.resolve()
    if not (repo/'.git').exists():raise ValueError('必须明确指定Git仓库根，不能隐式扫描父仓库')
    if a.command=='manifest':
        (repo/MANIFEST).write_text(json.dumps(build_manifest(repo),ensure_ascii=False,indent=2)+'\n')
        print('已生成发布清单；审查后将它暂存，再运行check --ref INDEX。')
        return
    if a.pre_push:
        if git(repo,'status','--porcelain','--untracked-files=all').strip():raise ValueError('推送前工作区必须干净')
        lines=sys.stdin.read().splitlines()
        if not lines:raise ValueError('pre-push缺少真实待推送引用')
        for line in lines:
            local_ref,local_sha,remote_ref,remote_sha=line.split()
            if SECRET.search((local_ref+' '+remote_ref).encode()):raise ValueError('待推送引用名称含敏感形态')
            if set(local_sha)=={'0'}:raise ValueError('本检查不授权删除远端引用')
            print(json.dumps(check(repo,local_sha,remote_sha,a.author_email),ensure_ascii=False))
    else:print(json.dumps(check(repo,a.ref,a.base,a.author_email),ensure_ascii=False))


if __name__=='__main__':
    try:main()
    except (ValueError,OSError,subprocess.CalledProcessError) as e:
        print('发布检查未通过：'+(str(e) if isinstance(e,ValueError) else type(e).__name__),file=sys.stderr);raise SystemExit(1)
