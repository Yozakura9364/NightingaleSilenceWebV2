export type RoutePath = '/' | '/ffxiv' | '/ffxiv/glamour' | '/ffxiv/plate' | '/about'

export interface NavItem {
  id: string
  label: string
  command?: string
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

export const siteLabels = {
  menu: '菜单',
  menuCommand: 'MENU',
  homeCommand: 'HOME',
  config: '设置',
  configCommand: 'CONFIG',
  themeMode: '显示模式',
  day: '白天',
  dayCommand: 'DAY',
  night: '黑夜',
  nightCommand: 'NIGHT',
  ffxivWorkshop: '狒狒14工房',
  ffxivWorkshopShort: '狒狒14',
  about: '关于',
  aboutCommand: 'ABOUT',
  home: '回到主页'
} as const

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
    label: siteLabels.ffxivWorkshop,
    route: siteRoutes.ffxiv,
    variant: 'primary'
  },
  {
    id: 'about',
    label: siteLabels.about,
    command: siteLabels.aboutCommand,
    route: siteRoutes.about
  }
]

export const siteCategories: SiteCategory[] = [
  {
    id: 'ffxiv',
    title: siteLabels.ffxivWorkshop,
    shortTitle: siteLabels.ffxivWorkshopShort,
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
    sourcePath: '../NSGlamour',
    apiBase: '/api/glamour',
    devPort: 8765,
    statusLabel: placeholderCopy
  },
  {
    id: 'plate',
    title: '铭牌工房',
    projectName: 'NSPlate',
    route: siteRoutes.plate,
    summary: placeholderCopy,
    sourcePath: '../NSPortable',
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

export function getRequiredFfxivTool(id: string): ToolEntry {
  const tool = getFfxivTool(id)

  if (!tool) {
    throw new Error(`Unknown FFXIV tool: ${id}`)
  }

  return tool
}

export function formatDocumentTitle(title?: string): string {
  if (!title || title === siteMeta.zhName) {
    return siteMeta.title
  }

  return `${title} - ${siteMeta.zhName}`
}
