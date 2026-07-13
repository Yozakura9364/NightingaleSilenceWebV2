<template>
  <FfxivToolShell :tool="tool" variant="workspace">
    <NSArmoireWorkspace />
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { getRequiredFfxivTool } from '@/config/site'
import { armoireUiMessages } from '@/locales/modules/armoire'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import NSArmoireWorkspace from '@/pages/armoire/components/NSArmoireWorkspace.vue'
import { loadMessages } from '@/stores/locale'

loadMessages(armoireUiMessages)

const tool = getRequiredFfxivTool('armoire')
</script>
