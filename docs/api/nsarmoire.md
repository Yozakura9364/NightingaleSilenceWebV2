# NSArmoire API / 数据契约草案

本文件记录 V2 `NSArmoire` 第一阶段的数据契约。当前阶段不接本地 helper，不新增 Vite proxy，不读取游戏进程，只支持手动导入 snapshot JSON 和前端本地分析。

## 基本信息

| 项 | 值 |
|----|----|
| 目标路由 | `#/ffxiv/armoire` |
| 页面入口 | `src/pages/armoire/NSArmoirePage.vue` |
| 当前输入 | 手动导入 JSON |
| 当前后端 | 无 |
| 计划 helper API base | `/api/armoire`，后续确认端口和 CORS 后再接 |

## Snapshot v1

第一阶段页面只依赖 snapshot，不理解 helper 内部内存结构。

```ts
type ArmoireContainerKind =
  | 'inventory'
  | 'saddlebag'
  | 'retainer'
  | 'armoury'
  | 'glamourDresser'
  | 'armoire'
  | 'manual'

interface ArmoireOwnedItem {
  itemId: number
  hq?: boolean
  quantity?: number
  dyes?: [number, number]
  spiritbond?: number
  container: ArmoireContainerKind
  containerName?: string
  slotIndex?: number
}

interface ArmoireSnapshot {
  schemaVersion: 'nsarmoire.snapshot.v1'
  source: 'manual-import' | 'local-helper' | 'asvel-compatible'
  generatedAt: string
  character?: {
    name?: string
    world?: string
    dataCenter?: string
  }
  items: ArmoireOwnedItem[]
}
```

## Asvel 兼容导入

第一阶段同时接受简化的 Asvel dresser 项：

```ts
interface AsvelDresserItem {
  id: number
  hq?: boolean
  dyes?: [number, number]
}
```

可接受形态：

- `AsvelDresserItem[]`
- `{ items: AsvelDresserItem[] }`
- `{ dresser: AsvelDresserItem[] }`

导入后统一转换为：

```ts
source: 'asvel-compatible'
container: 'glamourDresser'
```

## 已确认字段口径

| 字段 / 来源 | 口径 |
|-------------|------|
| `EquipSlotCategory` / 灰机 `装备位置` | 判断物品是否是装备，以及占用哪些装备槽。 |
| `Model{Main}`、`Model{Sub}` / 灰机 `主模型`、`副模型` | 用于同模型分析。 |
| `IsGlamourous` / 灰机 `投影台` | 判断这条 Item 记录本身能否作为普通物品放入投影台。 |
| `Item{Glamour}` / 灰机 `投影材料` | 普通武具投影相关材料，不等同于投影台收纳。 |
| 灰机 `武具投影` | 普通武具投影能力，不等同于投影台收纳。 |
| `ItemUICategory=112` + `MirageStoreSetItem.csv` / 灰机 `套装.物品` | 套装幻影化容器，单独处理；拥有容器不代表散件全收集。 |
| `Cabinet.csv` | 判断可放入收藏柜，不使用 `IsGlamourous` 代替。 |

## 当前校验

手动导入会校验：

- JSON 必须可解析。
- snapshot 必须是对象，或 Asvel 兼容数组/对象。
- `schemaVersion` 必须是 `nsarmoire.snapshot.v1`。
- `source` 必须是已知来源。
- `generatedAt` 必须存在。
- `items` 必须是数组，且不超过当前前端限制。
- `itemId` 必须是正整数。
- `container` 必须是已知容器。
- `quantity` 如存在，必须是正整数。
- `dyes` 如存在，必须是两个非负整数。

## 当前不做

- 不连接本地 helper。
- 不读取游戏进程、背包、雇员或投影台。
- 不计算正式收藏柜收集度。
- 不计算正式套装缺件进度。
- 不做同模型推荐和清理建议。
- 不保存完整 snapshot 到 `localStorage`。

## 安全边界

- 手动导入 JSON 视为不可信输入。
- 页面只在浏览器内处理 snapshot，不上传公开服务器。
- 错误信息不输出本机路径、堆栈、用户名、游戏安装路径或 helper 调试信息。
- 后续 helper 必须只监听 loopback 地址，并单独确认 CORS、端口、请求体大小和浏览器私有网络访问限制。
