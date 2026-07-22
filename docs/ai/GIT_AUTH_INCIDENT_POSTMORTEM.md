---
summary: "2026-07-20 GitHub CLI 认证事故、根因、影响和防复发操作规程。"
status: "active"
scope: "V2 仓库的 gh 身份检查、认证异常处理、commit、push 和后台认证进程。"
source_of_truth: "AGENTS.md、AGENT_WORKFLOW.md、GitHub CLI 实际执行边界和本次事故事实。"
read_when: "执行提交/推送、处理 gh 认证异常、切换项目账号或排查重复登录弹窗。"
update_when: "GitHub 账号隔离规则、执行沙箱、凭据存储或推送流程变化时。"
verify: "对照 AGENT_WORKFLOW 的提交推送门槛，并确认流程不包含自动 logout 或重复 login。"
---

# GitHub CLI 认证事故复盘

## 事故结论

2026-07-20，在准备向 V2 仓库推送多个子项目 commit 时，Agent 错误地把一个执行边界内的 `gh auth status` 结果当作宿主机真实登录状态，随后在更高权限执行边界中运行了 `gh auth logout`，删除了原本可用的项目账号本地 GitHub CLI 登录记录。

删除凭据后，Agent 又连续启动多个 `gh auth login` 设备流。部分登录命令、可见 PowerShell 窗口或浏览器授权页没有被及时关闭，造成重复登录、持续弹窗和长时间阻塞。Agent 在登录进程仍存活时声称“不再操作登录”，说法与用户实际观察到的行为不一致。

本次事故最终没有造成错误账号推送、Git 历史改写、远端引用损坏或仓库数据丢失，但删除了正常本地凭据，迫使用户重复登录，并严重延误了原本应直接完成的分组提交和推送。

## 直接原因

1. 身份检查与后续凭据操作不在同一个执行边界，检查结果不可直接互相推导。
2. 未先在实际执行 push 的边界中做只读确认，就把认证异常升级为凭据修改。
3. 把 `gh auth logout` 当作一般排障命令，没有视为会删除宿主机凭据的破坏性操作。
4. 多次启动认证流程但没有保存 PID、记录所有权和建立清理步骤。
5. 在认证尚未恢复时反复尝试不同登录路径，没有及时停止并报告单一阻塞条件。
6. 没有优先保持原任务最小化，把一次提交推送扩大成账号和凭据排障。

## 影响

- 删除了项目账号在宿主机 GitHub CLI 中的本地登录记录。
- 用户被迫重复执行 GitHub 设备授权。
- 遗留认证窗口和进程持续弹出，干扰正常工作。
- 原本简单的分组提交和 `main` 推送被长时间延误。
- 降低了用户对 Agent 执行账号隔离和安全操作的信任。

## 不得重复的行为

以下行为在普通提交、推送和认证排障任务中一律禁止：

1. 不得根据沙箱内结果推断宿主机 keyring、Credential Manager 或 GitHub CLI 的真实状态。
2. 不得为了“刷新登录”主动运行 `gh auth logout`。
3. 未经用户针对该操作的明确授权，不得运行 `gh auth login`、`gh auth logout`、删除凭据或读取凭据内容。
4. 不得在已有认证流程未结束时启动第二个认证流程。
5. 不得把认证命令放入不可追踪的后台窗口；必须保存 PID，并在成功、失败、超时或用户中止后清理。
6. 不得在仍有认证进程运行时声称认证操作已经停止。
7. 不得输出 token、设备码、凭据内容或认证存储文件。

## 标准提交与推送流程

### 1. 确定执行边界

身份检查、远端 fetch、作者审计和 push 必须在同一个实际执行边界中完成。若 push 需要沙箱外权限，则 `gh` 身份检查也必须在沙箱外只读执行，不能复用沙箱内结果。

### 2. 只读身份检查

按顺序检查：

```powershell
gh api user --jq .login
git config --local user.name
git config --local user.email
git branch --show-current
git remote get-url origin
```

检查只用于确认，不得在同一自动流程中附带 login、logout、switch 或凭据修复。

### 3. 身份异常处理

任一身份不匹配时：

1. 立即停止 stage、commit、fetch、push、tag 和 release。
2. 只报告实际观察到的账号、目标账号和受阻操作。
3. 不自动修改任何账号或凭据。
4. 只有用户明确要求处理认证后，才执行一次可见、可追踪的认证流程。
5. 认证失败或超时后停止，不自动重试，不切换其他方案。

### 4. 分组提交

身份正确后，按子项目分别暂存和审计：

```powershell
git status --short
git add -- <本组文件>
git diff --cached --name-status
git diff --cached --check
git commit
```

不得使用其他账号代推，也不得因为推送受阻而改写 commit 作者或远端 URL。

### 5. 推送前最终审计

```powershell
git fetch origin
git rev-list --left-right --count origin/main...HEAD
git log origin/main..HEAD --format="%h %an <%ae> %cn <%ce> %s"
gh api user --jq .login
```

确认远端没有未知领先提交、待推送作者和提交者全部正确、当前 GitHub CLI 账号仍匹配后，才允许 push。

### 6. 认证进程清理

如果用户明确要求启动认证流程：

1. 只启动一个流程。
2. 保存启动进程 PID 和命令用途。
3. 成功、失败、超时、用户取消或任务中止时，只终止该 PID 及其明确子进程。
4. 清理后再次确认没有本次任务创建的 `gh auth login` 进程。
5. 不批量终止其他 PowerShell、浏览器或 GitHub 进程。

## 本次修正

- V2 的提交推送最终在同一沙箱外边界中确认 GitHub CLI 账号、本地 Git 身份、分支和远端。
- 四个子项目 commit 的作者和提交者均为项目指定账号。
- 推送前核对了 `origin/main..HEAD`，远端没有未知领先提交。
- 四个 commit 已推送到 `origin/main`，本地 `HEAD` 与远端一致。

## 长期责任

这不是一次“登录不稳定”问题，而是 Agent 对执行边界和凭据操作的判断错误。后续遇到类似情况，优先级必须是保护已有登录状态、停止自动修复、保持任务最小化，而不是尝试更多认证命令。
