<template>
  <FfxivToolShell :tool="tool" :boundary="boundary" variant="workspace">
    <NSPlateWorkspace :boundary="boundary" />
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { getRequiredFfxivTool } from '@/config/site'
import { plateUiMessages } from '@/locales/modules/plate'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import NSPlateWorkspace from '@/pages/plate/components/NSPlateWorkspace.vue'
import { getApiBoundary } from '@/services/apiBoundaries'
import { loadMessages } from '@/stores/locale'
import '@/pages/plate/nsplate-fonts.css'

loadMessages(plateUiMessages)

const tool = getRequiredFfxivTool('plate')
const boundary = getApiBoundary('plate')
</script>
