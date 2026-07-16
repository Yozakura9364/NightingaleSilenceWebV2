# 夜莺不语 网页 前期规划

## 项目核心定位

- 本项目以当前仓库根目录为准；用户本机当前工作区路径为：`H:\NightingaleSilenceWeb\NightingaleSilenceWebV2`
- 站点愿景源文档是 `docs/OWNER_VISION.md`，这是用户手写的高层产品/内容方向。
- 夜莺不语 / Nightingale Silence 是个人/工具网站，可承载多个分类，包括工具、博客和创作信息。
- 当前第一阶段分类是 `FFXIV`，路径为 `#/ffxiv`。
- FFXIV 类工具以还原《最终幻想14》游戏内数据为核心，依赖游戏客户端数据解构，需要尽可能还原游戏内体验，数据必须严谨。
- FFXIV 类工具依靠不同语言的游戏客户端数据实现多语言切换功能，同时进行少量界面文字本地化。
- 一整套网页项目使用统一 Vue 前端和 Vue Router，实现页面构建与丝滑切换。
- 该项目必须使用本项目指定的 GitHub 账号进行 `gh` 推送和操作；若当前登录态或提交身份不匹配，必须立即停止。
- 本网页项目与其他发布项目使用不同账号。两个项目的 GitHub CLI 登录态、Git 远端认证、Git commit 作者和 Git commit 提交者都必须分别对应自己的项目账号，不能混用；具体账号映射仅保留在本地未跟踪说明中。

## 工作流程

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
9. 推送前必须扫描待公开 Git 历史和引用：`git log --all --format="%an <%ae> %cn <%ce>"`、`git for-each-ref refs/heads refs/remotes refs/tags`。如果作者、提交者、tag 或历史引用中出现错误项目账号，必须立刻停止，不能推送。
10. GitHub 贡献者统计会读取 commit 作者/邮箱，不只读取 `gh` 当前登录态；因此重建仓库、迁移仓库、创建 tag 或 release 前，都必须同时核对 `gh` 登录态、Git 本地身份、历史 commit 和 tag/ref。
11. 当我已经同意当前改动，并要求“继续”“继续推进”“继续向后推”或进入下一阶段时，必须先问我是否需要把当前改动提交 commit / 推送 GitHub；除非我已经明确说不要提交或只继续本地开发。

## CSS 和组件规则

CSS 架构、公共组件优先级和页面 scoped style 边界，以 `docs/ai/ARCHITECTURE_PLAN.md` 的“主题和 CSS 策略”“组件策略”为准。`AGENTS.md` 只保留入口提醒，避免两处规则重复漂移。

## 验证规则

1. 修改后必须尽量运行项目已有的检查、测试、构建或启动验证。
2. 前端 UI 修改应尽量通过浏览器实际查看。
3. 后端/API 修改应尽量验证接口返回和错误处理。
4. 如果无法运行验证，必须明确说明原因和残余风险。
5. 前端页面验证可以使用本机已安装的 Playwright；不要只因为当前项目没有把 `playwright` 写进 `package.json` 或本地 `node_modules` 就判定不可用。
6. 本机已确认存在全局 npm Playwright：`C:\Users\13359\AppData\Roaming\npm\playwright.cmd`，模块目录为 `C:\Users\13359\AppData\Roaming\npm\node_modules\playwright`。也存在 Python 入口 `C:\Users\13359\AppData\Local\Programs\Python\Python314\Scripts\playwright.exe`，但 Vue/Node 项目优先使用 npm 全局入口。
7. 使用 Playwright 前先检查可用入口：`Get-Command playwright`、`where.exe playwright`、`npm ls -g playwright --depth=0`。如果需要在 Node 脚本里 `require('playwright')`，先设置 `$env:NODE_PATH = (npm root -g)`；如果通过 Node REPL MCP 使用，先把全局 `node_modules` 加入模块搜索路径。
8. 全局 Playwright 默认 bundled Chromium 可能缺失；优先使用系统 Chrome：`& "$env:APPDATA\npm\playwright.cmd" screenshot --channel chrome --wait-for-timeout 3000 --viewport-size 1440,900 "<url>" "$env:TEMP\<name>.png"`，或在脚本中使用 `chromium.launch({ channel: 'chrome' })`。
9. 不要为了浏览器验证擅自把 Playwright 加入项目依赖或运行 `playwright install` 下载浏览器；除非任务确实需要并得到用户确认。

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
| `docs/OWNER_VISION.md`                | 每次新会话必读，确认用户手写的站点愿景和范围            |
| `docs/ai/PROJECT_CONTEXT.md`          | 每次新会话必读                                          |
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
