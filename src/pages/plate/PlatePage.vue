<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" />
</template>

<script setup lang="ts">
import { getFfxivTool } from '@/config/site'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { getApiBoundary } from '@/services/apiBoundaries'

const tool = getFfxivTool('plate') ?? {
  id: 'plate',
  title: '铭牌工房',
  projectName: 'Plate',
  route: '/ffxiv/plate',
  summary: '',
  sourcePath: 'H:\\NightingaleSilenceWeb\\NSPortable',
  apiBase: '/api/plate',
  devPort: 3456,
  statusLabel: ''
}

const boundary = getApiBoundary('plate')
</script>
