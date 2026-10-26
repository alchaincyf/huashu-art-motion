# 维护与扩展

公共代码、公共推荐放在包内；个人平台、声音和凭证引用保存在安装目录外。不要把个人经验变成所有人的默认授权。

## 本地检查

```sh
python -m pip install requests Pillow
# 另需系统安装ffmpeg/ffprobe；不会在正常Skill激活时自动安装
node tests/test_portrait_stage_centers.cjs
python -m unittest discover -s tests -v
```

单元测试不调用真实语音/生图服务。真实宿主验收见[兼容性记录](references/compatibility.md)。新增适配器必须明确：配置、探查、请求与输出契约、失败行为；不能仅替换base_url就宣称兼容另一平台。

## 图片工具桥接

读取[图片指南](references/images.md)。宿主提供实际工具声明，Agent执行调用，CLI生成计划并验收产物。回执不是平台签名来源认证。已有图片、禁用生成、无工具、未知计费、参考图权限和生成失败都需要覆盖。

独立图片API执行器仍是可选扩展，本版不自动安装、不注册账号、不借用其他Agent的登录态。

## 更新时保留用户配置

安装目录允许被替换；用户media.json不得写入其中。旧配置通过默认值合并获得新字段，新增能力默认未选择/未授权，不自动重训或重置已有音色。改变字段语义时提供显式迁移与回滚方法。

## 发布检查

审查变更后将本次公共文件暂存，再生成文件清单：

```sh
python scripts/check_release.py manifest --repo .
git add release-manifest.json
python scripts/check_release.py check --repo . --ref INDEX
# 提交后核对全部待发提交，base替换为实际远端基线
python scripts/check_release.py check --repo . --ref HEAD --base origin/main
```

检查Git对象而非仅磁盘文件；中间提交曾写入后又删除的凭证也会被检查。清单只证明受审文件集合一致，不替代代码审查、真实媒体验收和许可证核对。禁止绕过检查或重建历史去伪装成首次发布。

复用代码时也请保留原有字体、笔顺数据和角色示范的许可边界。个人反馈留个人配置；有复现证据的方法和接口经验才进入公共文档，并标注日期、范围和验证状态。
