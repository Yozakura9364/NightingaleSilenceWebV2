---
summary: "V2 当前目录、关键文件和模块入口的结构快照。"
status: "active"
scope: "仓库顶层、src、docs、scripts、data 和 public 结构。"
source_of_truth: "当前文件系统和 MODULE_MAP。"
read_when: "定位文件、设计新目录或评估结构漂移。"
update_when: "新增顶层目录、模块入口或关键公共层时。"
verify: "使用 rg --files 和目录列表对照本文档。"
---

# 项目结构快照

## 用途

本文档记录当前 V2 仓库的真实代码结构、近期结构整理结果和后续维护边界。它用于快速对齐“项目现在长什么样”，不替代模块级规划文档。

优先级：

1. 代码真实结构优先。
2. `docs/ai/MODULE_MAP.md` 负责模块、路由和页面入口总览。
3. `docs/ai/MODULES/*.md` 负责单个模块的深度规划。
4. 本文档负责横向说明目录职责、结构变更和维护规则。

## 当前结构整理结果

截至当前本地 `main`，项目已经完成一次结构整理：

- 引入 Prettier 作为代码格式化工具。
  - 配置文件：`.prettierrc`
  - 忽略文件：`.prettierignore`
  - 脚本：`npm run format`、`npm run format:check`
  - 当前格式化范围：`src/**/*.{ts,vue,css}`
- 删除候选空目录里的占位 README。
  - `src/assets/README.md`
  - `src/composables/README.md`
  - `src/lib/README.md`
  - `src/services/README.md`
- 保留实际已经有内容或已经接入代码的目录。
- 候选模块目录不再靠空 README 占位；需要真实实现或明确计划时再创建。

## 当前迁移焦点

当前主线已从搭建迁移骨架转为稳定现有页面和补齐模块回归：`NSPlate`、`NSGlamour` 和物品卡片已具备真实工作台；`NSArmoire` 公网页与本地完整工作台分离；时尚品鉴提供当前周公开作业；`Silence` 代码只用于本地开发，资料未完成，暂不上线。

| 工具 | 目标路由 | 当前状态 | 下一步 |
| --- | --- | --- | --- |
| `NSPlate` | `#/ffxiv/plate` | 核心工作台、静态 manifest、Canvas、信息层和主要导入导出已接入 | 维护回归矩阵、字体授权和生产 smoke |
| `NSGlamour` | `#/ffxiv/glamour` | EquipInfo/Template 双工作台、共享草稿、导入编辑和六套模板已接入 | 继续旧项目等价回归和生产后端边界收口 |
| `NSArmoire` | `#/ffxiv/armoire` | 公网页提供下载教程，完整工作台进入本地构建 | 稳定 catalog、helper 和公开构建隔离 |
| `时尚品鉴` | `#/ffxiv/fashioncheck` | 当前周作业、金牌物品、来源和多语言名称已接入 | 按周维护公开切片并完善来源核验 |
| `物品卡片` | `#/ffxiv/item-card` | 独立导入、编辑、排版和多种导出工作台已接入 | 稳定 API 契约和真实导入/导出回归 |

后续旧项目等价工作仍以 `docs/ai/MIGRATION_PLAN.md` 的契约优先原则为参考；各工具已经进入不同收口阶段，具体剩余任务以对应 `docs/ai/MODULES/*.md` 为准。

对尚未迁移工具的通用开工顺序：

1. 先确认旧服务和 V2 代理可用。
2. 同步补齐对应 `docs/api/` 契约的真实字段和样本。
3. 再选择一个第一段可见迁移切片。

`Silence` 已有入口、分组、角色详情和本地数据骨架，但资料与正式素材尚未填写完成；当前只保留本地开发，不进入公开上线范围。

## 当前 src 目录职责

```text
src/
├── App.vue
├── main.ts
├── env.d.ts
├── components/
├── composables/
├── config/
├── pages/
├── router/
├── services/
├── stores/
└── styles/
```

| 路径                            | 职责                | 备注                                                                         |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `src/main.ts`                   | Vue 应用入口        | 注册 Pinia 和 Router。                                                       |
| `src/App.vue`                   | 应用外壳            | 渲染轻量全局导航和 `<router-view />`。                                       |
| `src/router/index.ts`           | 路由表              | 使用 hash router；同时注册公开工具、内部页、本地构建页和 Silence 开发路由。   |
| `src/config/site.ts`            | 站点配置            | 维护站点名称、当前公开路由、导航入口、FFXIV 工具信息和占位文案。             |
| `src/components/`               | 公共组件            | 当前包含按钮、面板、像素窗口、顶栏、表单字段、工具栏、选项卡和状态提示组件。 |
| `src/composables/useFetch.ts`   | 请求封装            | 支持 query、json body、responseType、`createClient(basePath)`。              |
| `src/services/apiBoundaries.ts` | API 边界描述        | 当前服务 NSGlamour、NSPlate legacy fallback、NSArmoire helper 等边界。         |
| `src/stores/locale.ts`          | 语言模块状态        | 当前接入 UI 文案、`document.lang`、语言切换和标题刷新。                       |
| `src/stores/theme.ts`           | 明暗模式状态        | 管理 day/night、浏览器偏好、持久化和跨标签页同步。                           |
| `src/pages/`                    | 页面组件            | 按页面或分类拆目录，不把复杂业务堆进单文件。                                 |
| `src/styles/`                   | 全局 CSS 和实验样式 | 全站样式分层，候选样式通过实验文件隔离。                                     |

## 当前 pages 目录

```text
src/pages/
├── about/
├── armoire/
├── fashion-check/
├── ffxiv/
├── glamour/
├── home/
├── item-card/
├── plate/
├── silence/
└── style-lab/
```

| 页面目录     | 当前状态                                                             |
| ------------ | -------------------------------------------------------------------- |
| `home/`      | 首页占位视觉已接入；首页有页面专属舞台，不作为全站公共组件默认外观。 |
| `ffxiv/`     | FFXIV 分类页已接入，读取 `site.ts` 中的工具列表。                    |
| `fashion-check/` | 时尚品鉴当前周方案、金牌物品和来源页面已接入。                   |
| `glamour/`   | NSGlamour EquipInfo/Template 双工作台已接入：共享草稿、导入/编辑、六套 Canvas 模板、图片裁剪/暂存和 PNG 导出均在模块内维护；数据与导入契约由本仓库 `server/glamour/` 的 Flask API 提供。 |
| `item-card/` | 独立物品卡片导入、编辑和多种导出工作台已接入。                     |
| `plate/`     | 铭牌工房核心工作台已接入，包含静态 manifest 数据源、Canvas 预览、信息层、配置传输和 PNG/JPG/分层 ZIP。 |
| `armoire/`   | 公网教程/下载页和 `armoire-local` 完整工作台共存，通过构建模式隔离。 |
| `about/`     | About 占位页已接入。                                                 |
| `silence/`   | 双入口、分组、角色详情和本地数据已接入；资料未完成，当前暂不上线。   |
| `style-lab/` | 隐藏内部样式探索页，不写入公开导航。                                 |

`SilenceCharacterPage.vue` 和 `src/data/silence/` 已建立；正式资料完成度、资产授权和恢复上线条件见 `docs/ai/MODULES/silence.md`。

## 当前注册路由和公开边界

已接入代码的路由：

```text
#/
#/ffxiv
#/ffxiv/glamour
#/ffxiv/plate
#/ffxiv/armoire
#/ffxiv/fashioncheck
#/ffxiv/fashioncheck/tags
#/ffxiv/fashioncheck/sources
#/ffxiv/item-card
#/silence
#/silence/angel
#/silence/angel/:characterId
#/silence/glitch
#/silence/glitch/:characterId
#/about
#/style-lab
```

说明：

- `#/style-lab` 是隐藏内部样式探索页，不写入公开导航。
- Silence 入口、分组和详情路由已接入代码，但当前不纳入公开上线范围。
- 不再规划公开 `#/oc` 路由；`OC` 只作为内部内容类型和讨论术语。

## 样式结构

```text
src/styles/
├── reset.css
├── theme.css
├── base.css
├── components.css
├── utilities.css
├── index.css
└── experiments/
    └── pixel-soft.css
```

规则：

- `index.css` 只负责汇总导入。
- 全站正式视觉固定为像素风，基础样式放在 `reset`、`theme`、`base`、`components`、`utilities`。
- `day / night` 只是像素风的明暗配色模式，不是第二套主题系统。
- 实验样式放在 `styles/experiments/`。
- 实验样式必须通过容器选择器隔离，例如 `[data-style-preview='pixel-soft']`。
- 首页人物舞台、贴纸和浮动图标是页面专属视觉；`pixel-soft` 是内部像素风强度试验，不是用户可切换主题。

## Style Lab 当前作用

`#/style-lab` 用于比较像素风强度、工具工作台密度和单页特殊风格，不是公开主题切换系统。

当前包含：

- `pixel-soft`：粉蓝像素、窗口控件、弹窗菜单、轻像素工作台样例。

边界：

- 不写入首页、顶部导航或公开入口。
- 不覆盖全局标签默认样式。
- 不直接影响 FFXIV 工具迁移页。

## 后续维护规则

- 新增复杂页面前，优先建立或更新 `docs/ai/MODULES/*.md`。
- 接入新公开路由时，同步更新 `src/config/site.ts`、`src/router/index.ts`、`docs/ai/MODULE_MAP.md`。
- 调整目录职责时，同步更新本文档。
- 不再创建只有 README 的候选空目录；除非该 README 本身就是长期有效的模块说明。
- 运行格式化前先确认范围，不要格式化无关文件。
- 公开页面中未确认文案继续使用 `占位用，待编辑`。
