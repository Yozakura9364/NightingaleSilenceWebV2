import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { watch } from 'vue'
import { formatDocumentTitle, getCategory, getFfxivTool, siteMeta, siteRoutes } from '@/config/site'
import {
  areInternalRoutesEnabled,
  isArmoireWorkbenchEnabled,
  isSilenceEnabled
} from '@/config/features'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { ensureUiMessageModules } from '@/locales/loadUiMessages'
import type { UiMessageModuleName } from '@/locales/types'
import { useLocale } from '@/stores/locale'

const ffxivCategory = getCategory('ffxiv')
const silenceCategory = getCategory('silence')
const itemCardTool = getFfxivTool('itemCard')
const glamourTool = getFfxivTool('glamour')
const plateTool = getFfxivTool('plate')
const armoireTool = getFfxivTool('armoire')
const fashionCheckTool = getFfxivTool('fashionCheck')
const { current: locale, messages, t } = useLocale()

function loadLocalizedPage<T>(
  moduleNames: readonly UiMessageModuleName[],
  loadPage: () => Promise<T>
) {
  return async () => {
    const [, page] = await Promise.all([ensureUiMessageModules(moduleNames), loadPage()])
    return page
  }
}

const armoireRoutes: RouteRecordRaw[] = [
  {
    path: siteRoutes.armoire,
    name: 'ffxiv-armoire',
    meta: { titleKey: armoireTool?.titleKey ?? textKeys.armoireTitle },
    component: isArmoireWorkbenchEnabled
      ? loadLocalizedPage(['armoire'], () => import('@/pages/armoire/NSArmoirePage.vue'))
      : loadLocalizedPage(['armoire'], () => import('@/pages/armoire/NSArmoireLandingPage.vue'))
  },
  ...(isArmoireWorkbenchEnabled
    ? [
        {
          path: '/ffxiv/armoire/store-review',
          name: 'ffxiv-armoire-store-review',
          meta: { titleKey: 'nsarmoire.storeReview.title' },
          component: loadLocalizedPage(
            ['armoire'],
            () => import('@/pages/armoire/NSArmoireStoreReviewPage.vue')
          )
        } satisfies RouteRecordRaw
      ]
    : [])
]

const silenceRoutes: RouteRecordRaw[] = isSilenceEnabled
  ? [
      {
        path: siteRoutes.silence,
        name: 'silence',
        meta: { titleKey: silenceCategory?.titleKey ?? textKeys.silence },
        component: loadLocalizedPage(
          ['silence'],
          () => import('@/pages/silence/SilenceIndexPage.vue')
        )
      },
      {
        path: siteRoutes.silenceAngel,
        name: 'silence-angel',
        meta: { titleKey: 'silence.group.angel.title' },
        component: loadLocalizedPage(
          ['silence'],
          () => import('@/pages/silence/SilenceGroupPage.vue')
        )
      },
      {
        path: '/silence/angel/:characterId',
        name: 'silence-angel-character',
        meta: { titleKey: 'silence.group.angel.title' },
        component: loadLocalizedPage(
          ['silence'],
          () => import('@/pages/silence/SilenceCharacterPage.vue')
        )
      },
      {
        path: siteRoutes.silenceGlitch,
        name: 'silence-glitch',
        meta: { titleKey: 'silence.group.glitch.title' },
        component: loadLocalizedPage(
          ['silence'],
          () => import('@/pages/silence/SilenceGroupPage.vue')
        )
      },
      {
        path: '/silence/glitch/:characterId',
        name: 'silence-glitch-character',
        meta: { titleKey: 'silence.group.glitch.title' },
        component: loadLocalizedPage(
          ['silence'],
          () => import('@/pages/silence/SilenceCharacterPage.vue')
        )
      }
    ]
  : []

const internalRoutes: RouteRecordRaw[] = areInternalRoutesEnabled
  ? [
      {
        path: '/ffxiv/term-review',
        name: 'ffxiv-term-review',
        meta: { titleKey: textKeys.ffxivTermReviewTitle },
        component: () => import('@/pages/ffxiv/FfxivTermReviewPage.vue')
      },
      {
        path: '/style-lab',
        name: 'style-lab',
        meta: { title: 'Style Lab', hideTopNav: true },
        component: loadLocalizedPage(
          ['home', 'plate', 'glamour', 'armoire', 'silence', 'styleLab'],
          () => import('@/pages/style-lab/StyleLabPage.vue')
        )
      }
    ]
  : []

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: siteRoutes.home,
      name: 'home',
      meta: { titleKey: siteMeta.zhNameKey },
      component: loadLocalizedPage(['home'], () => import('@/pages/home/HomePage.vue'))
    },
    {
      path: siteRoutes.ffxiv,
      name: 'ffxiv',
      meta: { titleKey: ffxivCategory?.titleKey ?? textKeys.ffxivWorkshop },
      component: () => import('@/pages/ffxiv/FfxivIndexPage.vue')
    },
    {
      path: siteRoutes.itemCard,
      name: 'ffxiv-item-card',
      meta: { titleKey: itemCardTool?.titleKey ?? textKeys.itemCardTitle },
      component: () => import('@/pages/item-card/ItemCardPage.vue')
    },
    {
      path: siteRoutes.glamour,
      name: 'ffxiv-glamour',
      meta: { titleKey: glamourTool?.titleKey ?? textKeys.glamourTitle },
      redirect: siteRoutes.glamourTemplate
    },
    {
      path: siteRoutes.glamourTemplate,
      name: 'ffxiv-glamour-template',
      meta: { titleKey: glamourTool?.titleKey ?? textKeys.glamourTitle },
      component: loadLocalizedPage(['glamour'], () => import('@/pages/glamour/NSGlamourPage.vue'))
    },
    {
      path: siteRoutes.glamourEquipInfo,
      name: 'ffxiv-glamour-equipinfo',
      meta: { titleKey: glamourTool?.titleKey ?? textKeys.glamourTitle },
      component: loadLocalizedPage(['glamour'], () => import('@/pages/glamour/NSGlamourPage.vue'))
    },
    {
      path: siteRoutes.plate,
      name: 'ffxiv-plate',
      meta: { titleKey: plateTool?.titleKey ?? textKeys.plateTitle },
      component: loadLocalizedPage(['plate'], () => import('@/pages/plate/NSPlatePage.vue'))
    },
    {
      path: siteRoutes.fashionCheck,
      meta: { titleKey: fashionCheckTool?.titleKey ?? 'fashionCheck.title' },
      component: loadLocalizedPage(
        ['fashionCheck'],
        () => import('@/pages/fashion-check/FashionCheckPage.vue')
      ),
      children: [
        {
          path: '',
          name: 'ffxiv-fashion-check',
          component: () => import('@/pages/fashion-check/views/FashionCheckSolutionsView.vue')
        },
        {
          path: 'gold-items',
          name: 'ffxiv-fashion-check-gold-items',
          component: () => import('@/pages/fashion-check/views/FashionCheckGoldItemsView.vue')
        },
        {
          path: 'sources',
          name: 'ffxiv-fashion-check-sources',
          component: () => import('@/pages/fashion-check/views/FashionCheckSourcesView.vue')
        }
      ]
    },
    ...armoireRoutes,
    ...silenceRoutes,
    {
      path: siteRoutes.about,
      name: 'about',
      meta: { titleKey: textKeys.about },
      component: loadLocalizedPage(['about'], () => import('@/pages/about/AboutPage.vue'))
    },
    ...internalRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.afterEach((to) => {
  updateDocumentTitle(to.meta.titleKey ?? to.meta.title)
})

function updateDocumentTitle(titleKeyOrText?: string) {
  const title =
    titleKeyOrText && titleKeyOrText in messages.value ? t(titleKeyOrText) : titleKeyOrText
  document.title = formatDocumentTitle(title, t(siteMeta.zhNameKey), t(siteMeta.titleKey))
}

watch([locale, messages], () => {
  updateDocumentTitle(
    router.currentRoute.value.meta.titleKey ?? router.currentRoute.value.meta.title
  )
})

// 阶段三：路由级 prefetch — 在空闲时预取高概率访问页面，减少导航延迟
const PREFETCH_ROUTES = ['ffxiv-plate', 'ffxiv-glamour-template', 'ffxiv-armoire']
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    for (const routeName of PREFETCH_ROUTES) {
      const route = router.resolve({ name: routeName }) as { component?: () => Promise<unknown> }
      if (typeof route.component === 'function') {
        route.component().catch(() => {})
      }
    }
  })
}

export default router
