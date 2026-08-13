# NSGlamour API

V2 自有的 Flask API 服务。它只提供 `/api/*`，不承载旧 Jinja 页面，也不启动或管理石之家浏览器。

## 本地运行

```powershell
python -m pip install -r server/glamour/requirements.txt
npm run dev:glamour-api
```

默认监听 `127.0.0.1:8766`。`npm run dev` 会同时启动该服务和 `127.0.0.1:5175` 的 Vite。

物品卡片的“其他物品”搜索依赖服务端 SQLite 索引。刷新 Item.csv 后运行：

```powershell
npm run build:glamour-item-catalog
```

索引包含 `zh/en/ja/ko/tc/fr/de` 名称、物品 ID、图标、品质、`EquipSlotCategory` 和坐骑 ID；只随 Flask 服务部署，不进入 Vite `dist/`。`/api/search-catalog-items` 通过 `category=equipment|facewear|fashion|other|furniture|mount|all` 区分 Item 装备、现有 Glasses.csv 面部配饰、Ornament.csv 时尚配饰、非装备物品、家具、Mount.csv 坐骑和兼容全目录；家具（含庭具与内装建材，不论是否可染色）由 `HousingFurniture.csv`、`HousingYardObject.csv` 的 `Item` 列以及 Item.csv 的 `ItemUICategory`（73=内墙、74=地板、75=屋顶照明）判定，可用 `--housing-furniture-csv` / `--housing-yard-object-csv` 覆盖来源；坐骑来源可用重复的 `--mount-csv locale=path` 参数覆盖，普通物品来源可用重复的 `--item-csv locale=path` 参数覆盖。

## 韩服官方指南物品映射

韩服官方指南使用站点私有的 11 位详情 ID，不能从游戏 Item ID 直接计算。需要更新映射时，在没有其他韩站爬虫运行的时间执行：

```powershell
npm run build:kr-guide-item-map
```

生成器固定单并发，默认每页请求间隔 3 秒；失败请求指数退避，每个成功页面原子保存到已忽略的 `server/glamour/.runtime/kr-guide-item-pages/`。中断后执行同一命令会从首个缺失页面继续，不重复请求已缓存页面。若需要使用本地韩语 CSV：

```powershell
npm run build:kr-guide-item-map -- --item-csv D:\ffxiv-datamining-ko\csv\Item.csv
```

完整抓取并达到匹配率门槛后才会写入 `public/data/ffxiv/kr-guide-id-map.json`；详细未命中和冲突记录写入本地 `.runtime` 报告。当前脚本只负责生成映射，前端直达韩服详情页的接入另行实施。

## 测试

```powershell
npm run test:glamour-api
$env:NSGLAMOUR_CONTRACT_BASE_URL='http://127.0.0.1:8766/api'
npm run check:nsglamour-contract
```

旧服务仍在 `8765` 时，可以执行响应对比：

```powershell
python server/glamour/tests/compare_api.py
```

## 生产运行

```bash
gunicorn --workers 2 --bind 127.0.0.1:8766 server.glamour.app:app
```

生产环境从进程环境或未跟踪的 `server/glamour/.env.local` 读取配置。石之家导入只调用外部 Reader；Token 只通过 `NSGLAMOUR_RS_READER_TOKEN_FILE` 指向仓库外文件，不得写入仓库。
