# Contract: 时尚品鉴服务器自动采集

## Schedule

所有时间使用 `Asia/Shanghai`：

- 周二 16:05 至周三 16:05：每小时 `:05` 检查主题、部位和标签。
- 周五 16:05 至周六 16:05：每小时 `:05` 检查装备答案、染色及 80/100 分方案。
- 窗口外定时任务只做时间判断，不访问外部来源。

## Storage

生产私有目录保存三类数据：

```text
.local/fashion-check/
├── current.json
├── state.json
├── notifications.json
├── subscriber-updates.json
└── snapshots/<sourceId>/<sha256>.json
```

`current.json` 是来源级待审核数据，不是公开前端契约。QQ `opendoc` 原始响应不得落盘；只能保存移除账号、会话、trace、客户端地址和页面运行状态后的单元格派生数据。

## Notification Delivery

管理员异常通知通过 NightingaleOpsBot 的独立 `/fc bind` 私聊绑定发送。通知进入持久队列；AstrBot 成功发送后才 ACK 删除。

私聊用户可以通过 `/fc follow` 订阅、`/fc unfollow` 取消订阅；已授权管理员也可以在群内订阅或取消当前群。订阅目标仅接收有效主题变化和完整答案变化；订阅前的历史更新不补发，每个私聊或群独立记录最后成功发送的更新。未订阅的群不得自动推送。

群友和私聊用户可以发送 `/fc` 读取本周答案。`/fc` 必须先按北京时间周二 16:00 边界计算应属周次；私有 staging 仍是旧周时，只返回“本周答案尚未更新”，不得回退发送旧答案。`/fc status|bind|check|unbind` 仅限已授权管理员。

管理员需要通知的事件：有效主题变化、当周答案变化、同一来源连续失败 3 次、失败后恢复，以及窗口结束仍无完整新数据。订阅者只接收有效主题变化和完整答案变化。无变化的小时检查不得发送消息。

## Publication Boundary

自动采集只更新服务器私有 staging。来源抓取成功不等于数据已完成官方 ID/槽位校验，也不等于取得转载许可。公开 JSON 和页面发布继续受 `docs/ai/MODULES/fashion-check.md` 的发布门禁约束。
