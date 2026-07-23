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

索引包含 `zh/en/ja/ko/tc/fr/de` 名称、物品 ID、图标、品质和 `EquipSlotCategory`，只随 Flask 服务部署，不进入 Vite `dist/`。`/api/search-catalog-items` 通过 `category=equipment|other|all` 区分现有装备映射、非装备物品和兼容全目录；可以用重复的 `--item-csv locale=path` 参数覆盖某个语言的 Item.csv 来源。

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
