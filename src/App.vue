<template>
  <AppTopNav />
  <router-view />
</template>

<script setup lang="ts">
import AppTopNav from '@/components/AppTopNav.vue'
import { useTheme } from '@/stores/theme'

const { initThemeMode } = useTheme()

initThemeMode()
</script>
