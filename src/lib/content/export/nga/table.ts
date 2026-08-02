// NGA table serialization — tables, rows, cells, header degradation and span
// loss reporting (T051).

import { serializeBlocks } from './blocks'
import type { ExportLoss, TableRowNode } from '@/lib/content/model/types'

export interface TableResult {
  text: string
  losses: ExportLoss[]
}

function loss(severity: ExportLoss['severity'], nodePath: number[], nodeType: string, code: string): ExportLoss {
  return { severity, nodePath, nodeType, code, messageKey: `contentStudio.export.loss.${code}`, fallback: null }
}

export function serializeTable(node: { content: TableRowNode[] }, nodePath: number[]): TableResult {
  const rows: string[] = []
  const losses: ExportLoss[] = []

  node.content.forEach((row, rowIdx) => {
    const rowPath = [...nodePath, rowIdx]
    const cells: string[] = []
    row.content.forEach((cell, cellIdx) => {
      const cellPath = [...rowPath, cellIdx]
      const inner = serializeBlocks(cell.content, cellPath)
      losses.push(...inner.losses)
      // NGA supports spans natively: [td colspan=N] / [td rowspan=M]
      const colspan = cell.attrs?.colspan && cell.attrs.colspan > 1 ? cell.attrs.colspan : 1
      const rowspan = cell.attrs?.rowspan && cell.attrs.rowspan > 1 ? cell.attrs.rowspan : 1
      const spanAttrs = [
        colspan > 1 ? `colspan=${colspan}` : '',
        rowspan > 1 ? `rowspan=${rowspan}` : '',
      ].filter(Boolean).join(' ')
      const open = spanAttrs ? `[td ${spanAttrs}]` : '[td]'
      const content = inner.text
      if (cell.type === 'tableHeader') {
        losses.push(loss('INFO', cellPath, 'tableHeader', 'table-header-degraded'))
        cells.push(`${open}[b]${content}[/b][/td]`)
      } else {
        cells.push(`${open}${content}[/td]`)
      }
    })
    rows.push(`[tr]${cells.join('')}[/tr]`)
  })

  return { text: `[table]\n${rows.join('\n')}\n[/table]`, losses }
}
