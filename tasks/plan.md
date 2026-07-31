# Hermes 周二/周五自动采集与发布计划

## 概览

为 Nightingale Hermes 建立一条 fail-closed 的时尚品鉴自动化流水线：周二采集主题和标签，周五采集答案与染剂；Bot 只向 Hermes 传输脱敏、带期数和哈希的 summary；Hermes 在隔离工作区执行 FC-01、FC-04 和 V2 checker。只有同一采集期、所有 required source 齐全、来源新鲜、官方七语数据校验通过且候选哈希一致时，才生成可发布快照。失败时保留 last-known-good 并发送阻断通知。

本阶段只实现和验证隔离 dry-run。commit、push、部署、current 切换和启用生产 timer 仍是独立授权动作。

## 边界与前提

- Hermes 生产仍以 `/opt/nightingale-hermes` 为受控目标；不在其脏开发目录直接覆盖或提交。
- 从固定 HEAD `8bf2832` 建立 clean worktree；所有生成器、checker 和测试在独立 job workspace 运行。
- Bot 保留私有采集和 QQ 账号边界，只输出脱敏 summary；Hermes 不读取原始 QQ 协议、Cookie、token 或 subscriber 状态。
- `collectionIssue` 表示主题/答案实际采集期，`challengeIssue` 表示游戏挑战生效期；两者显式保存，禁止用单一锚点或旧期答案补当前期。
- 周五前答案未发布或仅有四个标签时，状态必须为 `BLOCKED`，不得猜测、回退上一期或读取公开旧 `current.json`。
- Hermes runtime 数据不写回 V2 仓库 `public/data/`；公开发布使用独立 runtime snapshot。

## 目标架构

```text
systemd timer / 手动 dry-run
  -> Hermes scheduler/window resolver
  -> Bot summary inbox（manifest + SHA-256 + 原子移入）
  -> collection envelope/schema/freshness/issue 校验
  -> collection -> summary（同一 collectionId）
  -> FC-01 source/period gate
  -> FC-04 candidate pipeline（stopOnFailure）
  -> V2 isolated checker + 官方七语 reference checker
  -> 发布前 manifest/hash/bytes 校验
  -> last-known-good 原子替换
  -> health/reconcile + 飞书通知
```

## 阶段与顺序

### Phase 1：输入契约和安全桥

定义 Bot → Hermes envelope、summary、source record 和 manifest 的 canonical schema。校验 `collectionId`、`collectionIssue`、`challengeIssue`、`sourceId`、`collectedAt`、`contentHash`、`status`、`completeness`，未知来源、重复来源、跨期来源和过期来源一律阻断。Inbox 使用 canonical root、symlink/权限检查、临时文件 `wx`、fsync、同目录 rename；失败不覆盖旧输入。

### Phase 2：期数和窗口解析

实现可注入时钟的窗口解析器：周二主题窗口、周五答案窗口、周末/跨时区边界、迟到采集和重复触发。输出 `collectionIssue`、`challengeIssue`、窗口 ID 和预期 required sources。窗口解析只负责调度，不负责判断答案正确性。

### Phase 3：collection → summary 与 FC 编排

将已校验 collection 转成 Hermes 可消费的脱敏 summary；不得从不完整来源合成 `complete`。FC-01 只验证输入和来源，FC-04 只在 FC-01 成功后生成候选；`stopOnFailure` 必须阻止 checker 读取旧候选。每次运行使用新的 job/workspace/lock，并记录输入哈希、命令结果和产物哈希。

### Phase 4：发布快照、回滚和 reconcile

候选通过 V2 checker 后生成不可变 snapshot manifest，记录 dataset、releaseId、source hashes、candidate/validation bytes 和 SHA-256。先写备份，再原子替换 current；目录 fsync 失败视为 `PUBLISH_UNCONFIRMED`，不写成功状态。启动和定时 reconcile 检查 current、backup、manifest 三者一致性；损坏时只恢复 last-known-good 并报警。

### Phase 5：调度、通知与隔离验证

为周二主题和周五答案各配置独立 systemd service/timer，运行用户、环境白名单、超时、网络策略和输出根明确固定。先运行模拟时间和断网 namespace 测试，再做真实窗口 dry-run；生产 timer 默认保持 disabled，等待独立部署授权。

## 验收门槛

- 同一 `collectionId` 的 qq-cn-history 与 allgamestaff-en 才能共同进入候选；任一期不匹配均 `BLOCKED`。
- 缺少答案、答案超时、伪造 `generatedAt`、无可信采集时间、旧期答案回退均有独立回归测试。
- `requiredSources`、source hash/bytes、summary hash、candidate hash、官方 Item/Category/Stain ID/槽位/七语名称全部 fail-closed。
- 生成失败、checker 失败、rename 后目录 fsync 失败、manifest 不一致、锁冲突均保留 last-known-good，不产生半成品 current。
- 断网 namespace 下不发生未声明网络调用；日志和飞书回执不含 token、Cookie、私有路径或原始采集内容。
- Windows/Bot fixture、Linux Hermes integration、模拟周二/周五边界、恢复/回滚场景均有可重复测试和机器可读报告。

## 回滚策略

任何发布失败都停止在候选或 `PUBLISH_UNCONFIRMED`，不切换 current。若 current 已替换但健康检查失败，使用带哈希记录的上一版本原子回退；旧 release、backup、manifest 保留，不删除现场。timer、生产写权限和外部连接在验证完成前不启用。

## 风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Bot 采集延迟或跨期 | 错发旧答案 | collection/challenge 分离、required source 同期校验、过期即阻断 |
| 远端 GitHub 不稳定 | 无法更新来源 | 固定 commit 的桌面中继/manifest，Hermes 只消费已验签输入 |
| 旧候选残留 | 失败时误发布 | 每次 job 独立 workspace，成功后才登记 candidate/validation |
| 原子写后目录未持久化 | manifest 与文件不一致 | 父目录 fsync + reconcile + last-known-good |
| timer 重复触发 | 并发覆盖 | job lock、message/collection 幂等键、状态机终态 |

## 暂不做

- 不连接 Bot 生产服务器，不读取原始 QQ 数据。
- 不启用生产 timer，不授予 V2 mirror 或网站仓库写权限。
- 不自动 commit/push、部署或切换 current。
- 不用公开网站旧数据补齐私有来源。
