// 构建开关：值必须保持 import.meta.env.VITE_* 字面表达式，
// 才能被 Vite 静态替换并做构建期常量折叠——生产构建依赖它
// 排除 Silence / Content Studio / 内部路由的 chunk。

export const isSilenceEnabled = import.meta.env.VITE_ENABLE_SILENCE === 'true'

export const isContentStudioEnabled = import.meta.env.VITE_ENABLE_CONTENT_STUDIO === 'true'
export const areInternalRoutesEnabled = import.meta.env.VITE_ENABLE_INTERNAL_ROUTES === 'true'
