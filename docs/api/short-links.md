---
summary: 'Nightingale Silence 私人短链的公开跳转、内部管理 API、存储和部署安全契约。'
status: 'active'
scope: 'server/shortlinks、/s/<code>、AstrBot 私聊管理命令和生产 Nginx/systemd。'
source_of_truth: 'server/shortlinks/app.py、storage.py 与对应测试。'
read_when: '修改短链格式、管理命令、认证、Nginx 路由或生产存储。'
update_when: 'API、短码规则、鉴权、数据路径或部署方式变化时。'
verify: '运行 npm run test:shortlinks，并验证内部 API 不可从公网访问。'
---

# 私人短链契约

## 访问边界

- 公网只开放 `GET https://nsffxiv.com/s/<code>`，成功时返回 `302`。
- `/internal/short-links` 只允许 AstrBot 通过服务器 Docker 网桥访问，生产 Nginx 不得反向代理该前缀。
- 管理 API 必须提供 `Authorization: Bearer <token>`；Token 通过 systemd credential 和 AstrBot 私有配置分发，不进入仓库、日志或聊天。
- AstrBot 命令只允许私聊，并要求发送者 QQ 号精确匹配私有配置中的所有者列表。AstrBot 管理员身份不能替代该白名单。

## 短码与目标

- 自定义短码统一转为小写，只允许 1 至 32 位 `a-z`、`0-9`、`_`、`-`。
- 未指定短码时，从去除易混淆字符的字母数字表中随机生成 5 位短码；SQLite 唯一索引负责碰撞检查。
- 目标最长 2048 字符，只允许绝对 `http` 或 `https` URL。
- 禁止用户名/密码型 URL，也禁止跳回已配置站点的 `/s/`，避免凭据泄露和短链循环。
- 访问短链时忽略访问请求自身的 query，严格跳转到数据库中保存的完整目标，包括目标原有的 query 和 fragment。

## 内部 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/health` | 服务器内部健康检查 |
| `GET` | `/s/<code>` | 公共 `302` 跳转 |
| `GET` | `/internal/short-links` | 列出短链 |
| `POST` | `/internal/short-links` | 随机或自定义短码创建 |
| `PATCH` | `/internal/short-links/<code>` | 修改目标或启停 |
| `DELETE` | `/internal/short-links/<code>` | 删除短链 |

管理响应包含 `code`、`target_url`、`short_url`、`enabled`、`created_at` 和 `updated_at`。公开跳转不返回管理数据。

## 存储与部署

- 生产 SQLite：`/var/lib/nightingalesilence-v2/shortlinks/shortlinks.sqlite3`。
- 数据目录位于版本发布目录之外，切换 `current` 或重新构建前端不会覆盖短链。
- 服务默认由 Gunicorn 绑定 Docker 网桥 `172.17.0.1:18768`，同时供本机 Nginx 与 AstrBot 容器访问；不得绑定 `0.0.0.0`。
- 生产站点由 1Panel OpenResty 容器加载 `/www/wwwroot/NightingaleSilenceWeb/conf.d/NSHome.conf`；该 server block 直接反代 `/s/` 到 `172.17.0.1:18768`。
- 公网配置必须显式让 `/internal/short-links` 返回 `404`，避免 SPA fallback 返回首页并掩盖管理边界。
- 所有短链响应使用 `Cache-Control: no-store` 和 `X-Robots-Tag: noindex, nofollow`。
- `/g/<snapshotId>` 属于幻化快照公开查看器，不经过本服务；旧 `/go/` 路由已移除，已有记录在迁移部署时清空。

## QQ 命令

```text
/短链 https://目标地址
/短链 自定义 card https://目标地址
/短链 列表
/短链 修改 card https://新地址
/短链 停用 card
/短链 启用 card
/短链 删除 card
```

命令实现属于 `NightingaleOpsBot/astrbot-plugin/astrbot_plugin_short_links`，不得复制进 V2 前端。
