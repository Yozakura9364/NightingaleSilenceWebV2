---
summary: "V2 构建、公开产物、反向代理、缓存和上线后烟测清单。"
status: "active"
scope: "生产构建与公开站点部署。"
source_of_truth: "package scripts、vite config、dist 产物和生产代理配置。"
read_when: "准备上线、修改发布边界、缓存策略或生产代理时。"
update_when: "构建脚本、公开资源、路由、API 或部署方式变化时。"
verify: "执行完整构建、release check、产物扫描和上线后烟测。"
---

# 上线检查清单

本清单用于 V2 前端上线前的最后核对。当前项目使用 hash 路由，构建产物为 `dist/`。

## 构建前检查

在仓库根目录运行：

```bash
npm run check:i18n
npm run check:nsglamour-contract
npm run build
npm run check:release
```

`npm run check:release` 会检查 `dist/` 的静态形态、NSGlamour 运行时资源、NSGlamour JS/CSS 体积预算，以及公开产物里是否混入 Armoire 本地 catalog、本机路径、旧大映射、PSD/Cropper、Silence/Style Lab/术语校对 chunk 等不应发布内容。它还会扫描 `/local-assets/` 文本路径，并用文件大小 + SHA256 对比 ignored `local-assets/` 与 `dist/`，防止本地图片被哈希重命名后漏检。

普通 `npm run build` 默认关闭 `VITE_ENABLE_SILENCE` 和 `VITE_ENABLE_INTERNAL_ROUTES`。发布环境不要把这两个变量设为 `true`；即使误开，`npm run check:release` 也必须阻止该产物发布。`vite dev` 默认启用两者，便于继续维护内部页面。

如果只验证 NSGlamour 的 V2 代理链路，先启动 Vite，再运行：

```bash
python -m pip install -r server/glamour/requirements.txt
npm run test:glamour-api
NSGLAMOUR_CONTRACT_BASE_URL=http://127.0.0.1:5175/api/glamour npm run check:nsglamour-contract
```

## 静态文件

需要部署 `dist/` 的全部内容。重点确认这些路径存在：

```text
dist/index.html
dist/assets/
dist/data/plate/
dist/data/glamour/template-preview/
dist/data/glamour/templates/
```

当前 `dist/data/glamour/` 只包含已确认的模板预览图和运行时背景/遮罩资源，不包含 PSD/SVG 原稿、用户图片或本地私有 fixture。

公网 `#/ffxiv/armoire` 只保留轻量教程和 Helper 下载入口。`dist/data/` 下不得出现任何 `armoire-*` 文件或目录；完整工作台和 catalog 只进入 `NSArmoireButler` 的 `armoire-local` 构建。

`dist/assets/` 不得出现 `Silence*`、`silence-*`、`StyleLabPage-*`、`styleLab-*` 或 `FfxivTermReviewPage-*` chunk，也不得出现与 ignored `local-assets/` 内容相同的文件。公开 JS/CSS/HTML 中不得保留 `/local-assets/` 路径。

## 反向代理

生产环境必须让前端访问稳定的同源路径：

```text
/api/glamour/* -> V2 server/glamour Flask 服务 /api/*
```

Nginx 示例：

```nginx
location ^~ /api/glamour/ {
    proxy_pass http://127.0.0.1:8766/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /api/glamour {
    proxy_pass http://127.0.0.1:8766/api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

公开站点不要把 `/api/armoire/*` 反代到用户本机 helper。NSArmoire helper 是本机工具边界，不是公开服务默认依赖。

## 缓存建议

`assets/` 文件名带 hash，可以长缓存：

```nginx
location ^~ /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

`data/glamour/template-preview/` 和 `data/glamour/templates/` 是版本随前端发布的静态资源，也可以长缓存；如果上线后可能热替换资源，则改为较短缓存。

```nginx
location ^~ /data/glamour/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

`index.html` 不要长缓存：

```nginx
location = /index.html {
    add_header Cache-Control "no-cache";
}
```

hash 路由下，站点入口回退到 `index.html` 即可：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 上线后烟测

替换域名后检查：

```text
/#/
/#/ffxiv
/#/ffxiv/plate
/#/ffxiv/glamour/template
/#/ffxiv/glamour/equipinfo
/#/ffxiv/armoire
/#/ffxiv/fashioncheck
/#/ffxiv/fashioncheck/tags
/#/ffxiv/fashioncheck/sources
/#/ffxiv/item-card
/api/glamour/health
/data/glamour/templates/eorzea-magazine.png
/data/glamour/template-preview/1-Eorzea%20Magazine/1-Preview.webp
```

每个页面至少检查首屏渲染、主要导航、控制台错误和失败请求。工具页还需执行一条最常用用户路径；响应式或移动端改动需要增加对应视口烟测。

Silence 资料、正式文案和授权素材尚未填写完成，当前不纳入公开上线和生产烟测范围。其路由代码只保留给本地开发；恢复上线前必须单独更新模块文档、公开导航、构建边界和本清单。

NSGlamour 必测流程：

1. `#/ffxiv/glamour/equipinfo` 输入 `身体：书龙长袍`，点击识别。
2. 装备信息页出现 `书龙长袍`。
3. 切到 `#/ffxiv/glamour/template`，装备编辑区同步出现该装备。
4. Canvas 非空，可以保存图片。
5. 手机宽度下无横向滚动，装备顺序为：主手、副手、头部、身体、手臂、腿部、脚部、耳部、颈部、腕部、左指、右指、面部配饰、时尚配饰。

## 当前上线风险

- 切换 Nginx 前先同时运行旧 `8765` 和新 `8766`，执行 `python server/glamour/tests/compare_api.py`；切换后暂不停止旧服务，以便快速回滚。
- 石之家 / Eorzea Collection 外部导入依赖对方接口与页面稳定性。
- 模板 Canvas 已迁入主要 renderer，但仍不是全部旧项目像素级精校完成状态；上线前应以当前视觉样本为准接受。
- `npm run check:release` 当前应保持 `0 warning(s)`；如果再次出现本机端点、未确认占位文案或源素材泄漏提示，先收口后再上线。
- 首页、Silence、About 等非 FFXIV 工具页仍不是完整正式内容；如果本次只主推工具，请直接投放 `#/ffxiv/glamour/template` 或 `#/ffxiv`。
