# Nightingale Short Links

独立的私人短链服务。公网只暴露 `GET /go/<code>`；`/internal/short-links` 管理接口必须使用 Bearer Token，且只应监听 Docker 网桥或环回地址。

本地测试：

```powershell
python -m unittest server.shortlinks.tests.test_shortlinks
```

本地运行：

```powershell
$env:NS_SHORTLINK_DB_PATH = "$PWD/.codex-tmp/shortlinks.sqlite3"
$env:NS_SHORTLINK_API_TOKEN = "local-only-token"
python -m server.shortlinks.app
```

生产环境通过 `NS_SHORTLINK_API_TOKEN_FILE` 从 systemd credential 读取 Token。SQLite 必须位于发布目录之外。

生产公网路由位于 `/www/wwwroot/NightingaleSilenceWeb/conf.d/NSHome.conf`，由 1Panel OpenResty 容器加载。公网必须只代理 `/go/`，并显式让 `/internal/short-links` 返回 `404`。
