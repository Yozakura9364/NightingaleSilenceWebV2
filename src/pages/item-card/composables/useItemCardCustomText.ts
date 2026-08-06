import { ref } from 'vue'
import {
  createItemCardCustomTextId,
  readItemCardCustomTexts,
  writeItemCardCustomTexts
} from '@/pages/item-card/lib/customText'
import type { ItemCardCustomText } from '@/pages/item-card/lib/types'

export function useItemCardCustomText() {
  const items = ref<ItemCardCustomText[]>(readItemCardCustomTexts())

  function persist() {
    writeItemCardCustomTexts(items.value)
  }

  function add(text: string): boolean {
    if (!text.trim()) {
      return false
    }
    items.value = [...items.value, { id: createItemCardCustomTextId(), text }]
    persist()
    return true
  }

  function update(id: string, text: string) {
    items.value = items.value.map((item) => (item.id === id ? { ...item, text } : item))
    persist()
  }

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
    persist()
  }

  return { items, add, update, remove }
}
