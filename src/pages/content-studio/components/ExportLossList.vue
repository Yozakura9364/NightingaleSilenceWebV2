<template>
  <div class="export-loss-list" :class="{ 'export-loss-list--empty': losses.length === 0 }">
    <h3 class="export-loss-list__title">{{ t(lossKeys.heading) }}</h3>
    <p v-if="losses.length === 0" class="export-loss-list__none">{{ t(lossKeys.none) }}</p>
    <ul v-else class="export-loss-list__items">
      <li
        v-for="l in losses"
        :key="`${l.nodePath.join('.')}-${l.code}`"
        class="export-loss-list__item"
        :class="`export-loss-list__item--${l.severity.toLowerCase()}`"
      >
        <span class="export-loss-list__severity" aria-hidden="true">
          {{ severityLabel(l.severity) }}
        </span>
        <span class="export-loss-list__code">{{ t(l.messageKey) }}</span>
        <span class="export-loss-list__path">[{{ l.nodePath.join('.') }}]</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import type { ExportLoss } from '@/lib/content/model/types'

defineProps<{ losses: ExportLoss[] }>()

const { t } = useLocale()
const lossKeys = {
  heading: contentStudioKeys.exportLossHeading,
  none: contentStudioKeys.exportLossNone,
}

function severityLabel(severity: ExportLoss['severity']): string {
  switch (severity) {
    case 'BLOCKING': return '!'
    case 'WARNING': return '△'
    default: return 'i'
  }
}
</script>
