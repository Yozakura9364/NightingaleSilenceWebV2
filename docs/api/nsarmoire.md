---
summary: "V2 与独立 NSArmoireButler 的 API 所有权边界。"
status: "active"
scope: "V2 公网下载页不承载 NSArmoire 本地 API。"
source_of_truth: "独立 NSArmoireButler 仓库的 docs/api/nsarmoire.md 与 Helper 源码。"
read_when: "修改 V2 衣柜管家入口或检查本地 API 是否误入公网边界时。"
update_when: "独立仓库位置、Release 地址或公网边界变化时。"
verify: "确认 V2 源码和生产构建不请求 /health、/snapshot、/probe 或 /catalog。"
---

# NSArmoire API 边界

V2 的 `#/ffxiv/armoire` 只是下载页，不连接 `127.0.0.1`，也不解析衣柜 snapshot。完整 API、snapshot schema、目录 schema、成长型武器契约和 Helper 端点由独立 `NSArmoireButler` 仓库维护。

V2 仅保留 GitHub Releases 下载链接。任何 `/health`、`/probe`、`/snapshot`、`/catalog`、进程选择或本地库存读取逻辑都不得重新加入公网应用。
