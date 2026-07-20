---
summary: "Silence 入口、分组舞台、角色档案、资料和本地预览资产边界。"
status: "active"
scope: "#/silence、angel/glitch 分组和角色详情页。"
source_of_truth: "src/pages/silence、src/data/silence、router 和用户确认资料。"
read_when: "修改 Silence 页面、角色导航、资料结构、视觉或素材。"
update_when: "路由、角色、正式资料、页面架构或资产授权状态变化时。"
verify: "实测入口、分组、详情翻页及桌面/移动布局，扫描构建资产。"
---

# Silence 角色档案模块计划

## 当前状态

- 模块状态：`#/silence` 左右分割海报式入口页、`#/silence/angel` 全屏分组舞台、`#/silence/glitch` 幽灵双人页，以及 `angel` 六个角色的详情页动态路由、多区块测试数据骨架和详情页私有组件已接入；当前导航方向已改为横向翻页蒙版 + 点击立绘跳页；Salvance 首版正式资料已接入本地数据层并可在详情页渲染，`glitch` 两个 meta 角色已确认命名为 `ヨイン / Yoin` 和 `宵音 / よいね / Yoine`，但当前不拆单人详情页。角色资料、正式文案和正式素材尚未填写完成，整个模块当前只用于本地开发和资料录入，不纳入公开上线范围。
- 构建边界：`VITE_ENABLE_SILENCE` 在 `vite dev` 中默认开启，在任何普通 `vite build` 中默认关闭；关闭时 Router、首页/顶栏入口和 Silence 本地化消息包同步排除，release checker 还会拒绝残留的 Silence chunk。
- 计划入口路由：`#/silence`。
- 推荐分组路由：`#/silence/angel`、`#/silence/glitch`。
- 推荐详情路由：`#/silence/angel/:characterId`；`#/silence/glitch/:characterId` 作为未来预留，当前 `glitch` 组先共用 `#/silence/glitch` 双人页。
- 已接入页面入口：`src/pages/silence/SilenceIndexPage.vue`、`src/pages/silence/SilenceGroupPage.vue`。
- 单角色页面入口：`src/pages/silence/SilenceCharacterPage.vue`。
- 当前本地开发环境下，入口海报、`angel` 分组舞台和单角色详情页都会读取 `characters.ts` 中的 dev-only 立绘路径；生产环境或缺图时回退为占位视觉。
- 模块类型：创作信息分类 / 原创角色档案 / 角色图鉴。
- 当前不涉及后端 API。
- 当前正式展示文案只接入用户已提供的 Salvance wiki 笔记片段；页面骨架中未由用户提供的公开文案统一使用 `占位用，待编辑`。当前其他五个 `angel` 角色仍只作为测试数据骨架，用于即时检查模板、路由和排版。
- 结构、耦合、服务器资源和图片流量优化计划见 `docs/ai/MODULES/silence-optimization-plan.md`。
- 角色正式资料 schema、Salvance wiki 样例提取和目录角色映射待确认项见 `docs/ai/MODULES/silence-character-data-schema.md`。

## 定位

`#/silence` 是夜莺不语站点中“创作信息”的分类入口之一，用于承载原创角色档案、作品或世界观分组、角色关系、设定资料和创作记录。公开路由不使用 `#/oc`；`OC` 只作为内部内容类型和讨论术语存在。

该模块不属于 `FFXIV` 工具分类，也不依赖游戏客户端数据解构。它应作为整站可扩展分类存在，与 `#/ffxiv` 并列，而不是放在 `#/about` 里作为个人介绍的一部分。

## 内容分层规则

Silence 模块第一层按角色所属叙事层分组，不按世界观分组。主 OC 可以跨越西幻、赛博、现实、未来等不同世界观，因此世界观应作为角色内部的世界线或版本信息，而不是总览页的主分类。

- `angel`：六个主 OC，公开分组名为 `不语·silence`。这是作品 / 档案层，重点呈现角色本体、世界线、关系和创作资料。
- `glitch`：两个赛博幽灵 / 皮套角色，公开分组名为 `幽灵·silence`。这是站点 meta 层，重点呈现站点外壳、界面幽灵、像素、故障和入口感。

像素 / 赛博幽灵风格属于站点 meta 层，主要服务首页与 `glitch` 角色；`angel` 组的六个主 OC 使用独立档案视觉，避免被全站像素风同化。

`angel` 命名用于表达这六个角色的重要性，不引入宗教、圣所、祭坛或崇拜语义。公开表现应偏向“横向群像主视觉 / 全员同屏 / 立绘舞台”，而不是神圣化叙事。

## angel 外壳 / 正文视觉边界

`angel` 组的像素感只作为“网页入口”和“站点 meta 外壳”存在，不作为角色正文内容的美术风格。也就是说，用户打开网页时可以感受到 Nightingale Silence 这个网站的界面、翻页、入口和轻微像素外壳，但进入角色详细资料后，看到的内容应是正规角色档案、设定集或日漫官网角色页风格。

实现边界：

- `#/silence`、`#/silence/angel`、左右翻页蒙版、全局顶栏、页面转场和少量入口装饰可以保留像素 / meta / 网页外壳感。
- `#/silence/angel/:characterId` 的首屏可以保留少量“打开网页后进入档案”的界面感，但主视觉仍应以角色立绘、角色名、别名和档案入口为核心。
- 单角色页向下滚动后的正文资料区，例如 `人物概览`、`基本设定`、`形态`、`衣装设定`、`战斗能力`、`人物经历`，应使用正规档案视觉，不再使用强像素字体、像素工作台按钮、硬边框面板和密集网格作为主要视觉语言。
- `glitch` 组才是像素、故障、窗口、网页幽灵和界面残影可以强化的地方；不要把 `glitch` 的 meta 风格默认扩散到 `angel` 正文。
- 全站公共像素风控件可以作为最低限度的导航和焦点态存在，但不应吞掉 `angel` 角色内容本身的美术气质。

正文资料区建议视觉关键词：

- 正规角色官网 / 角色设定集 / 档案纸，而不是像素工具页。
- 清爽留白、细分隔线、轻量 tab、杂志式标题层级、角色代表色作为局部强调。
- 正文使用易读的普通无衬线或轻微编辑感字体；像素字体只允许作为极少量 meta 标记、角标或外壳装饰。
- 信息块应更像资料排版、设定栏目、图文板块；避免每个内容都变成方框卡片、像素按钮或工房面板。

路由层级建议：

```text
#/                  Home 纯视觉首页
#/ffxiv             FFXIV 工具分类
#/silence           Silence 创作入口
#/silence/angel     不语·silence，六个主 OC
#/silence/glitch    幽灵·silence，两个 meta 角色
#/silence/angel/:characterId   单个主 OC 档案
#/silence/glitch/:characterId  预留的单个幽灵角色档案，当前不启用
#/about             关于页面
```

## 已确认横向翻页规则

Silence 模块当前采用线性横向翻页结构，而不是常规“返回 / 进入”按钮结构。页面边缘通过 hover、focus 或点击区域出现渐变蒙版，引导用户向左或向右翻页；蒙版不显示成窗口、卡片或固定按钮。

当前从左到右的顺序为：

```text
goelia → glynne → chihaya → ney → nightingale → salvance → angel页 → silence页 → glitch页（Yoin & Yoine 双人页）
```

对应反向阅读时就是：

```text
goelia ← glynne ← chihaya ← ney ← nightingale ← salvance ← angel页 ← silence页 → glitch页（Yoin & Yoine 双人页）
```

实现规则：

- `#/silence` 保持全屏左右分割海报，但左右两块不再作为普通卡片链接；用户通过左/右边缘渐变蒙版进入 `#/silence/angel` 或 `#/silence/glitch`。
- `#/silence/angel` 的六人立绘是主要可点击目标；点击某个立绘直接进入对应 `#/silence/angel/:characterId`。
- `#/silence/angel/:characterId` 首屏保留角色主视觉和基础档案入口，继续向下滚动查看详情区；左右边缘蒙版用于切换相邻角色或回到 `angel` 分组页。
- 当前已经确认的 `angel` 角色只有 `goelia`、`glynne`、`chihaya`、`ney`、`nightingale`、`salvance`。`glitch` 角色已确认命名为 `ヨイン / Yoin` 和 `宵音 / よいね / Yoine`，但两者当前作为同一组屏幕幽灵 / 界面异常呈现，暂时不创建单人详情页。
- Silence 入口、分组页和角色详情页都不再放置可见的 `返回` / `进入` 按钮；必要的跳转只通过边缘翻页蒙版、角色立绘、详情内容内部链接或浏览器历史完成。

## 已确认角色形态规则

同一角色的多种形态不创建新的横向翻页节点，也不占用相邻角色位置。角色 ID 仍保留为角色本体，例如 `salvance`；形态通过查询参数表达，例如：

```text
#/silence/angel/salvance?form=sorence
```

实现规则：

- `characterId=salvance` 仍代表沙乐万这个角色，`form=sorence` 只代表当前展示形态。
- 左右边缘翻页蒙版继续用于 Silence 线性阅读顺序，例如 `nightingale ← salvance ← angel页`，不用于形态切换。
- 形态切换应放在角色页详情区的“形态”区块，不放在首屏资料卡；首屏始终展示角色本体身份。
- 切回角色本体时移除 `form` 查询参数，回到 `#/silence/angel/salvance`。
- `form` 查询参数只作为详情区深链接 / 默认选中状态，不改变横向翻页邻居，也不把形态伪装成另一个角色页。
- 形态资料放在角色数据下，不为每个形态单独创建 `SorencePage.vue`。
- 角色详情核心资料顺序当前确认为：`人物概览 → 基本设定 → 形态 → 衣装设定`；战斗能力、人物经历等后续区块可按角色资料继续保留。
- 衣装通过 `formIds` 记录归属形态，例如沙乐万常态可有公式服、高阶战斗服、正装、家居服，索伦斯可有自己的异化默认造型；但衣装区的浏览状态不跟随上方“形态”区自动切换，用户需要在衣装区内单独选择对应衣装。

## 参考方向

本模块可以参考日漫官网角色介绍页的信息架构，但只参考结构和体验，不复刻具体美术、素材、文案或品牌表达。

- `https://needygirl-anime.com/cn/`：适合参考“角色列表 + 大立绘 + Profile 信息 + 角色切换”的浏览体验。若第一阶段角色数量较少，可以做成一页里快速切换角色的形式。
- `https://frieren-anime.jp/character/`：适合参考“按阵营、种族、作品阶段或世界观分组”的角色索引。若后续角色数量较多，分组索引比单纯长列表更稳定。
- `https://bocchi.rocks/omnibus/character/`：适合参考“角色身份、团队职能或能力定位标签”的表达方式。若 OC 有职业、阵营、能力、作品定位，可以把这些作为卡片首屏信息。

## 页面形态建议

### Silence 入口页和分组页

`#/silence` 负责 `不语·silence` 与 `幽灵·silence` 两组总览，不承担单个角色的完整长档案。`#/silence/angel` 与 `#/silence/glitch` 负责组内角色列表和组内视觉气质。

当前已接入的 `#/silence` 第一版采用“双入口门厅”结构，但视觉形态应是一张左右分割的大海报，而不是两个完全独立的卡片。海报应铺满 `#/silence` 的可视区域，不放在页面中间的受限展示框里；Silence 标题和占位说明作为海报上的浮层处理。左侧约三分之二给 `不语·silence`，用抽象六人群像或后续正式立绘暗示六个主 OC；右侧约三分之一给 `幽灵·silence`，用两个像素 / 故障 / 窗口化角色占位暗示两个 meta 角色；中间使用柔和渐变、像素扫描线或轻微故障切口过渡，不做生硬黑色分割线。

`#/silence` 仍然不直接承担八个角色的完整索引，不把所有角色信息平铺出来。当前入口通过左右边缘渐变蒙版翻页：左侧进入 `#/silence/angel`，右侧进入 `#/silence/glitch`。正式角色图接入前，页面只能使用占位剪影和占位文案；正式立绘接入后优先替换海报中的占位形体，不推翻整体左右分割结构。

建议结构：

```text
SilenceIndexPage
├── 全屏左右分割海报
├── 海报浮层：Silence 标题和占位说明
└── 海报入口区
    ├── 左侧：不语·silence，六个主 OC 群像占位，通过左侧渐变蒙版进入分组页
    ├── 中间：渐变 / 像素故障过渡
    └── 右侧：幽灵·silence，两个 meta 角色占位，通过右侧渐变蒙版进入分组页

SilenceGroupPage
├── 全屏分组角色舞台
├── 组内立绘交互层
├── 当前选中角色状态
└── 点击或键盘确认角色立绘，进入单角色档案
```

首页第一屏应直接出现角色图像或明确角色视觉信号，不要做成纯文字目录。若第一阶段还没有正式角色图，页面实现时只能使用占位状态，不能由 AI 自行编写正式角色介绍。

`#/silence/angel` 和 `#/silence/glitch` 进入后也应采用全屏或近全屏角色舞台，不做成普通居中内容框、卡片网格或资料列表页。分组页的核心交互对象是角色立绘或窗口化角色目标本身：用户通过 hover、focus、tap 或方向键选择角色；被选中的角色应前移、变亮、放大或获得更高层级，其他角色退到后景、降低亮度或轻微错位。`angel` 组点击或键盘确认当前角色后进入 `#/silence/angel/:characterId` 的完整档案页；`glitch` 组当前只在 `#/silence/glitch` 内切换 `Yoin / Yoine` 焦点，不跳转到单人详情页。

分组页交互约定：

```text
SilenceGroupStage
├── 全屏背景和分组标题浮层
├── 角色立绘层：每个角色是可聚焦 / 可点击目标
├── 当前角色状态：selectedCharacterId
├── 边缘翻页蒙版：用于切换到相邻角色或相邻页面
└── 移动端：tap 角色目标直接进入已存在的角色档案；占位目标只保留舞台反馈
```

键盘和可访问性要求：

- 每个角色目标必须能键盘聚焦。
- `Enter` 或 `Space` 应进入当前角色档案；尚未实现档案页的占位目标不创建正式跳转。
- 左右方向键可在同组角色间移动选中项；移动端可用 swipe 或横向滚动作为补充。
- 不把重要信息只放在 hover 状态；touch 设备必须能通过 tap 触发同等目标。

`#/silence/angel` 的首屏建议采用横向群像主视觉：

```text
SilenceAngelGroupView
├── 全屏角色舞台
├── 六个主 OC 立绘同屏出现，允许遮挡、前后错位和不同层级深度
├── 大色块 / 图形切割 / 细线分隔作为背景，不使用首页像素窗口舞台
├── 推荐使用隐藏式角色导航：默认弱化或隐藏，用户 hover、移动指针、点击或聚焦时浮出
├── 选中角色时，当前角色前移或提高亮度，其他角色退到后景
└── 点击或键盘确认角色立绘，跳转到 `#/silence/angel/:characterId`
```

该页的重点是“六人全员同屏的存在感”，不是卡片列表、资料柜或宗教化空间。可参考“横向群像 + 隐藏式导航 + 边缘少量 UI”的结构，但不得复刻外部作品的美术、角色、品牌符号、文案或设定体系。

当前 `angel` 群像本地预览以 `3840 × 2160` 屏幕为构图基准，使用固定 `16:9` 虚拟舞台承载六张独立立绘；较低分辨率桌面和平板只等比缩放整套舞台，不重新计算人物之间的相对大小和间距。每张立绘以图片底边中点作为定位锚点并共用同一底线，不裁切图片本身；前后关系只通过水平坐标和图层顺序形成。手机端将使用另一套页面架构，当前群像只要求稳定支撑到平板尺寸。

群像背景按本地参考归一化为浅蓝灰底、暗红斜带和黑色斜带，斜带可在页面载入时依次切入；减少动态效果模式下直接显示最终状态。人物底层阴影复用同一张透明立绘作为 CSS mask，填充为灰、黑或暗红纯色并向右偏移，不额外维护六张阴影图片，也不改变人物本体的点击层和遮挡顺序。

当前试排图片只从 ignored `local-assets/不语-banner/` 读取，并受 `import.meta.env.DEV` 限制；它们不进入生产构建。正式公开前仍需生成已授权、已压缩的公开衍生资产，并替换本地预览 URL。

桌面和平板端默认保持六人完整显示；指针悬停或键盘聚焦某个角色时，仅当前角色保持清晰并前置，其他角色及其底层阴影渐隐。左侧三人的名牌显示在人物右侧，右侧三人的名牌显示在人物左侧，当前立绘和阴影可向画面边缘轻微让位；指针离开群像且没有角色保持焦点时恢复全员。人物按钮使用独立的近似人体轮廓命中层，避免透明 PNG 的矩形外框阻断相邻角色交互；名牌和立绘本身不受命中轮廓裁切。手机端不沿用该悬停交互。

`#/silence/glitch` 的首屏也应采用全屏角色舞台，但视觉语言可以更接近站点 meta 层：

```text
SilenceGlitchGroupView
├── 全屏故障 / 像素 / 窗口化舞台
├── `ヨイン / Yoin` 与 `宵音 / よいね / Yoine` 两个 meta 角色立绘或窗口化形象同屏出现
├── 角色可作为窗口、幽灵投影、像素层或界面残影与页面互动
├── 选中角色时，当前窗口稳定、变亮或前置，另一个角色变成残影或后台窗口
└── 当前保持双人页结构；只有当其中某个角色积累出足够独立资料时，再考虑建立 `#/silence/glitch/:characterId`
```

`glitch` 组可以使用更强的像素窗口、扫描线、错位、闪烁和界面残影，但交互仍需稳定可读：不能因为故障效果导致标题、当前选中角色或边缘翻页引导难以辨认。

### 单角色档案页

`#/silence/angel/:characterId` 负责完整主 OC 角色资料。`#/silence/glitch/:characterId` 当前只是预留路由；`glitch` 组资料先集中在 `#/silence/glitch` 双人页。

建议结构：

```text
SilenceCharacterPage
├── 角色主视觉：立绘、角色名、别名、代表色
├── 人物概览：核心定位、角色第一印象、简短简介
├── 基本设定：姓名、身高、身份、基础外观、神态和稳定设定
├── 形态：同一角色在当前世界线内的状态变化，例如常态 / 异化状态
├── 衣装设定：挂在当前形态下的衣装、造型、图片和装备表
├── 关系网：与其他 OC 的关系卡片
├── 创作笔记：设计来源、版本记录、废案记录
└── 剧透区：默认折叠或明确标记
```

角色详情页可以保留页内锚点，例如 `基础档案`、`图像资料`、`关系网`，但角色身份本身优先使用 `#/silence/angel/:characterId` 或 `#/silence/glitch/:characterId` 表达。当前项目使用 hash router，如果再用 `#/silence#character-name` 作为角色主入口，会让 URL 层级不够清楚。

## 数据来源和字段建议

第一阶段使用本地结构化数据，不接后端：

```text
src/data/silence/
├── characterSeeds.ts          # 角色基础种子和 dev-only 本地预览立绘路径
├── glitchDuo.ts               # `glitch` 双人页名字、焦点和共同概念
├── characterProfiles.ts       # 用户确认资料的结构化角色档案，当前先接 Salvance
├── characterForms.ts          # 角色形态数据，当前先接 Salvance 的 sorence
├── draftCharacterContent.ts   # 测试占位资料骨架，正式文案接入前使用
├── characters.ts              # 角色类型、数据组装和查询 helper
└── navigation.ts              # Silence 横向翻页顺序和邻居查询
```

当前已接入的 `angel` 角色顺序按用户确认的从左到右排列：

```text
goelia
glynne
chihaya
ney
nightingale
salvance
```

对应可直接检查的测试路由：

```text
#/silence/angel/goelia
#/silence/angel/glynne
#/silence/angel/chihaya
#/silence/angel/ney
#/silence/angel/nightingale
#/silence/angel/salvance
```

当前测试数据骨架集中在 `draftCharacterContent.ts`，便于先检查页面结构和响应式，而不是提前写正式设定。用户已提供且确认用于迁移的正式资料应放入 `characterProfiles.ts`，由 `characters.ts` 和详情页模板读取：

- 首屏角色主视觉：角色名、代表色、标签、基础档案入口。
- 基础档案：资料状态、代表色、资料、笔记等占位字段。
- 世界线：同一角色未来可填写多个世界线或版本。
- 图像资料：立绘、表情差分、旧设 / 新设等图像槽位。
- 关系网：通过 `characterId` 关联其他角色，详情页会自动生成跳转。
- 创作笔记：设计来源、版本记录、废案记录等文字块。
- 剧透区：使用折叠区块，避免默认首屏暴露。
- 正式资料：当前 Salvance 已从 wiki 笔记迁移出人物概览、基本设定、形态、衣装设定、战斗能力和人物经历草稿。

新增或修改角色身份种子时优先从 `characterSeeds.ts` 入手；新增正式角色档案时优先从 `characterProfiles.ts` 入手；正式资料接入前，占位资料仍由 `draftCharacterContent.ts` 提供。不要把大量角色数据直接写进页面组件。

正式资料字段定稿和 wiki 笔记迁移规则见 `docs/ai/MODULES/silence-character-data-schema.md`。Salvance 首版结构化资料已经接入并可在本地详情页渲染；由于 Silence 当前暂不上线，这不代表资料已经完成或页面已经进入公开发布。

角色数据建议包含：

```ts
type SilenceGroupId = 'angel' | 'glitch'

const silenceGroups: Record<SilenceGroupId, { label: string; path: string }> = {
  angel: { label: '不语·silence', path: '/silence/angel' },
  glitch: { label: '幽灵·silence', path: '/silence/glitch' },
}

interface SilenceCharacter {
  id: string
  name: string
  aliases: string[]
  groupId: SilenceGroupId
  worlds?: Array<{
    id: string
    label: string
    summary?: string
  }>
  color?: string
  tags: string[]
  profile: {
    birthday?: string
    height?: string
    age?: string
    identity?: string
    affiliation?: string
  }
  images: {
    portrait?: string
    fullBody?: string
    gallery?: string[]
  }
  relationships?: Array<{
    characterId: string
    label: string
  }>
  spoilerLevel?: 'none' | 'light' | 'major'
  visibility?: 'public' | 'draft' | 'private'
}
```

字段只是建议结构，不是已确认实现。公开页面实现时，`private` 内容不得渲染到构建产物里；如果只是 CSS 隐藏或前端折叠，仍然视为已公开。

`worlds` 主要服务 `angel` 组的主 OC，用于表达同一角色在不同世界观中的版本或经历；`glitch` 组不需要强行套入多世界线结构。

## 组件拆分计划

当前页面结构：

```text
src/pages/silence/
├── SilenceIndexPage.vue
├── SilenceGroupPage.vue
├── SilenceCharacterPage.vue
├── composables/
│   └── useSilenceTurnNavigation.ts
└── components/
    ├── SilenceGatePoster.vue
    ├── SilenceCharacterStage.vue
    ├── SilenceCharacterDetails.vue
    ├── SilenceFormOutfitPanel.vue
    ├── SilenceGroupVisual.vue
    ├── SilenceGlitchDuoPanel.vue
    ├── SilenceTurnHint.vue
    ├── SilenceProfilePanel.vue
    ├── SilenceGallery.vue
    ├── SilenceRelationshipList.vue
    └── SilenceSpoilerBlock.vue
```

已拆出的组件和 composable：

- `useSilenceTurnNavigation.ts`：集中维护 Silence 横向翻页邻居、左右标签计算，供分组页和角色详情页复用。
- `SilenceGatePoster.vue`：Silence 入口页的标题浮层、左右分割海报、六人预览、glitch 占位和左右翻页蒙版。
- `SilenceCharacterStage.vue`：单角色详情页首屏主视觉、基础资料摘要、页内详情锚点入口和左右翻页蒙版。
- `SilenceCharacterDetails.vue`：单角色详情页下滑后的基础档案、世界线、图像资料、关系网、笔记和剧透区组合。
- `SilenceFormOutfitPanel.vue`：角色详情页内部“形态”和“衣装设定”的展示区块；形态通过 `?form=` 深链接控制，衣装区默认独立浏览所有非 private 衣装，可按需要单独开启 `formIds` 过滤。
- `SilenceGroupVisual.vue`：分组页立绘 / 窗口舞台组件，负责 `angel` 六人舞台和 `glitch` 两个窗口化角色目标的视觉与键盘事件。
- `SilenceGlitchDuoPanel.vue`：`#/silence/glitch` 双人页的小控制台，显示当前聚焦的 `Yoin / Yoine` 和共同屏幕夹层设定；不承担完整角色档案。
- `SilenceTurnHint.vue`：页面左右边缘渐变翻页蒙版。
- `SilenceProfilePanel.vue`：基础档案和代表色块。
- `SilenceGallery.vue`：图像资料槽位。
- `SilenceRelationshipList.vue`：关系卡片和角色详情跳转。
- `SilenceSpoilerBlock.vue`：默认折叠的剧透区。

`SilenceIndexPage.vue` 当前只负责入口页背景外壳；入口海报主体留在 `SilenceGatePoster.vue`。`SilenceGroupPage.vue` 当前只负责当前分组、选中项和路由打开逻辑；舞台渲染留在 `SilenceGroupVisual.vue`。`SilenceCharacterPage.vue` 当前只负责路由参数归一化、角色数据查询、关系卡片适配和页内滚动；首屏与详情内容分别留在 `SilenceCharacterStage.vue`、`SilenceCharacterDetails.vue`。如果后续分组页交互继续复杂化，再考虑补 `SilenceCharacterCard.vue`、`SilenceCharacterGrid.vue` 或 `SilenceCharacterFilters.vue`。

## 模板和数据复用关系

Silence 模块不建议为每个角色单独创建一个页面组件，例如不要做成 `SalvancePage.vue`、`AnotherCharacterPage.vue` 这种一人一个页面。推荐结构是“一个详情页模板 + 一份角色数据”：

- `src/data/silence/characterSeeds.ts`：维护角色基础种子。新增 `angel` 角色、调整角色 ID、名字、代表色和 dev-only 本地预览立绘路径，优先改这里。
- `src/data/silence/glitchDuo.ts`：维护 `glitch` 双人页已确认名字、窗口焦点数据和共同概念。当前不要把 `Yoin / Yoine` 拆入 `characters.ts` 的单角色档案列表。
- `src/data/silence/characterProfiles.ts`：维护用户已提供并准备用于公开渲染的正式角色档案。修改这里会影响对应角色详情页的正式资料区块。
- `src/data/silence/characterForms.ts`：维护角色形态数据。修改这里会影响角色页详情区的形态切换；首屏不读取这里替换角色身份。
- `src/data/silence/draftCharacterContent.ts`：维护测试占位资料骨架。正式角色资料未接入前，基础档案、世界线、图像槽位、关系、笔记和剧透区占位从这里生成。
- `src/data/silence/characters.ts`：维护角色类型、数据组装和查询 helper。页面和组件仍从这里读取 `silenceCharacters`、`getSilenceCharacterRoute()` 等稳定入口。
- `src/data/silence/navigation.ts`：维护 Silence 横向翻页顺序和左右邻居查询。
- `src/pages/silence/SilenceIndexPage.vue`：维护 `#/silence` 入口页背景外壳。
- `src/pages/silence/components/SilenceGatePoster.vue`：维护 `#/silence` 入口页的左右分割海报、标题浮层、预览角色和翻页入口。修改这里会影响两组总览，但不直接改变单角色详情页模板。
- `src/pages/silence/SilenceGroupPage.vue`：维护 `#/silence/angel` 与 `#/silence/glitch` 的组内页面状态；`angel` 组可打开角色详情页，`glitch` 组当前只切换双人页焦点。
- `src/pages/silence/components/SilenceGroupVisual.vue`：维护分组页里的立绘 / 占位舞台。修改这里会影响两个分组页的角色目标外观和交互。
- `src/pages/silence/SilenceCharacterPage.vue`：维护 `#/silence/angel/:characterId` 的路由取数和页面组装。`#/silence/glitch/:characterId` 虽已作为未来路由形态保留，但当前没有 `glitch` 单角色数据，访问时应保持缺失态。
- `src/pages/silence/components/SilenceCharacterStage.vue`：维护单角色详情页首屏。修改这里会影响所有角色详情页的首屏主视觉、基础资料摘要和页内锚点入口。
- `src/pages/silence/components/SilenceCharacterDetails.vue`：维护单角色详情页下滑详情区。修改这里会影响所有角色详情页的资料区块顺序和外观。
- `src/pages/silence/components/SilenceProfilePanel.vue`、`SilenceGallery.vue`、`SilenceRelationshipList.vue`、`SilenceSpoilerBlock.vue`：维护详情页内部可复用区块。修改其中一个组件，会影响所有使用该区块的角色详情页。

实现时，详情页通过路由参数读取分组和角色 ID。例如访问 `#/silence/angel/salvance` 时，`route.params.groupId` 应为 `angel`，`route.params.characterId` 应为 `salvance`，页面再用这些参数通过 `characters.ts` 的 helper 找到对应角色数据。

## CSS 和组件复用策略

遵守 `ARCHITECTURE_PLAN.md` 的“样式变更分级规则”：

- 样式层级：模块/分类级 + 页面专属。
- 全站按钮、面板、链接、焦点态优先使用公共组件和公共 CSS。
- Silence 分类可以拥有自己的角色视觉、代表色、档案纸、标签和立绘排版，但不要改公共组件默认外观来满足单页风格。
- 角色代表色应作为局部 CSS 变量或内联 style 输入，不要扩展成新的全站主题。
- 如果角色卡片未来也用于博客、作品集或其他内容分类，再考虑抽成公共内容卡片组件。
- 不把首页的粉蓝像素舞台直接复制到 Silence 页面；Silence 模块可以与首页有气质呼应，但应形成“角色档案”自己的阅读秩序。
- `glitch` 组可以继承首页的像素、故障、窗口碎片和赛博幽灵表现；`angel` 组只保留全站导航、按钮、焦点态等基础外壳，不调用首页像素舞台作为主视觉。
- `angel` 组优先使用大幅立绘、群像合成、横向舞台、隐藏式导航和局部高亮来表达角色重要性；导航默认不应抢占群像画面，避免使用圣所、祭坛、光环、祈祷等宗教化视觉语汇。
- `angel` 单角色正文区不得继续沿用工房式像素工作台语言。需要优先下调 `--ns-font-display` / `--ns-font-decorative` 的存在感，减少 2px 硬边框、硬阴影、像素按钮和密集网格背景，把它们限制在入口外壳、导航和少量 meta 标记里。
- 如果需要为 `angel` 正文建立独立样式，优先放在 `src/pages/silence/` 私有组件或模块级样式中，不修改全站公共组件默认像素风，也不影响 `glitch`、`NSPlate`、`NSGlamour`。

## 公开内容和隐私边界

- 角色名、作品名、阵营名、正式简介等公开文案必须由用户提供或确认。
- AI 生成的临时展示文案只能使用 `占位用，待编辑`。
- 剧透内容需要明确字段或组件隔离，避免默认首屏暴露。
- 未打算公开的草稿、私设、时间线、关系设定，不应进入前端构建数据。
- 公开图片需要注意文件名、EXIF、隐藏水印、未公开草稿层和不该暴露的路径信息。
- 外部参考链接可以记录在内部文档中，但不要在公开页面中暗示 OC 来源于某个现有商业 IP。

## 本地预览图片规则

- Silence 角色立绘或差分图在用户明确声明“可以提交进项目 / 可以公开使用”前，全部视为本地预览资产；包括但不限于 `.png`、`.jpg`、`.jpeg`、`.webp`。
- 本地预览图片可以临时放在仓库根目录用于开发查看，但必须被 `.gitignore` 忽略，不得 stage、commit、push，也不得进入生产构建产物。
- 本地预览图片应使用开发环境限定引用，例如 `import.meta.env.DEV` 下的根路径引用；正式确认前不要静态 import，不要移动到已跟踪的 `src/assets` 或 `public` 目录。
- 当前根目录 `*-art-*` 命名的角色图只作为本地预览约定；如果后续用户确认某张图可以公开接入，需要再单独确认正式资产路径、命名、压缩、EXIF 清理和构建归属。
- 不要为了补齐缺失立绘而自行生成、替换、上传或提交 AI 生成图片；正式素材以用户提供并确认的版本为准。

## 实施边界

后续继续接入正式角色资料、正式素材或较大交互改动前，需要先进入计划阶段，至少确认：

1. 角色数量和第一批角色名单。
2. 是否要调整现有单角色详情页模板，还是只填充正式内容。
3. 角色图资产路径和公开范围。
4. 正式展示文案是否已经提供。
5. `src/data/silence/`、`src/pages/silence/`、`src/config/site.ts`、`src/router/index.ts` 的具体改动范围。
6. 是否把 `Silence` 写入首页导航和 `AppTopNav` 分类菜单。

第一版不建议引入新依赖；角色筛选、切换和详情页都可以用 Vue、CSS 和本地数据完成。

## 验证清单

实现后至少验证：

- `npx vue-tsc --noEmit`
- `npm run build`
- 浏览器访问 `http://localhost:5173/#/silence`
- 浏览器访问 `http://localhost:5173/#/silence/angel` 和 `http://localhost:5173/#/silence/glitch`
- 若实现 `angel` 详情页，访问 `http://localhost:5173/#/silence/angel/<characterId>`；`glitch` 当前验证 `http://localhost:5173/#/silence/glitch` 双人页，不验证单人详情页。
- 560px / 900px / 1120px+ 宽度下角色卡片和详情页布局稳定。
- 角色立绘目标可键盘聚焦，已存在详情页的角色可回车进入。
- 剧透区默认状态符合预期，不在首屏意外暴露。
- 草稿和私有角色数据未进入公开渲染。
- 控制台无错误。

## 待确认事项

- `Silence` 公开导航文案：使用 `Silence`、`不语`、`角色档案` 或其他命名。
- 第一版角色数量、角色 ID 命名规则和排序方式。
- `angel` / `glitch` 组内的角色排序方式，以及 `angel` 角色内部世界线的展示方式。
- 是否需要中英/多语言字段。
- 单角色页是否公开创作笔记和版本记录。
- 图片资产优先放在构建内资产目录，还是放在 public 静态目录。
