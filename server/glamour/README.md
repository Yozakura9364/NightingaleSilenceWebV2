# NSGlamour API

V2 自有的 Flask API 服务。它只提供 `/api/*`，不承载旧 Jinja 页面，也不启动或管理石之家浏览器。

## 本地运行

```powershell
python -m pip install -r server/glamour/requirements.txt
npm run dev:glamour-api
```

默认监听 `127.0.0.1:8766`。`npm run dev` 会同时启动该服务和 `127.0.0.1:5175` 的 Vite。

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
