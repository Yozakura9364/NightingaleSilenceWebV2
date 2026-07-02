<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" />
</template>

<script setup lang="ts">
import { getFfxivTool } from '@/config/site'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { getApiBoundary } from '@/services/apiBoundaries'

const tool = getFfxivTool('glamour') ?? {
  id: 'glamour',
  title: '幻化工房',
  projectName: 'NSGlamour',
  route: '/ffxiv/glamour',
  summary: '',
  sourcePath: 'H:\\NightingaleSilenceWeb\\NSGlamour',
  apiBase: '/api/glamour',
  devPort: 8765,
  statusLabel: ''
}

const boundary = getApiBoundary('glamour')
</script>
