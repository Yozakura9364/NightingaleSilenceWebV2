import { ref, watch } from 'vue'
import {
  ARMOIRE_DYE_VALUE_CATEGORIES,
  DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES,
  type ArmoireDyeValueCategory
} from '@/lib/armoire/types'

const STORAGE_KEY = 'nsarmoire.valuableDyeCategories.v1'
const VALID_DYE_VALUE_CATEGORIES = new Set<string>(ARMOIRE_DYE_VALUE_CATEGORIES)

function readStoredCategories(): ArmoireDyeValueCategory[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES]
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return [...DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES]
    }

    const value: unknown = JSON.parse(raw)

    if (!Array.isArray(value)) {
      return [...DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES]
    }

    return value.filter((category): category is ArmoireDyeValueCategory =>
      VALID_DYE_VALUE_CATEGORIES.has(String(category))
    )
  } catch {
    return [...DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES]
  }
}

function writeStoredCategories(categories: readonly ArmoireDyeValueCategory[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

export function useArmoireDyePreferences() {
  const selectedDyeValueCategories = ref<ArmoireDyeValueCategory[]>(readStoredCategories())

  function toggleDyeValueCategory(category: ArmoireDyeValueCategory): void {
    if (selectedDyeValueCategories.value.includes(category)) {
      selectedDyeValueCategories.value = selectedDyeValueCategories.value.filter(
        (selectedCategory) => selectedCategory !== category
      )
      return
    }

    selectedDyeValueCategories.value = [...selectedDyeValueCategories.value, category]
  }

  watch(selectedDyeValueCategories, (categories) => writeStoredCategories(categories), {
    deep: true
  })

  return {
    selectedDyeValueCategories,
    toggleDyeValueCategory
  }
}
