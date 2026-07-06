import { ref, watch } from 'vue'
import {
  ARMOIRE_STORE_SPECIAL_DYE_IDS,
  DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES,
  DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS,
  type ArmoireDyeValueCategory
} from '@/lib/armoire/types'

const STORAGE_KEY = 'nsarmoire.valuableDyePreferences.v2'
const LEGACY_CATEGORY_STORAGE_KEY = 'nsarmoire.valuableDyeCategories.v1'
const CATEGORY_OPTIONS: readonly ArmoireDyeValueCategory[] = ['general', 'extra1', 'extra2']
const VALID_DYE_VALUE_CATEGORIES = new Set<string>(CATEGORY_OPTIONS)
const VALID_STORE_DYE_IDS = new Set<number>(ARMOIRE_STORE_SPECIAL_DYE_IDS)

interface StoredDyePreferences {
  categories: ArmoireDyeValueCategory[]
  storeDyeIds: number[]
}

function getDefaultPreferences(): StoredDyePreferences {
  return {
    categories: [...DEFAULT_ARMOIRE_VALUABLE_DYE_CATEGORIES],
    storeDyeIds: [...DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS]
  }
}

function normalizeCategories(value: unknown): ArmoireDyeValueCategory[] {
  return Array.isArray(value)
    ? value.filter((category): category is ArmoireDyeValueCategory =>
        VALID_DYE_VALUE_CATEGORIES.has(String(category))
      )
    : []
}

function normalizeStoreDyeIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((dyeId) => Number(dyeId))
        .filter((dyeId) => Number.isInteger(dyeId) && VALID_STORE_DYE_IDS.has(dyeId))
    : []
}

function readLegacyPreferences(): StoredDyePreferences | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_CATEGORY_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const value: unknown = JSON.parse(raw)
    const legacyCategories = Array.isArray(value) ? value : []
    return {
      categories: normalizeCategories(legacyCategories),
      storeDyeIds: legacyCategories.includes('storeSpecial')
        ? [...DEFAULT_ARMOIRE_VALUABLE_STORE_DYE_IDS]
        : []
    }
  } catch {
    return null
  }
}

function readStoredPreferences(): StoredDyePreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return readLegacyPreferences() ?? getDefaultPreferences()
    }

    const value: unknown = JSON.parse(raw)

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return getDefaultPreferences()
    }

    const record = value as Record<string, unknown>
    return {
      categories: normalizeCategories(record.categories),
      storeDyeIds: normalizeStoreDyeIds(record.storeDyeIds)
    }
  } catch {
    return getDefaultPreferences()
  }
}

function writeStoredPreferences(preferences: StoredDyePreferences): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

export function useArmoireDyePreferences() {
  const preferences = readStoredPreferences()
  const selectedDyeValueCategories = ref<ArmoireDyeValueCategory[]>(preferences.categories)
  const selectedValuableDyeIds = ref<number[]>(preferences.storeDyeIds)

  function toggleDyeValueCategory(category: ArmoireDyeValueCategory): void {
    if (selectedDyeValueCategories.value.includes(category)) {
      selectedDyeValueCategories.value = selectedDyeValueCategories.value.filter(
        (selectedCategory) => selectedCategory !== category
      )
      return
    }

    selectedDyeValueCategories.value = [...selectedDyeValueCategories.value, category]
  }

  function toggleValuableDyeId(dyeId: number): void {
    if (!VALID_STORE_DYE_IDS.has(dyeId)) {
      return
    }

    if (selectedValuableDyeIds.value.includes(dyeId)) {
      selectedValuableDyeIds.value = selectedValuableDyeIds.value.filter(
        (selectedDyeId) => selectedDyeId !== dyeId
      )
      return
    }

    selectedValuableDyeIds.value = [...selectedValuableDyeIds.value, dyeId].sort(
      (left, right) => left - right
    )
  }

  watch(
    [selectedDyeValueCategories, selectedValuableDyeIds],
    ([categories, storeDyeIds]) =>
      writeStoredPreferences({
        categories,
        storeDyeIds
      }),
    { deep: true }
  )

  return {
    selectedDyeValueCategories,
    selectedValuableDyeIds,
    toggleDyeValueCategory,
    toggleValuableDyeId
  }
}
