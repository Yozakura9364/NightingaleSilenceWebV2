export type HousingRegionKey = 'cn' | 'global'

export type PlotSize = 'small' | 'medium' | 'large'

export type PlotAudience = 'individual' | 'freeCompany' | 'both'

export type PurchaseMethod = 'lottery' | 'firstCome' | 'unknown'

/** 抽签轮次：本轮报名中 / 结果公示 / 下一轮待开放 / 未知（如先到先得地块） */
export type PlotPhase = 'entry' | 'results' | 'upcoming' | 'unknown'

export interface HousingPlot {
  /** 稳定标识：region:serverId:districtId:ward-plot */
  key: string
  districtId: number
  /** 区名本地化 key；无映射时为 null 并使用 districtNameFallback 原文 */
  districtNameKey: string | null
  districtNameFallback: string
  /** 展示用小区号，从 1 开始（适配层已归一化） */
  ward: number
  /** 展示用房号，从 1 开始 */
  plot: number
  size: PlotSize
  price: number
  audience: PlotAudience
  purchase: PurchaseMethod
  phase: PlotPhase
  /** 抽签报名数；null 表示无上报数据 */
  entries: number | null
  /** 当前轮次截止时间（unix ms）；无数据为 null */
  phaseEndsAt: number | null
  /** 数据扫描时间（unix ms）；无数据为 null */
  lastUpdatedAt: number | null
  firstSeenAt: number | null
}

/** 国际服世界（PaissaDB /worlds） */
export interface HousingWorld {
  id: number
  name: string
  datacenterId: number
  datacenterName: string
}

export interface HousingServerData {
  region: HousingRegionKey
  serverId: number
  serverName: string
  plots: HousingPlot[]
  /** 服务端整体数据时间（unix ms）；国际服取地块最大扫描时间，国服取全量更新时间 */
  updatedAt: number | null
}
