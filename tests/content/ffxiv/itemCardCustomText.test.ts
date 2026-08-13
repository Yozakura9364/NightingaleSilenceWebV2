import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useItemCardCustomText', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('shares edits between the editor, PNG preview, and canvas consumers', async () => {
    const { useItemCardCustomText } =
      await import('@/pages/item-card/composables/useItemCardCustomText')
    const editor = useItemCardCustomText()
    const preview = useItemCardCustomText()

    expect(editor.add('共享文字')).toBe(true)
    expect(preview.items.value).toEqual(editor.items.value)

    const id = editor.items.value[0].id
    preview.update(id, '已更新文字')
    expect(editor.items.value[0].text).toBe('已更新文字')

    preview.remove(id)
    expect(editor.items.value).toEqual([])
  })
})
