# 国服房屋历史采集器（housing history worker）

用现成的公开 API 建立**自己的国服历史数据库**：不需要任何用户安装插件，也不需要第三方站点的页面保持可用。

- 数据源：艾欧泽亚售楼中心 `https://house.ffxiv.cyou/api`（镜像 `househelper.ffxiv.cyou`），其数据由玩家 HousingCheckXP 插件上报。
- 仅 Python 标准库（`sqlite3` / `urllib` / `http.server`），无新增依赖。
- 采集端 User-Agent 带产品名与站点地址，遵循对方 API 规范（标注来源、勿高频）；轮询间隔 120 秒，与对方 Cloudflare 边缘缓存（`cache-control: max-age=120`）对齐。

## 运行

```bash
# 采集一轮并退出（验证用）
python server/housing/run.py --once

# 常驻：后台采集线程 + 只读查询 API（默认 127.0.0.1:8790）
python server/housing/run.py

# 只对已有数据库开查询 API
python server/housing/run.py --api-only
```

数据库默认在 `server/housing/data/housing.db`（已 gitignore，不进仓库）。部署到长期在线的机器上即可持续积累历史。

## 写入内容

- `poll_runs`：每轮采集的时间、总地块数、失败服列表
- `server_snapshots`：每服每轮在售地块数、最新上报时间
- `current_plots`：每服当前在售地块全量（含原始 JSON payload）
- `plot_events`：相邻两轮之间的变化（出现 / 消失 / 价格 / 报名数 / 状态变化）
- `transfers`：`/api/change` 过户流水（原房主 → 新房主、时间），按主键去重

## 查询接口

| 路由 | 说明 |
| ---- | ---- |
| `GET /api/housing/health` | 最近一轮采集状态 |
| `GET /api/housing/servers` | 28 服列表与最新快照信息 |
| `GET /api/housing/current?server=1179` | 该服当前在售地块 |
| `GET /api/housing/history?server=1179&limit=50` | 该服逐轮在售数量历史 |
| `GET /api/housing/events?server=1179&limit=100` | 地块变化事件 |
| `GET /api/housing/transfers?server=1179&limit=100&offset=0` | 过户流水 |
| `GET /api/housing/polls?limit=20` | 采集轮次记录 |

全部只读、带 `Access-Control-Allow-Origin: *`，V2 前端后续可直接切换到这个自建数据源。

## 服务器 ID

与前端 `src/lib/housing/regions.ts` 同步：API 的 `server` 参数是游戏内服务器 ID（1042–1201），不是下拉索引。
