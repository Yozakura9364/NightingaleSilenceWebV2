<div align="center">
  <img src="https://nightingalesilence.com/assets/icons/WebIcon.png" alt="Nightingale Silence" width="96" height="96" />
  <h1>NightingaleSilenceWebV2</h1>
  <p>
    <a href="https://nightingalesilence.com/">
      <img alt="Website" src="https://img.shields.io/badge/🌐_nightingalesilence.com-181717?style=for-the-badge" />
    </a>
  </p>
  <p>夜莺不语 / Nightingale Silence 的个人与工具网站 V2 <br> 基于 Vue 3 的统一前端，整合 FFXIV 生产工具、Silence 创作展示和个人站点入口。</p>
  <p>
    <img alt="Vue 3" src="https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" />
    <img alt="Pinia" src="https://img.shields.io/badge/Pinia-F7D336?logo=pinia&logoColor=black" />
    <img alt="Vue Router" src="https://img.shields.io/badge/Vue_Router-4FC08D?logo=vue.js&logoColor=white" />
  </p>
</div>

## 快速开始

```bash
npm install
npm run dev     # 开发服务器
npm run build   # 类型检查 + 生产构建
npm run check   # 全量检查（类型、i18n、数据完整性、构建）
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 桌面风格入口 |
| `/ffxiv` | FFXIV 工具导航 | 工具分类总览 |
| `/ffxiv/plate` | 铭牌工房 NSPlate | 铭牌设计、浏览与导出 |
| `/ffxiv/glamour` | 幻化工房 NSGlamour | 幻化方案编辑与分享 |
| `/ffxiv/armoire` | 衣柜管家 NSArmoire | 公网教程与下载 |
| `/ffxiv/fashion-check` | 时尚品鉴 | 每周方案与金牌来源 |
| `/ffxiv/item-card` | 物品卡片 | 导入、编辑与导出 |
| `/ffxiv/armoire/store-review` | 商城数据校正 | 内置校正工具（armoire-local 构建） |
| `/ffxiv/term-review` | FFXIV 术语校正 | 内部用语校正页 |
| `/silence` | Silence 创作入口 | 角色资料与画廊 |
| `/silence/angel` | 不语·silence | 角色详情页 |
| `/silence/glitch` | 幽灵·silence | 双人页 |
| `/about` | 关于 | 站点信息 |
| `/style-lab` | Style Lab | 内部样式实验页 |

## 项目结构

```
src/
├── assets/           # 图标、图片等静态资源
├── components/       # 公共 UI 组件
├── composables/      # 组合式函数（useFetch 等）
├── locales/          # 多语言文案
├── pages/            # 页面级组件
│   ├── about/
│   ├── armoire/
│   ├── fashion-check/
│   ├── ffxiv/
│   ├── glamour/
│   ├── home/
│   ├── item-card/
│   ├── plate/
│   ├── silence/
│   └── style-lab/
├── router/           # 路由配置
├── stores/           # Pinia 状态管理
├── styles/           # 全局样式与 CSS 动画
└── utils/            # 工具函数
```

## 数据服务

- NSPlate：静态数据源（COS/CDN），`/data/plate/*`
- NSGlamour：V2 API `/api/glamour/*`，兼容旧 Flask 后端
- NSArmoire：本地 GUI（8015 端口），公网页仅展示教程与下载

## 许可证与素材

代码及文档采用 MIT 协议。FFXIV 相关数据、素材、字体的授权与分发边界需在正式部署时另行确认。

## 鸣谢

感谢以下开发者对本项目作出的贡献：

[![Contributors](https://contrib.rocks/image?repo=Yozakura9364/NightingaleSilenceWebV2&max=1000)](https://github.com/Yozakura9364/NightingaleSilenceWebV2/graphs/contributors)
