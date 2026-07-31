# Hermes 自动化实施任务

## Task 1：固定 clean worktree 与基线

**目标：** 从 Hermes HEAD `8bf2832` 创建独立、干净的实现工作区，保存基线 manifest。

**验收：**
- [ ] 脏开发目录未被修改、未清理、未提交。
- [ ] worktree HEAD、branch、remote 与批准基线一致且状态 clean。
- [ ] 生成不含凭据和绝对私有路径的基线报告。

**验证：** `git status --short`、HEAD/remote 校验、路径和敏感信息扫描。

**依赖：** 无。  **范围：** S。

## Task 2：定义 collection envelope 与 inbox manifest

**目标：** 建立 Bot → Hermes 的脱敏输入契约、哈希/字节清单和原子 inbox ingest。

**验收：**
- [ ] 未知 source、重复 source、缺字段、错误 issue、错误 hash/bytes 均阻断。
- [ ] canonical root、symlink、owner、权限和 `wx` 临时文件检查通过。
- [ ] 失败不删除他人临时文件、不覆盖 last-known-good。

**验证：** schema 单元测试、哈希篡改测试、rename/fsync/权限故障矩阵。

**依赖：** Task 1。  **范围：** M。

## Task 3：实现 collectionIssue/challengeIssue 窗口解析

**目标：** 为周二主题和周五答案提供可注入时钟的窗口与期数解析。

**验收：**
- [ ] 输出窗口 ID、collectionIssue、challengeIssue、requiredSources。
- [ ] 周五前四标签无答案为 `BLOCKED`；不回退上一期答案。
- [ ] 跨日、时区、迟到、重复触发和周切换测试通过。

**验证：** 固定时钟测试覆盖周二/周五边界和异常窗口。

**依赖：** Task 2。  **范围：** M。

## Task 4：实现 collection → summary 转换

**目标：** 将已校验 collection 转为脱敏、可追溯的 Hermes summary。

**验收：**
- [ ] summary 只保留允许字段和 source 引用，不含原始 QQ、Cookie、token 或账号字段。
- [ ] 来源不完整时 status/completeness 为 partial/missing，不伪造 complete。
- [ ] `summaryHash` 覆盖 canonical 内容，重复 collection 幂等。

**验证：** 脱敏扫描、schema/hash 测试、重复/跨期 fixture。

**依赖：** Task 2、Task 3。  **范围：** M。

## Task 5：接入 FC-01/FC-04 编排

**目标：** 将 inbox 输入接入现有 Hermes pipeline，并确保 checker 不读取旧候选。

**验收：**
- [ ] FC-01 失败时 FC-04 不启动；任何 required source 不齐均停止。
- [ ] 每次运行使用独立 job/workspace/lock 和新产物路径。
- [ ] manifest 只登记本次成功写入的 candidate/validation/report。

**验证：** executor integration、stopOnFailure、旧产物预置、锁/残留进程测试。

**依赖：** Task 4。  **范围：** M。

## Checkpoint A：隔离流水线可重复运行

- [ ] Linux Hermes 全套测试通过。
- [ ] Bot fixture 与 V2 checker 通过。
- [ ] 断网 namespace 无未声明网络调用。
- [ ] 未触碰生产 current、timer 或 V2 mirror。

## Task 6：实现 snapshot manifest、发布与 reconcile

**目标：** 在 checker 通过后原子发布 current，并可从 last-known-good 恢复。

**验收：**
- [ ] manifest 记录 dataset/releaseId/files/source hashes/candidate hashes/bytes。
- [ ] rename 或父目录 fsync 失败不报告成功；current/backup/manifest 可 reconcile。
- [ ] JSON 损坏、hash 不符或发布后健康检查失败可自动回滚。

**验证：** 原子写故障矩阵、崩溃边界测试、reconcile/rollback integration。

**依赖：** Task 5。  **范围：** M。

## Task 7：配置周二/周五 service 与 timer（仅 dry-run）

**目标：** 将两类窗口绑定到受限 systemd service/timer，但保持生产 disabled。

**验收：**
- [ ] service 使用专用用户、环境白名单、超时、锁和受控输出根。
- [ ] 模拟时间可触发正确 job；重复触发幂等。
- [ ] 安装验证只在隔离目录进行，生产 timer 仍 disabled。

**验证：** systemd sandbox、模拟时间、断网 namespace、状态/日志脱敏扫描。

**依赖：** Task 3、Task 6。  **范围：** M。

## Task 8：通知与运行报告

**目标：** 输出成功、阻断、未确认、回滚的结构化报告和飞书摘要。

**验收：**
- [ ] 成功通知包含 issue、release/hash、来源摘要和可验证产物。
- [ ] 阻断通知包含明确原因、last-known-good，不暴露原始数据或凭据。
- [ ] 相同 job/input/hash 的通知幂等，不重复发布。

**验证：** 通知快照、敏感信息扫描、幂等/失败分支测试。

**依赖：** Task 6、Task 7。  **范围：** S。

## Checkpoint B：真实窗口前审查

- [ ] 全 Linux/Windows/断网矩阵通过。
- [ ] 归档成员、危险路径、链接、构建产物和凭据扫描为零。
- [ ] 生成审查包、SHA-256、回滚命令和部署前清单。
- [ ] 由用户单独确认是否 commit、push、部署、启用 timer。

## Task 9：生产启用（单独授权）

**前置条件：** Checkpoint B 全部通过，且用户明确授权对应动作。

**动作：** 分阶段安装 service/timer、执行一次真实窗口 dry-run、观察健康检查，再决定是否启用自动发布；任何失败立即停用 timer 并按 manifest 回滚。

**默认状态：** 不执行。
