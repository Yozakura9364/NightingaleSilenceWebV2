import armoireIcon from '@/assets/icons/site/armoire-64.png'
import aboutIcon from '@/assets/icons/site/about-64.png'
import fashionCheckIcon from '@/assets/icons/site/fashion-check-64.png'
import ffxivWorkshopIcon from '@/assets/icons/site/ffxiv-workshop-64.png'
import glamourIcon from '@/assets/icons/site/glamour-64.png'
import itemCardIcon from '@/assets/icons/site/item-card-64.png'
import platePortraitIcon from '@/assets/icons/plate/portrait-64.webp'
import homeIcon from '@/assets/icons/pixelarticons/home.svg'
import { ffxivTools, siteMeta, siteRoutes, type RoutePath } from '@/config/site'
import { coreTextKeys as textKeys } from '@/locales/keys/core'

export interface OsShellToolPresentation {
  id: string
  icon: string
  titleKey: string
  route: RoutePath
}

export const osShellDesktopPresentation: OsShellToolPresentation = {
  id: 'home',
  icon: homeIcon,
  titleKey: siteMeta.zhNameKey,
  route: siteRoutes.home
}

export const osShellPrimaryPresentations: OsShellToolPresentation[] = [
  {
    id: 'ffxiv',
    icon: ffxivWorkshopIcon,
    titleKey: textKeys.ffxivWorkshop,
    route: siteRoutes.ffxiv
  },
  {
    id: 'about',
    icon: aboutIcon,
    titleKey: textKeys.about,
    route: siteRoutes.about
  }
]

const toolIcons: Record<string, string> = {
  itemCard: itemCardIcon,
  glamour: glamourIcon,
  plate: platePortraitIcon,
  armoire: armoireIcon,
  fashionCheck: fashionCheckIcon
}

export const osShellToolPresentations: OsShellToolPresentation[] = ffxivTools.map((tool) => ({
  id: tool.id,
  icon: toolIcons[tool.id],
  titleKey: tool.titleKey,
  route: tool.route
}))

export function getOsShellToolPresentation(id: string): OsShellToolPresentation | undefined {
  return osShellToolPresentations.find((presentation) => presentation.id === id)
}
