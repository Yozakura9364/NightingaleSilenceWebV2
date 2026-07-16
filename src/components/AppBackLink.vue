<template>
  <RouterLink
    class="app-back-link"
    :to="to"
    :aria-label="t(textKeys.back)"
    :title="t(textKeys.back)"
  >
    <span class="app-back-link__icon" :style="iconStyle" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import cornerUpLeftIcon from '@/assets/icons/pixelarticons/corner-up-left.svg'
import { coreTextKeys as textKeys } from '@/locales/keys/core'
import { useLocale } from '@/stores/locale'

defineProps<{ to: RouteLocationRaw }>()

const { t } = useLocale()
const iconStyle = {
  '--app-back-link-icon': `url("${cornerUpLeftIcon}")`
} as CSSProperties
</script>
