<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" variant="workspace">
    <NSGlamourWorkspace :boundary="boundary" />
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { getRequiredFfxivTool } from '@/config/site'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import NSGlamourWorkspace from '@/pages/glamour/components/NSGlamourWorkspace.vue'
import { getApiBoundary } from '@/services/apiBoundaries'

const tool = getRequiredFfxivTool('glamour')
const boundary = getApiBoundary('glamour')
</script>
