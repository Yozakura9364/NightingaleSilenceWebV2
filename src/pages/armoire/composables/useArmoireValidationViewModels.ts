import { computed } from 'vue'
import { textKeys } from '@/config/site'
import type {
  ArmoireCatalog,
  ArmoireCatalogItem,
  ArmoireModelTuple,
  ArmoireOwnedItem,
  ArmoireSnapshot,
  ArmoireSnapshotAnalysis
} from '@/lib/armoire/types'
import {
  formatArmoireDyeNames,
  formatArmoireDyeResetReasons,
  formatArmoireItemId,
  formatArmoireText,
  getArmoireContainerLabel,
  getArmoireItemName
} from '@/pages/armoire/utils/itemDisplay'

type Translate = (key: string) => string

type ValidationTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface ArmoireValidationEvidenceRowView {
  key: string
  label: string
  value: string
  code?: boolean
}

export interface ArmoireValidationCaseView {
  key: string
  title: string
  status: string
  tone: ValidationTone
  description: string
  rows: ArmoireValidationEvidenceRowView[]
}

interface ValidationSource {
  analysis: ArmoireSnapshotAnalysis | null
  catalog: ArmoireCatalog
  snapshot: ArmoireSnapshot | null
}

function formatItemIds(itemIds: number[], catalog: ArmoireCatalog, t: Translate): string {
  return itemIds.map((itemId) => getArmoireItemName(catalog, itemId, t)).join(' / ')
}

function getItemEntries(snapshot: ArmoireSnapshot | null, itemId: number): ArmoireOwnedItem[] {
  return snapshot?.items.filter((item) => item.itemId === itemId) ?? []
}

function formatLocations(entries: ArmoireOwnedItem[], t: Translate): string {
  return entries.map((entry) => getArmoireContainerLabel(entry, t)).join(' / ')
}

function formatModelTuple(model: ArmoireModelTuple | undefined): string {
  return model ? `[${model.join(', ')}]` : '-'
}

function formatCatalogModelEvidence(item: ArmoireCatalogItem | undefined): string {
  return [
    `main=${formatModelTuple(item?.mainModel)}`,
    `sub=${formatModelTuple(item?.subModel)}`,
    `ui=${item?.itemUiCategoryId ?? '-'}`,
    `slot=${item?.equipSlotCategoryId ?? '-'}`
  ].join(' / ')
}

function createRuleRow(value: string, t: Translate): ArmoireValidationEvidenceRowView {
  return {
    key: 'rule',
    label: t(textKeys.nsarmoireValidationEvidenceRule),
    value
  }
}

function createFieldsRow(value: string, t: Translate): ArmoireValidationEvidenceRowView {
  return {
    key: 'fields',
    label: t(textKeys.nsarmoireValidationEvidenceFields),
    value,
    code: true
  }
}

function createResultRow(value: string, t: Translate): ArmoireValidationEvidenceRowView {
  return {
    key: 'result',
    label: t(textKeys.nsarmoireValidationEvidenceResult),
    value
  }
}

function createDuplicateItemCase(
  source: ValidationSource,
  t: Translate
): ArmoireValidationCaseView {
  const group = source.analysis?.duplicateItems.groups[0]

  if (!group) {
    return {
      key: 'duplicate-items',
      title: t(textKeys.nsarmoireRecommendationDuplicateItems),
      status: t(textKeys.nsarmoireValidationStatusNotTriggered),
      tone: 'success',
      description: t(textKeys.nsarmoireValidationDuplicateItemsNone),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationDuplicateItemsRule), t),
        createFieldsRow('snapshot.items[].itemId / snapshot.items[].container', t),
        createResultRow('0', t)
      ]
    }
  }

  const entries = getItemEntries(source.snapshot, group.itemId)
  const name = getArmoireItemName(source.catalog, group.itemId, t)

  return {
    key: 'duplicate-items',
    title: t(textKeys.nsarmoireRecommendationDuplicateItems),
    status: t(textKeys.nsarmoireValidationStatusTriggered),
    tone: 'warning',
    description: formatArmoireText(t, textKeys.nsarmoireValidationDuplicateItemsHit, {
      item: name
    }),
    rows: [
      createRuleRow(t(textKeys.nsarmoireValidationDuplicateItemsRule), t),
      {
        key: 'item',
        label: t(textKeys.nsarmoireValidationEvidenceItem),
        value: `${name} / ${formatArmoireItemId(group.itemId, t)}`
      },
      createResultRow(
        formatArmoireText(t, textKeys.nsarmoireValidationDuplicateItemsResult, {
          entries: group.ownedEntryCount,
          quantity: group.totalQuantity
        }),
        t
      ),
      {
        key: 'locations',
        label: t(textKeys.nsarmoireValidationEvidenceLocations),
        value: formatLocations(entries, t)
      },
      createFieldsRow('snapshot.items[].itemId / snapshot.items[].container / quantity', t)
    ]
  }
}

function createIdenticalModelCase(
  source: ValidationSource,
  t: Translate
): ArmoireValidationCaseView {
  if (!source.analysis || source.analysis.identicalModels.status === 'missingCatalog') {
    return {
      key: 'identical-models',
      title: t(textKeys.nsarmoireRecommendationDuplicates),
      status: t(textKeys.nsarmoireValidationStatusWaitingCatalog),
      tone: 'neutral',
      description: t(textKeys.nsarmoireValidationIdenticalModelsPending),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationIdenticalModelsRule), t),
        createFieldsRow('Item.Model{Main} / Item.Model{Sub} / ItemUICategory / EquipSlotCategory', t)
      ]
    }
  }

  const group = source.analysis.identicalModels.groups[0]

  if (!group) {
    return {
      key: 'identical-models',
      title: t(textKeys.nsarmoireRecommendationDuplicates),
      status: t(textKeys.nsarmoireValidationStatusNotTriggered),
      tone: 'success',
      description: t(textKeys.nsarmoireValidationIdenticalModelsNone),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationIdenticalModelsRule), t),
        createFieldsRow('Item.Model{Main} / Item.Model{Sub} / ItemUICategory / EquipSlotCategory', t),
        createResultRow('0', t)
      ]
    }
  }

  const modelEvidence = group.ownedItemIds
    .map((itemId) => {
      const name = getArmoireItemName(source.catalog, itemId, t)
      return `${name}: ${formatCatalogModelEvidence(source.catalog.items[itemId])}`
    })
    .join('；')
  const itemNames = formatItemIds(group.storageSpaceItemIds, source.catalog, t)

  return {
    key: 'identical-models',
    title: t(textKeys.nsarmoireRecommendationDuplicates),
    status: t(textKeys.nsarmoireValidationStatusTriggered),
    tone: 'warning',
    description: formatArmoireText(t, textKeys.nsarmoireValidationIdenticalModelsHit, {
      items: itemNames
    }),
    rows: [
      createRuleRow(t(textKeys.nsarmoireValidationIdenticalModelsRule), t),
      {
        key: 'items',
        label: t(textKeys.nsarmoireValidationEvidenceItems),
        value: itemNames
      },
      {
        key: 'model-key',
        label: t(textKeys.nsarmoireValidationEvidenceModelKey),
        value: group.key,
        code: true
      },
      {
        key: 'models',
        label: t(textKeys.nsarmoireValidationEvidenceModels),
        value: modelEvidence,
        code: true
      },
      createFieldsRow('Item.Model{Main} / Item.Model{Sub} / ItemUICategory / EquipSlotCategory', t)
    ]
  }
}

function createCabinetCase(source: ValidationSource, t: Translate): ArmoireValidationCaseView {
  if (!source.analysis || source.analysis.cabinetProgress.status === 'missingCatalog') {
    return {
      key: 'cabinet',
      title: t(textKeys.nsarmoireRecommendationCabinet),
      status: t(textKeys.nsarmoireValidationStatusWaitingCatalog),
      tone: 'neutral',
      description: t(textKeys.nsarmoireValidationCabinetPending),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationCabinetRule), t),
        createFieldsRow('Cabinet.csv / snapshot.items[].itemId / snapshot.items[].container', t)
      ]
    }
  }

  const itemId = source.analysis.cabinetProgress.transferableItemIds[0]

  if (!itemId) {
    return {
      key: 'cabinet',
      title: t(textKeys.nsarmoireRecommendationCabinet),
      status: t(textKeys.nsarmoireValidationStatusNotTriggered),
      tone: 'success',
      description: t(textKeys.nsarmoireValidationCabinetNone),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationCabinetRule), t),
        createResultRow('0', t),
        createFieldsRow('Cabinet.csv / snapshot.items[].itemId / snapshot.items[].container', t)
      ]
    }
  }

  const name = getArmoireItemName(source.catalog, itemId, t)
  const entries = getItemEntries(source.snapshot, itemId)

  return {
    key: 'cabinet',
    title: t(textKeys.nsarmoireRecommendationCabinet),
    status: t(textKeys.nsarmoireValidationStatusTriggered),
    tone: 'warning',
    description: formatArmoireText(t, textKeys.nsarmoireValidationCabinetHit, {
      item: name
    }),
    rows: [
      createRuleRow(t(textKeys.nsarmoireValidationCabinetRule), t),
      {
        key: 'item',
        label: t(textKeys.nsarmoireValidationEvidenceItem),
        value: `${name} / ${formatArmoireItemId(itemId, t)}`
      },
      {
        key: 'catalog',
        label: t(textKeys.nsarmoireValidationEvidenceCatalog),
        value: formatArmoireText(t, textKeys.nsarmoireValidationCabinetCatalogHit, { itemId })
      },
      {
        key: 'locations',
        label: t(textKeys.nsarmoireValidationEvidenceLocations),
        value: formatLocations(entries, t)
      },
      createFieldsRow('Cabinet.csv itemId / snapshot.items[].container !== armoire', t)
    ]
  }
}

function createDyeCase(source: ValidationSource, t: Translate): ArmoireValidationCaseView {
  const item = source.analysis?.dyeRisk.items[0]

  if (!item) {
    return {
      key: 'dyes',
      title: t(textKeys.nsarmoireRecommendationDyes),
      status: t(textKeys.nsarmoireValidationStatusNotTriggered),
      tone: 'success',
      description: t(textKeys.nsarmoireValidationDyesNone),
      rows: [
        createRuleRow(t(textKeys.nsarmoireValidationDyesRule), t),
        createFieldsRow('snapshot.items[].dyes', t),
        createResultRow('0', t)
      ]
    }
  }

  const name = getArmoireItemName(source.catalog, item.itemId, t)
  const dyeNames = formatArmoireDyeNames(source.catalog, item.dyeIds, t)
  const resetReasonLabel = formatArmoireDyeResetReasons(item.resetReasons, t)

  return {
    key: 'dyes',
    title: t(textKeys.nsarmoireRecommendationDyes),
    status: t(textKeys.nsarmoireValidationStatusTriggered),
    tone: item.riskLevel,
    description: formatArmoireText(t, textKeys.nsarmoireValidationDyesHit, {
      item: name
    }),
    rows: [
      createRuleRow(t(textKeys.nsarmoireValidationDyesRule), t),
      {
        key: 'item',
        label: t(textKeys.nsarmoireValidationEvidenceItem),
        value: `${name} / ${formatArmoireItemId(item.itemId, t)}`
      },
      {
        key: 'dyes',
        label: t(textKeys.nsarmoireValidationEvidenceDyes),
        value: `${dyeNames} / raw=[${item.dyeIds.join(', ')}]`,
        code: true
      },
      {
        key: 'dye-reset',
        label: t(textKeys.nsarmoireValidationEvidenceDyeReset),
        value: resetReasonLabel
      },
      createResultRow(
        formatArmoireText(t, textKeys.nsarmoireValidationDyesResult, {
          slots: item.dyedSlotCount
        }),
        t
      ),
      {
        key: 'locations',
        label: t(textKeys.nsarmoireValidationEvidenceLocations),
        value: getArmoireContainerLabel(item, t)
      },
      createFieldsRow('snapshot.items[].dyes / Cabinet.csv / MirageStoreSetItem.csv', t)
    ]
  }
}

export function useArmoireValidationViewModels(source: ValidationSource, t: Translate) {
  const validationCases = computed<ArmoireValidationCaseView[]>(() => {
    if (!source.snapshot || !source.analysis) {
      return []
    }

    return [
      createDuplicateItemCase(source, t),
      createIdenticalModelCase(source, t),
      createCabinetCase(source, t),
      createDyeCase(source, t)
    ]
  })

  return {
    validationCases
  }
}
