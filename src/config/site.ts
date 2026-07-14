import type { Locale } from '@/locales/types'
import { coreUiMessages } from '@/locales/modules/core'
import { coreTextKeys as textKeys } from '@/locales/keys/core'

export type RoutePath =
  | '/'
  | '/ffxiv'
  | '/ffxiv/item-card'
  | '/ffxiv/glamour'
  | '/ffxiv/glamour/template'
  | '/ffxiv/glamour/equipinfo'
  | '/ffxiv/plate'
  | '/ffxiv/armoire'
  | '/silence'
  | '/silence/angel'
  | '/silence/glitch'
  | '/about'

export interface NavItem {
  id: string
  labelKey: string
  commandKey?: string
  route: RoutePath
  variant?: 'default' | 'primary'
}

export interface SiteCategory {
  id: string
  titleKey: string
  shortTitleKey: string
  kickerKey: string
  descriptionKey: string
  route: RoutePath
}

export interface ToolEntry {
  id: string
  titleKey: string
  projectName: string
  route: RoutePath
  summaryKey: string
  sourcePath: string
  apiBase?: string
  devPort?: number
  statusLabelKey: string
}

export interface SilenceGroupEntry {
  id: 'angel' | 'glitch'
  titleKey: string
  route: RoutePath
  summaryKey: string
  statusLabelKey: string
}

export interface SiteLocaleOption {
  locale: Locale
  labelKey: string
  commandKey: string
}

export const placeholderCopyKey = textKeys.placeholder

function defaultText(key: string): string {
  return coreUiMessages[key]?.['zh-CN'] ?? key
}

// Deprecated compatibility exports for stale Vite HMR modules from the pre-localization scaffold.
// New code must use textKeys + useLocale().t(key) instead of these static fallbacks.
export const placeholderCopy = defaultText(textKeys.placeholder)

export const siteLabels = {
  menu: defaultText(textKeys.menu),
  menuCommand: defaultText(textKeys.menuCommand),
  homeCommand: defaultText(textKeys.homeCommand),
  config: defaultText(textKeys.config),
  configCommand: defaultText(textKeys.configCommand),
  themeMode: defaultText(textKeys.themeMode),
  day: defaultText(textKeys.day),
  dayCommand: defaultText(textKeys.dayCommand),
  night: defaultText(textKeys.night),
  nightCommand: defaultText(textKeys.nightCommand),
  ffxivWorkshop: defaultText(textKeys.ffxivWorkshop),
  ffxivWorkshopShort: defaultText(textKeys.ffxivWorkshopShort),
  about: defaultText(textKeys.about),
  aboutCommand: defaultText(textKeys.aboutCommand),
  home: defaultText(textKeys.home)
} as const

export const siteMeta = {
  zhNameKey: textKeys.siteZhName,
  enNameKey: textKeys.siteEnName,
  titleKey: textKeys.siteTitle,
  descriptionKey: textKeys.siteDescription
} as const

export const siteRoutes = {
  home: '/',
  ffxiv: '/ffxiv',
  itemCard: '/ffxiv/item-card',
  glamour: '/ffxiv/glamour',
  glamourTemplate: '/ffxiv/glamour/template',
  glamourEquipInfo: '/ffxiv/glamour/equipinfo',
  plate: '/ffxiv/plate',
  armoire: '/ffxiv/armoire',
  silence: '/silence',
  silenceAngel: '/silence/angel',
  silenceGlitch: '/silence/glitch',
  about: '/about'
} as const satisfies Record<string, RoutePath>

export const siteLocaleOptions: SiteLocaleOption[] = [
  { locale: 'zh-CN', labelKey: textKeys.localeZhLabel, commandKey: textKeys.localeZhCommand },
  { locale: 'ja', labelKey: textKeys.localeJaLabel, commandKey: textKeys.localeJaCommand },
  { locale: 'ko', labelKey: textKeys.localeKoLabel, commandKey: textKeys.localeKoCommand },
  { locale: 'en', labelKey: textKeys.localeEnLabel, commandKey: textKeys.localeEnCommand }
]

export const homeNavItems: NavItem[] = [
  {
    id: 'ffxiv',
    labelKey: textKeys.ffxivWorkshop,
    route: siteRoutes.ffxiv,
    variant: 'primary'
  },
  {
    id: 'silence',
    labelKey: textKeys.silence,
    commandKey: textKeys.silenceCommand,
    route: siteRoutes.silence
  },
  {
    id: 'about',
    labelKey: textKeys.about,
    commandKey: textKeys.aboutCommand,
    route: siteRoutes.about
  }
]

export const siteCategories: SiteCategory[] = [
  {
    id: 'ffxiv',
    titleKey: textKeys.ffxivWorkshop,
    shortTitleKey: textKeys.ffxivWorkshopShort,
    kickerKey: textKeys.ffxivWorkshopKicker,
    descriptionKey: textKeys.placeholder,
    route: siteRoutes.ffxiv
  },
  {
    id: 'silence',
    titleKey: textKeys.silence,
    shortTitleKey: textKeys.silence,
    kickerKey: textKeys.placeholder,
    descriptionKey: textKeys.placeholder,
    route: siteRoutes.silence
  }
]

export const silenceGroups: SilenceGroupEntry[] = [
  {
    id: 'angel',
    titleKey: 'silence.group.angel.title',
    route: siteRoutes.silenceAngel,
    summaryKey: textKeys.placeholder,
    statusLabelKey: textKeys.statusWip
  },
  {
    id: 'glitch',
    titleKey: 'silence.group.glitch.title',
    route: siteRoutes.silenceGlitch,
    summaryKey: textKeys.placeholder,
    statusLabelKey: textKeys.statusWip
  }
]

export const ffxivTools: ToolEntry[] = [
  {
    id: 'itemCard',
    titleKey: textKeys.itemCardTitle,
    projectName: '物品卡片',
    route: siteRoutes.itemCard,
    summaryKey: textKeys.placeholder,
    sourcePath: '../NSGlamour',
    apiBase: '/api/glamour',
    devPort: 8765,
    statusLabelKey: textKeys.placeholder
  },
  {
    id: 'glamour',
    titleKey: textKeys.glamourTitle,
    projectName: 'NSGlamour',
    route: siteRoutes.glamour,
    summaryKey: textKeys.placeholder,
    sourcePath: '../NSGlamour',
    apiBase: '/api/glamour',
    devPort: 8765,
    statusLabelKey: textKeys.placeholder
  },
  {
    id: 'plate',
    titleKey: textKeys.plateTitle,
    projectName: 'NSPlate',
    route: siteRoutes.plate,
    summaryKey: textKeys.placeholder,
    sourcePath: '../NSPortable',
    apiBase: '/api/plate',
    devPort: 3456,
    statusLabelKey: textKeys.placeholder
  },
  {
    id: 'armoire',
    titleKey: textKeys.armoireTitle,
    projectName: 'NSArmoire',
    route: siteRoutes.armoire,
    summaryKey: textKeys.placeholder,
    sourcePath: 'docs/ARMOIRE_PLAN.md',
    apiBase: '/api/armoire',
    devPort: 8015,
    statusLabelKey: textKeys.placeholder
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

export function formatDocumentTitle(
  title: string | undefined,
  siteName: string,
  siteTitle: string
): string {
  if (!title || title === siteName) {
    return siteTitle
  }

  return `${title} - ${siteName}`
}
