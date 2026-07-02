export type RoutePath = '/' | '/ffxiv' | '/ffxiv/glamour' | '/ffxiv/plate' | '/about'

export interface NavItem {
  id: string
  label: string
  route: RoutePath
  variant?: 'default' | 'primary'
}

export interface SiteCategory {
  id: string
  title: string
  shortTitle: string
  kicker: string
  description: string
  route: RoutePath
}

export interface ToolEntry {
  id: string
  title: string
  projectName: string
  route: RoutePath
  summary: string
  sourcePath: string
  apiBase: string
  devPort: number
  statusLabel: string
}

export const placeholderCopy = '占位用，待编辑'

export const siteMeta = {
  zhName: '夜莺不语',
  enName: 'Nightingale Silence',
  title: '夜莺不语 / Nightingale Silence',
  description: placeholderCopy
} as const

export const siteRoutes = {
  home: '/',
  ffxiv: '/ffxiv',
  glamour: '/ffxiv/glamour',
  plate: '/ffxiv/plate',
  about: '/about'
} as const satisfies Record<string, RoutePath>

export const homeNavItems: NavItem[] = [
  {
    id: 'ffxiv',
    label: 'FF14工具',
    route: siteRoutes.ffxiv,
    variant: 'primary'
  },
  {
    id: 'about',
    label: '关于 About',
    route: siteRoutes.about
  }
]

export const siteCategories: SiteCategory[] = [
  {
    id: 'ffxiv',
    title: 'FF14 工具',
    shortTitle: 'FF14',
    kicker: placeholderCopy,
    description: placeholderCopy,
    route: siteRoutes.ffxiv
  }
]

export const ffxivTools: ToolEntry[] = [
  {
    id: 'glamour',
    title: '幻化工房',
    projectName: 'NSGlamour',
    route: siteRoutes.glamour,
    summary: placeholderCopy,
    sourcePath: 'H:\\NightingaleSilenceWeb\\NSGlamour',
    apiBase: '/api/glamour',
    devPort: 8765,
    statusLabel: placeholderCopy
  },
  {
    id: 'plate',
    title: '铭牌工房',
    projectName: 'Plate',
    route: siteRoutes.plate,
    summary: placeholderCopy,
    sourcePath: 'H:\\NightingaleSilenceWeb\\NSPortable',
    apiBase: '/api/plate',
    devPort: 3456,
    statusLabel: placeholderCopy
  }
]

export function getCategory(id: string): SiteCategory | undefined {
  return siteCategories.find((category) => category.id === id)
}

export function getFfxivTool(id: string): ToolEntry | undefined {
  return ffxivTools.find((tool) => tool.id === id)
}

export function formatDocumentTitle(title?: string): string {
  if (!title || title === siteMeta.zhName) {
    return siteMeta.title
  }

  return `${title} - ${siteMeta.zhName}`
}
