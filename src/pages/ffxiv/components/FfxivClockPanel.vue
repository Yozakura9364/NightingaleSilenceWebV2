<template>
  <div class="ffxiv-clock-panel">
    <FfxivMechanismClocks :now="now" />
    <FfxivCommunityEvents :now="now" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import FfxivMechanismClocks from './FfxivMechanismClocks.vue'

// vis-timeline 体积较大，社区事件时间轴按需拆分加载
const FfxivCommunityEvents = defineAsyncComponent(() => import('./FfxivCommunityEvents.vue'))

const now = ref(Date.now())
let timer = 0

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
})
</script>

<style scoped>
.ffxiv-clock-panel {
  display: grid;
  gap: 28px;
  margin-top: 34px;
  padding-bottom: 32px;
  font-family: var(--ns-font-ui);
}
</style>
