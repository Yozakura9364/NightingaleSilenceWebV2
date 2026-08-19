// 运行时环境变量唯一入口：业务代码不得散读 import.meta.env，
// 全部 VITE_* 与 DEV 开关经此集中注册。默认值见 .env.example。
//
// 注意：VITE_* 读取必须保持 import.meta.env.X 的字面表达式，
// 不得解构成局部变量，否则会破坏 Vite 静态替换与构建期常量折叠
// （生产构建依赖该特性排除内部路由 chunk）。

export { isSilenceEnabled, isContentStudioEnabled, areInternalRoutesEnabled } from '@/config/features'

export const isDev = import.meta.env.DEV
export const nsplateDataSource = import.meta.env.VITE_NSPLATE_DATA_SOURCE ?? ''
export const nsplateManifestBase = import.meta.env.VITE_NSPLATE_MANIFEST_BASE ?? ''
export const silenceLayoutBase = import.meta.env.VITE_SILENCE_LAYOUT_BASE ?? ''
export const ffxivCommunityEventsUrl = import.meta.env.VITE_FFXIV_COMMUNITY_EVENTS_URL ?? ''
export const contentStudioToken = import.meta.env.VITE_CONTENT_STUDIO_TOKEN ?? ''
export const localAssetBase = import.meta.env.VITE_LOCAL_ASSET_BASE ?? ''
