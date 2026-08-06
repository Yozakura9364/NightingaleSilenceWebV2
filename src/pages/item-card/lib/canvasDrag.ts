export const ITEM_CARD_CANVAS_DRAG_MIME = 'application/x-item-card-source'

export type ItemCardCanvasDragSource =
  | { kind: 'item'; sourceId: string }
  | { kind: 'customText'; sourceId: string }

export function encodeItemCardCanvasDragSource(source: ItemCardCanvasDragSource): string {
  return JSON.stringify(source)
}

export function decodeItemCardCanvasDragSource(
  value: string | null | undefined
): ItemCardCanvasDragSource | undefined {
  if (!value) {
    return undefined
  }
  try {
    const parsed = JSON.parse(value) as Partial<ItemCardCanvasDragSource>
    if (
      (parsed.kind === 'item' || parsed.kind === 'customText') &&
      typeof parsed.sourceId === 'string' &&
      parsed.sourceId.length > 0
    ) {
      return parsed as ItemCardCanvasDragSource
    }
  } catch {
    // 拖拽数据来自浏览器 DataTransfer，格式错误时直接忽略。
  }
  return undefined
}
