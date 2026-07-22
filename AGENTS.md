# 夜莺不语 网页 前期规划

## 项目核心定位

- 本项目以当前仓库根目录为准，不在公共规则中硬编码个人机器的绝对路径。
- 站点愿景源文档是 `docs/OWNER_VISION.md`，这是用户手写的高层产品/内容方向。
- 夜莺不语 / Nightingale Silence 是个人/工具网站，可承载多个分类，包括工具、博客和创作信息。
- 当前第一阶段分类是 `FFXIV`，路径为 `#/ffxiv`。
- FFXIV 类工具以还原《最终幻想14》游戏内数据为核心，依赖游戏客户端数据解构，需要尽可能还原游戏内体验，数据必须严谨。
- FFXIV 类工具依靠不同语言的游戏客户端数据实现多语言切换功能，同时进行少量界面文字本地化。
- 一整套网页项目使用统一 Vue 前端和 Vue Router，实现页面构建与丝滑切换。
- 该项目必须使用本项目指定的 GitHub 账号进行 `gh` 推送和操作；若当前登录态或提交身份不匹配，必须立即停止。
- 本网页项目与其他发布项目使用不同账号。两个项目的 GitHub CLI 登录态、Git 远端认证、Git commit 作者和 Git commit 提交者都必须分别对应自己的项目账号，不能混用；具体账号映射仅保留在本地未跟踪说明中。

## 任务路由器

- 每次新会话先读 `docs/OWNER_VISION.md` 和 `docs/ai/PROJECT_CONTEXT.md`。
- 任何实现、修复、重构、迁移、提交或发布任务都按 `AGENT_WORKFLOW.md` 执行。
- skills 只作为专项能力入口；如果当前环境没有对应 skill，必须回退到仓库内文档和现有脚本，不能因此跳过验证。

| 任务信号 | 必读文档 | 优先工具 / skill | 最低验证 |
| --- | --- | --- | --- |
| 完整新功能、跨模块规格 | `AGENT_WORKFLOW.md`、架构、模块地图和对应模块文档 | `speckit-*` skills（若可用）；否则使用计划阶段 | 用户确认计划 + 分阶段验证 |
| NSPlate、铭牌、Canvas、图层 | `docs/ai/MODULES/nsplate.md`、`docs/ai/MODULES/nsplate-regression.md`、`docs/ai/WORKBENCH_STYLE_CONTRACT.md` | 现有 plate scripts；可用时使用 NSPlate 专项 skill | 模块回归 + 真实页面/导出 |
| NSGlamour、幻化、装备、染剂、模板 | `docs/ai/MODULES/nsglamour.md`、`docs/ai/API_CONVENTIONS.md`、`docs/ai/WORKBENCH_STYLE_CONTRACT.md` | `nsglamour-*` skills（若可用） | 契约检查 + 对应工作台实测 |
| FFXIV CSV、映射、静态数据部署 | `docs/ai/MODULES/ffxiv.md`、`docs/ai/data/ffxiv/README.md` 和目标模块文档 | 映射/CSV deploy skills（若可用）和现有生成器 | 生成器 + checker + 页面实际读取 |
| 物品卡片 | `docs/ai/MODULES/item-card.md`、`docs/ai/API_CONVENTIONS.md` | 现有 item-card / glamour API 边界 | 导入、编辑和导出实测 |
| 时尚品鉴 | `docs/ai/MODULES/fashion-check.md`、`docs/ai/FASHION_CHECK_WEEKLY_MAINTENANCE.md` | fashion-check 生成器与 checker | 历史检查 + 当前公开页面 |
| 衣柜管家 | `docs/ai/MODULES/nsarmoire.md`、`docs/api/nsarmoire.md` | helper / catalog scripts | 对应构建模式 + 页面/helper 状态 |
| 首页、Silence、视觉与响应式 | 对应 `docs/ai/MODULES/` 文档、`docs/ai/STYLE_AUDIT.md` | Playwright + 系统浏览器 | 桌面实测；涉及响应式时增加移动端 |
| 公共样式、组件、路由、架构 | `docs/ai/ARCHITECTURE_PLAN.md`、`docs/ai/CODE_STRUCTURE_RULES.md`、`docs/ai/MODULE_MAP.md` | `rg`、类型检查、页面回归 | 所有受影响入口 |
| 文档、review、提交、发布 | `AGENT_WORKFLOW.md`、文档契约、评估/部署指南 | `rg`、git staged audit、现有 npm scripts | 文档一致性或完整发布检查 |

## 工作流程

`AGENT_WORKFLOW.md` 是标准 session 流程的单一来源；以下只保留不可绕过的项目门槛。

1. 对于完整功能、重构、删除代码、跨文件修改、跨项目联调、架构调整，必须先进入计划阶段。
2. 计划阶段只读分析，不允许直接修改业务代码。
3. 计划阶段必须说明：当前项目、技术栈、已读取文件、需求理解、涉及文件、实施步骤、风险点、验证方式。
4. 在我确认计划前，不允许开始大范围修改代码。
5. 小范围明确修复可以直接修改，但仍然必须先阅读相关文件，不允许凭空写代码。
6. 修改代码时不要顺手重构无关文件。
7. 不要格式化无关文件。
8. 不要引入新依赖，除非先说明原因、影响、替代方案，并得到我确认。
9. 修改完成后必须总结：改了哪些文件、为什么这样改、是否影响现有功能、运行了哪些验证、是否还有风险。

## 文档规则

1. `AGENTS.md` 是项目级长期规则，不是一次性需求文档。
2. 只有长期有效、对后续开发有帮助的规则，才适合写入 `AGENTS.md`。
3. 不要把临时需求、一次性 bug、个人猜测写入 `AGENTS.md`。
4. 如果发现项目缺少长期文档，可以建议补充 `docs/ai/`、模块说明、接口说明、部署说明或排障说明。
5. 文档必须基于当前项目真实结构编写，不要凭空生成漂亮但不准确的说明。
6. 文档摘要、事实来源、更新触发和自愈流程统一遵守 `docs/ai/DOCUMENTATION_CONTRACT.md`。
7. 实现导致路由、模块状态、API、数据源、公开边界或验证方式变化时，必须在同一任务同步对应文档。

## 删除和重构规则

1. 删除代码前必须先证明代码未被使用。
2. 至少检查：源码引用、模板引用、样式引用、路由引用、动态 import、字符串调用、配置文件、测试文件和外部接口兼容风险。
3. 对无法确认无用的代码，不允许删除，只能标记为疑似无用。
4. 大范围重构必须先给出计划、影响范围、迁移方案和回滚方案。
5. 重构必须保持现有业务行为不变。

## 开发规则

1. 优先保持当前项目已有架构、目录、命名、样式、组件和接口习惯。
2. 优先复用当前项目已有公共组件、工具函数、服务封装、样式体系和验证方式。
3. 不要为了“更现代”而强行迁移技术栈。
4. 不要把简单 bug 修复扩大成架构重构。
5. 不要把视觉调整扩大成业务逻辑改造。
6. 涉及用户输入、上传、鉴权、部署、环境变量、外部 API 时，必须保守处理并说明风险。
7. 涉及公开网站内容时，注意隐私、检索暴露、密钥、路径、内部说明和不该公开的信息。
8. 新功能、新页面或占位 UI 中，除非用户已经提供明确文案，AI 不要自行编写正式展示文案；由 AI 生成的临时展示文案统一使用 `占位用，待编辑`。用户已确认的品牌名、项目名、工具名、路由名和必要技术标识可以保留。
9. 全站用户可见的固定 UI 文案、按钮文字、状态文字、aria-label、title、placeholder 和弹窗标题必须通过本地化 key 读取；不要在 Vue 模板或组件脚本中直接写死展示文案。

## 资产和提交规则

1. 用户没有明确声明“可以提交进项目 / 可以公开使用”的图片资产，都不允许提交、推送或放入构建产物；包括但不限于 `.png`、`.jpg`、`.jpeg`、`.webp`。
2. 用户只说“放在本地试试”“先用一下看看”“不要上传”的图片，一律视为本地预览资产。此类图片应通过 `.gitignore`、开发环境限定引用或其他本地方案处理，不要静态 import，不要移动到已跟踪的 `src/assets` 或 `public` 目录。
3. `icon-drafts/` 是本地图标实验和导出草稿目录，必须保持 `.gitignore` 忽略状态，不提交、不推送、不进入构建产物。
4. 提交前必须检查 `git status --short`、`git diff --cached --name-only` 和 staged diff，确认没有未授权图片、其他对话的改动、无关文件或临时调试内容。
5. 同一工作区可能同时存在多个对话或模块的未提交改动。提交时只 stage 当前任务明确相关的文件或 hunk；如果共享文件里混有其他任务改动，必须使用分块暂存，只提交本次对话范围内的修改。
6. 推 commit 或推送 GitHub 时，commit message、推送说明和最终总结必须使用中文，并写清楚本次详细改动范围、验证结果和残余风险；不要只写含糊的英文短句。
7. 推送 GitHub 前必须检查 `gh` 登录态账号，确认 `gh auth status` 或 `gh api user --jq .login` 显示的是本项目指定账号；不得使用其他 GitHub 账号推送本项目。
8. 推送 GitHub 前还必须检查本地 Git 提交身份，不能只检查 `gh` 登录态。必须确认 `git config --local user.email` 或有效 Git 配置对应的是本项目指定账号，不得使用其他项目账号的 commit 作者或提交者。
9. 普通增量推送必须扫描实际待推送范围（通常为 `origin/<branch>..HEAD`）的作者和提交者，并核对本次会更新的 refs；既有远端历史只记录为基线，不因旧身份阻塞无关增量推送。
10. 重建仓库、迁移远端、force push、创建 tag 或 release 前，必须扫描完整历史和所有 refs：`git log --all --format="%an <%ae> %cn <%ce>"`、`git for-each-ref refs/heads refs/remotes refs/tags`。如果待公开的新历史或引用中出现错误项目账号，必须停止。
11. 当我已经同意当前改动，并要求“继续”“继续推进”“继续向后推”或进入下一阶段时，必须先问我是否需要把当前改动提交 commit / 推送 GitHub；除非我已经明确说不要提交或只继续本地开发。
12. `gh` 身份检查必须与实际 push 在同一执行边界中完成；沙箱内检查不能代表宿主机 keyring 或沙箱外状态。
13. 账号不匹配或认证失败时，只能停止并报告。未经我针对凭据操作的明确授权，不得执行 `gh auth login`、`gh auth logout`、`gh auth switch`、读取凭据、删除凭据或自动重试认证。
14. 经我明确要求启动认证时，只允许一个可见且可追踪的流程，必须记录 PID，并在成功、失败、超时或中止后清理本次启动的进程。事故复盘和完整规程见 `docs/ai/GIT_AUTH_INCIDENT_POSTMORTEM.md`。

## CSS 和组件规则

CSS 架构、公共组件优先级和页面 scoped style 边界，以 `docs/ai/ARCHITECTURE_PLAN.md` 的“主题和 CSS 策略”“组件策略”为准。`AGENTS.md` 只保留入口提醒，避免两处规则重复漂移。

## 验证规则

1. 行为代码修改后必须运行项目已有的针对性检查、测试或构建，不能只静态阅读。
2. 前端 UI、交互、路由或样式修改必须启动或复用真实应用，并通过浏览器执行对应用户路径；不能只以构建成功代替页面验证。
3. 后端/API 修改必须请求真实接口并验证成功与错误分支；数据生成修改必须运行生成器和 checker。
4. 仅 Markdown、注释、gitignore 或不影响运行时的项目规则可以不启动应用，但仍需做路径/引用核对和 `git diff --check`。
5. 如果无法运行要求的验证，必须明确说明具体原因、替代验证和残余风险。
6. 前端页面验证可以使用全局 Playwright；不要只因为项目没有声明 Playwright 依赖就判定不可用。
7. 使用前先检查 `Get-Command playwright`、`where.exe playwright`、`npm ls -g playwright --depth=0`；Node 脚本需要全局模块时可设置 `$env:NODE_PATH = (npm root -g)`。
8. bundled Chromium 缺失时优先使用系统 Chrome channel。机器专属路径写入 ignored `docs/ai/LOCAL_ENVIRONMENT.md`，不写入公共规则。
9. 不要为了浏览器验证擅自加入 Playwright 依赖或运行 `playwright install`；除非任务确实需要并得到用户确认。

## AI 工作流本地化沉淀

ECC 的 rules / skills / hooks / agents 思路已吸收为长期参考，但本项目不要求每次新任务都访问外部 ECC 仓库。

后续如果发现重复纠正或高频流程，应优先沉淀到本项目本地文档和规则中：

1. **长期规则**：写入 `AGENTS.md` 或 `docs/ai/`，只记录长期有效内容。
2. **可复用流程**：写入 `docs/ai/` 的专题文档，例如迁移流程、页面开发流程、API 约定、部署说明。
3. **自动化检查**：如果某个检查反复需要人工提醒，优先考虑 npm script、测试、lint、类型检查或本地脚本。
4. **模块知识**：复杂页面或迁移模块写入 `docs/ai/MODULES/`，避免把入口文档写成流水账。
5. **外部参考**：只有当本地文档不足、且任务确实需要重新参考 ECC 思路时，才临时访问外部仓库。

---

## AI 文档库

每次开始任务前，必须读取以下文档（按需，不必全读）：


| 文档                                  | 何时读                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| `AGENT_WORKFLOW.md`                   | 每次实现、修复、重构、迁移、提交或发布任务              |
| `docs/OWNER_VISION.md`                | 每次新会话必读，确认用户手写的站点愿景和范围            |
| `docs/ai/PROJECT_CONTEXT.md`          | 每次新会话必读                                          |
| `docs/ai/DOCUMENTATION_CONTRACT.md`   | 新增、重写或发现项目文档与代码不一致                    |
| `docs/ai/ARCHITECTURE_PLAN.md`        | 涉及架构、路由、样式体系、后端集成策略                  |
| `docs/ai/STYLE_AUDIT.md`              | 涉及全站样式审计、公共 token、顶栏弹窗和 Style Lab 边界 |
| `docs/ai/CODE_STRUCTURE_RULES.md`     | 涉及复杂业务拆分、模块边界、重构、防止单文件膨胀        |
| `docs/ai/WORKBENCH_STYLE_CONTRACT.md` | 涉及 NSPlate、NSGlamour 等工房类复杂工具页工作台样式    |
| `docs/ai/MIGRATION_PLAN.md`           | 涉及 NSHome、NSPortable、NSGlamour 迁移顺序和边界       |
| `docs/ai/MODULE_MAP.md`               | 涉及跨页面/跨模块修改                                   |
| `docs/ai/API_CONVENTIONS.md`          | 涉及 API 调用                                           |
| `docs/ai/REVIEW_GUIDE.md`             | 涉及项目评估、外部 review、当前状态说明                 |
| `docs/ai/PAGE_DEVELOPMENT_GUIDE.md`   | 新增页面或组件                                          |
| `docs/ai/MODULES/*.md`                | 涉及对应模块的深度修改                                  |

如果发现文档与代码不一致，优先以代码为准，并在总结中提出文档更新建议。
