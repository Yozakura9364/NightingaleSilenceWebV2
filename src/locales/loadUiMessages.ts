import type { UiMessageMap, UiMessageModuleName } from '@/locales/types'
import { loadMessages } from '@/stores/locale'
import { areInternalRoutesEnabled, isSilenceEnabled } from '@/config/features'

type UiMessageLoader = () => Promise<UiMessageMap>

const messageLoaders: Partial<Record<UiMessageModuleName, UiMessageLoader>> = {
  home: () => import('@/locales/modules/home').then((module) => module.homeUiMessages),
  about: () => import('@/locales/modules/about').then((module) => module.aboutUiMessages),
  plate: () => import('@/locales/modules/plate').then((module) => module.plateUiMessages),
  glamour: () => import('@/locales/modules/glamour').then((module) => module.glamourUiMessages),
  armoire: () => import('@/locales/modules/armoire').then((module) => module.armoireUiMessages),
  fashionCheck: () =>
    import('@/locales/modules/fashionCheck').then((module) => module.fashionCheckUiMessages),
  ...(isSilenceEnabled || areInternalRoutesEnabled
    ? {
        silence: () =>
          import('@/locales/modules/silence').then((module) => module.silenceUiMessages)
      }
    : {}),
  ...(areInternalRoutesEnabled
    ? {
        styleLab: () =>
          import('@/locales/modules/styleLab').then((module) => module.styleLabUiMessages)
      }
    : {})
}

const loadedModules = new Set<UiMessageModuleName>()
const loadingModules = new Map<UiMessageModuleName, Promise<void>>()

export async function ensureUiMessageModules(moduleNames: readonly UiMessageModuleName[]) {
  await Promise.all(moduleNames.map(loadUiMessageModule))
}

async function loadUiMessageModule(moduleName: UiMessageModuleName) {
  if (loadedModules.has(moduleName)) {
    return
  }

  const pending = loadingModules.get(moduleName)

  if (pending) {
    return pending
  }

  const loader = messageLoaders[moduleName]

  if (!loader) {
    throw new Error(`UI message module is disabled in this build: ${moduleName}`)
  }

  const task = loader().then((messages) => {
    loadMessages(messages)
    loadedModules.add(moduleName)
  })

  loadingModules.set(moduleName, task)

  try {
    await task
  } finally {
    loadingModules.delete(moduleName)
  }
}
