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

当前主线仍是整体 V2 迁移：`NSPlate` 已进入核心工作台收口，`NSGlamour` 仍待旧业务迁移，`NSArmoire` 正在按本地 helper / snapshot 路线推进。`Silence` 已完成入口转正和分组/部分角色页接入，但正式角色资料和正式素材不进入当前迁移主线。

| 工具        | 目标路由          | 当前状态                | 下一步                                               |
| ----------- | ----------------- | ----------------------- | ---------------------------------------------------- |
| `NSPlate`   | `#/ffxiv/plate`   | 核心工作台、静态 manifest、Canvas 预览、信息层和主要导入导出已接入 | 补全全量回归矩阵、像素状态图标规划、字体授权和生产部署 smoke。 |
| `NSGlamour` | `#/ffxiv/glamour` | 占位页和 API 边界已接入 | 盘旧 Flask 接口、装备/染剂样本、导入和模板数据契约。 |
| `NSArmoire` | `#/ffxiv/armoire` | 第一阶段本地 helper / snapshot 工作台已接入 | 稳定 catalog、helper 和公开页面降级策略。 |

`NSGlamour` 或其他尚未迁移旧业务的工具，后续开工方式仍以 `docs/ai/MIGRATION_PLAN.md` 的“阶段 2.5：NSPlate / NSGlamour 共同契约盘点”为参考；`NSPlate` 已完成该阶段的大部分契约盘点和核心迁移，应以 `docs/ai/MODULES/nsplate.md` 的剩余计划为准。

对尚未迁移工具的通用开工顺序：

1. 先确认旧服务和 V2 代理可用。
2. 同步补齐对应 `docs/api/` 契约的真实字段和样本。
3. 再选择一个第一段可见迁移切片。

`Silence` 目前只完成最小入口闭环，不进入本轮角色档案业务实现。

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
| `src/router/index.ts`           | 路由表              | 使用 hash router；当前只接入已有公开页面和隐藏 Style Lab。                   |
| `src/config/site.ts`            | 站点配置            | 维护站点名称、当前公开路由、导航入口、FFXIV 工具信息和占位文案。             |
| `src/components/`               | 公共组件            | 当前包含按钮、面板、像素窗口、顶栏、表单字段、工具栏、选项卡和状态提示组件。 |
| `src/composables/useFetch.ts`   | 请求封装            | 支持 query、json body、responseType、`createClient(basePath)`。              |
| `src/services/apiBoundaries.ts` | API 边界描述        | 当前服务 NSGlamour、NSPlate legacy fallback、NSArmoire helper 等边界。         |
| `src/stores/locale.ts`          | Pinia store         | 当前接入 UI 文案、`document.lang`、语言切换和标题刷新。                       |
| `src/pages/`                    | 页面组件            | 按页面或分类拆目录，不把复杂业务堆进单文件。                                 |
| `src/styles/`                   | 全局 CSS 和实验样式 | 全站样式分层，候选样式通过实验文件隔离。                                     |

## 当前 pages 目录

```text
src/pages/
├── about/
├── ffxiv/
├── glamour/
├── home/
├── plate/
├── silence/
└── style-lab/
```

| 页面目录     | 当前状态                                                             |
| ------------ | -------------------------------------------------------------------- |
| `home/`      | 首页占位视觉已接入；首页有页面专属舞台，不作为全站公共组件默认外观。 |
| `ffxiv/`     | FFXIV 分类页已接入，读取 `site.ts` 中的工具列表。                    |
| `glamour/`   | NSGlamour EquipInfo/Template 双工作台已接入：共享草稿、导入/编辑、六套 Canvas 模板、图片裁剪/暂存和 PNG 导出均在模块内维护；仍通过旧 Flask API 提供数据与导入契约。 |
| `plate/`     | 铭牌工房核心工作台已接入，包含静态 manifest 数据源、Canvas 预览、信息层、配置传输和 PNG/JPG/分层 ZIP。 |
| `about/`     | About 占位页已接入。                                                 |
| `silence/`   | Silence 双入口门厅页和 `angel` / `glitch` 分组占位页已接入。          |
| `style-lab/` | 隐藏内部样式探索页，不写入公开导航。                                 |

`Silence` 单角色详情页和 `src/data/silence/` 角色数据尚未创建，详见 `docs/ai/MODULES/silence.md`。

## 当前公开路由和规划路由

已接入代码的路由：

```text
#/
#/ffxiv
#/ffxiv/glamour
#/ffxiv/plate
#/silence
#/silence/angel
#/silence/glitch
#/about
#/style-lab
```

说明：

- `#/style-lab` 是隐藏内部样式探索页，不写入公开导航。
- `#/silence`、`#/silence/angel`、`#/silence/glitch` 已接入代码；单角色详情路由尚未接入。
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
