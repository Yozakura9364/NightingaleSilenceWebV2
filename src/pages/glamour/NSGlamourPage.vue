<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" variant="workspace" />
</template>

<script setup lang="ts">
import { getRequiredFfxivTool } from '@/config/site'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import { getApiBoundary } from '@/services/apiBoundaries'

const tool = getRequiredFfxivTool('glamour')
const boundary = getApiBoundary('glamour')
</script>
