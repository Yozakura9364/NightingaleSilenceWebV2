<script setup lang="ts">
// ContentTable.vue — public table rendering (T041). colspan/rowspan/colwidth
// come from validated cell attrs; cell bodies render through ContentRichText.
import ContentRichText from './ContentRichText.vue'
import type { SafeTable, SafeTableCell } from '@/lib/content/render/contentViewModel'

defineProps<{ rows: SafeTable['rows'] }>()

function cellWidthStyle(cell: SafeTableCell): Record<string, string> | undefined {
  if (cell.colwidth && cell.colwidth.length > 0) {
    return { width: `${cell.colwidth[0]}px` }
  }
  return undefined
}
</script>

<template>
  <div class="ns-table-wrap">
    <table class="ns-table">
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <component
            :is="cell.kind === 'header' ? 'th' : 'td'"
            v-for="(cell, j) in row.cells"
            :key="j"
            :colspan="cell.colspan"
            :rowspan="cell.rowspan"
            :style="cellWidthStyle(cell)"
            :class="cell.textAlign ? `ns-align-${cell.textAlign}` : ''"
          >
            <ContentRichText :document="{ blocks: cell.children }" />
          </component>
        </tr>
      </tbody>
    </table>
  </div>
</template>
