<template>
  <AppTopNav />
  <router-view />
</template>

<script setup lang="ts">
import AppTopNav from '@/components/AppTopNav.vue'
import { useLocale } from '@/stores/locale'
import { useTheme } from '@/stores/theme'

const { initLocale } = useLocale()
const { initThemeMode } = useTheme()

initLocale()
initThemeMode()
</script>
