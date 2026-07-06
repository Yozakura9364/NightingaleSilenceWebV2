import { hasArmoireCatalogItems } from '@/lib/armoire/filterSnapshot'
import type {
  ArmoireCatalog,
  ArmoireContainerKind,
  ArmoireOwnedItem,
  ArmoireOwnedIndex,
  ArmoireTradableItemAnalysis
} from '@/lib/armoire/types'

const TRADABLE_CHECK_CONTAINERS = new Set<ArmoireContainerKind>([
  'inventory',
  'saddlebag',
  'retainer',
  'armoury'
])

function isUnboundTradableAppearance(
  item: ArmoireOwnedItem,
  catalog: ArmoireCatalog
): boolean {
  if (!TRADABLE_CHECK_CONTAINERS.has(item.container)) {
    return false
  }

  if (item.spiritbond !== 0) {
    return false
  }

  return catalog.items[item.itemId]?.isTradable === true
}

export function analyzeTradableItems(
  index: ArmoireOwnedIndex,
  catalog: ArmoireCatalog
): ArmoireTradableItemAnalysis {
  if (!hasArmoireCatalogItems(catalog)) {
    return {
      status: 'missingCatalog',
      unboundTradableEntryCount: 0,
      items: []
    }
  }

  const items = index.entries
    .filter((item) => isUnboundTradableAppearance(item, catalog))
    .sort((left, right) => left.itemId - right.itemId)

  return {
    status: 'ready',
    unboundTradableEntryCount: items.length,
    items
  }
}
