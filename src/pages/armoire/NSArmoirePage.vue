<template>
  <FfxivToolShell :tool="tool" variant="workspace">
    <NSArmoireWorkspace />
  </FfxivToolShell>
</template>

<script setup lang="ts">
import { getRequiredFfxivTool } from '@/config/site'
import FfxivToolShell from '@/pages/ffxiv/components/FfxivToolShell.vue'
import NSArmoireWorkspace from '@/pages/armoire/components/NSArmoireWorkspace.vue'

const tool = getRequiredFfxivTool('armoire')
</script>
