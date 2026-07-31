---
summary: "docs 文档库顶层索引：愿景、路线、AI 文档库、API 契约和数据分工。"
status: "active"
read_when: "从仓库根进入 docs/ 时。"
update_when: "docs/ 新增/移动/删除文档，或数据目录职责变化时。"
---

# docs 文档库索引

本文档是 `docs/` 目录的顶层入口。按需进入对应子库；AI 协作文档的完整分组索引在 `docs/ai/README.md`。

## 结构一览

| 位置 | 内容 | 索引入口 |
|------|------|----------|
| `OWNER_VISION.md` | 用户手写的站点愿景（每次新会话必读） | 本文 |
| `ROADMAP.md` | 当前阶段与优先级 | 本文 |
| `ai/` | AI 代理文档库（规则/计划/报告/模块/数据） | **`docs/ai/README.md`** |
| `api/` | 各模块 API 契约 | 本文 API 一节 |

## AI 文档库（高频）

→ 直接进 [`docs/ai/README.md`](ai/README.md)，按主题分组索引全部 AI 文档，并含推荐读取顺序。

## API 契约（docs/api/）

| 文件 | 对应模块 |
|------|----------|
| `nsplate.md` | NSPlate 静态 manifest + 旧 API fallback |
| `nsglamour.md` | V2 NSGlamour Flask 后端 |
| `nsarmoire.md` | 与独立 NSArmoireButler 的 API 边界 |
| `ffxiv-community-events.md` | FFXIV 活动日历运行时 JSON |
| `short-links.md` | 私人短链契约 |

## 数据分工（防止混淆）

- `data/`：私有主数据/策略输入（人工维护，不直接服务前端）。
  例 `data/fashion-check/` = 来源例外、采集策略、染剂锚点、低贴合候选等。
- `public/data/`：确认后生成的公开切片（生成器产出，前端读取）。
  例 `public/data/fashion-check/` = current.json、tag-database.json 等。

## 推荐读取顺序

- **Agent 新会话**：`OWNER_VISION.md` → `docs/ai/PROJECT_CONTEXT.md` → 仓库根 `AGENT_WORKFLOW.md` → 按任务查 `docs/ai/README.md`。
- **人类读者**：`OWNER_VISION.md` → `ROADMAP.md` → 按模块进 `docs/ai/README.md`。
