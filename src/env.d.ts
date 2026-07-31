/// <reference types="vite/client" />

import 'vue-router'

interface ImportMetaEnv {
  readonly VITE_ENABLE_INTERNAL_ROUTES?: string
  readonly VITE_ENABLE_SILENCE?: string
  readonly VITE_LOCAL_ASSET_BASE?: string
  readonly VITE_SILENCE_LAYOUT_BASE?: string
  readonly VITE_FFXIV_COMMUNITY_EVENTS_URL?: string
  readonly VITE_ENABLE_CONTENT_STUDIO?: string
  readonly VITE_CONTENT_STUDIO_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    titleKey?: string
    hideTopNav?: boolean
  }
}
