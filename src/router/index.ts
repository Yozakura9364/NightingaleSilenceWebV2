import { createRouter, createWebHashHistory } from 'vue-router'
import {
  formatDocumentTitle,
  getCategory,
  getFfxivTool,
  placeholderCopy,
  siteMeta,
  siteRoutes
} from '@/config/site'

const ffxivCategory = getCategory('ffxiv')
const glamourTool = getFfxivTool('glamour')
const plateTool = getFfxivTool('plate')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: siteRoutes.home,
      name: 'home',
      meta: { title: siteMeta.zhName },
      component: () => import('@/pages/home/HomePage.vue')
    },
    {
      path: siteRoutes.ffxiv,
      name: 'ffxiv',
      meta: { title: ffxivCategory?.title ?? 'FF14 工具' },
      component: () => import('@/pages/ffxiv/FfxivIndexPage.vue')
    },
    {
      path: siteRoutes.glamour,
      name: 'ffxiv-glamour',
      meta: { title: glamourTool?.title ?? '幻化工房' },
      component: () => import('@/pages/glamour/GlamourPage.vue')
    },
    {
      path: siteRoutes.plate,
      name: 'ffxiv-plate',
      meta: { title: plateTool?.title ?? '铭牌工房' },
      component: () => import('@/pages/plate/PlatePage.vue')
    },
    {
      path: siteRoutes.about,
      name: 'about',
      meta: { title: placeholderCopy },
      component: () => import('@/pages/about/AboutPage.vue')
    },
    {
      path: '/style-lab',
      name: 'style-lab',
      meta: { title: 'Style Lab', hideTopNav: true },
      component: () => import('@/pages/style-lab/StyleLabPage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : undefined
  document.title = formatDocumentTitle(title)
})

export default router
