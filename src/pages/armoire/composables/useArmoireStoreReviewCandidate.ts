export function useArmoireStoreReviewCandidate(
  getUniqueItemIds: (itemIds: number[]) => number[],
) {
  const CANDIDATE_LIMIT = 12

  function normalizeCandidateText(value: string | undefined): string {
    return String(value ?? '')
      .toLocaleLowerCase()
      .replace(/[·・\-—_（）()【】[\]「」『』“”"']/g, '')
      .replace(/服装套装|装备套装|浴衣套装|装束|套装|服装|新装|夏装|浴衣/g, '')
      .replace(/\s+/g, '')
      .trim()
  }

  function getCandidateScore(itemName: string, searchKeys: string[]): number {
    const normalizedItemName = normalizeCandidateText(itemName)
    if (!normalizedItemName) return 0

    let score = 0
    for (const key of searchKeys) {
      if (normalizedItemName === key) {
        score = Math.max(score, 100)
        continue
      }
      if (normalizedItemName.includes(key)) {
        score = Math.max(score, 80 - Math.min(normalizedItemName.length - key.length, 20))
        continue
      }
    }
    return score
  }

  function buildCandidateSearchKeys(outfit: any): string[] {
    return [
      outfit.localizedNames?.zhCN ?? outfit.localizedNames?.en ?? outfit.name,
      outfit.name,
      outfit.globalProductName,
      ...(outfit.itemNames ?? []),
      ...(outfit.globalItemNames ?? [])
    ]
      .map((value: string) => normalizeCandidateText(value))
      .filter((value: string, index: number, values: string[]) => value.length >= 2 && values.indexOf(value) === index)
  }

  function getCandidatePieceItemIds(
    pieceItemIds: number[] | undefined,
    catalog: any
  ): number[] {
    if (!Array.isArray(pieceItemIds)) return []
    return getUniqueItemIds(pieceItemIds.filter((itemId) => catalog.items[itemId]))
  }

  function getCandidateViews(
    outfit: any,
    catalog: any,
    _visibleOutfits: any[],
    existingItemIds: Set<number>,
  ): any[] | null {
    const searchKeys = buildCandidateSearchKeys(outfit)
    if (searchKeys.length === 0) return null

    const candidates = Object.values(catalog.items)
      .filter((item: any) => item.name?.trim())
      .map((item: any) => ({
        item,
        name: item.name.trim(),
        score: getCandidateScore(item.name.trim(), searchKeys)
      }))
      .filter((entry: any) => entry.score > 0)
      .sort(
        (left: any, right: any) =>
          right.score - left.score ||
          left.name.length - right.name.length ||
          left.item.itemId - right.item.itemId
      )
      .slice(0, CANDIDATE_LIMIT)
      .map((entry: any) => {
        const pieceItemIds = getCandidatePieceItemIds(entry.item.pieceItemIds, catalog)
        return {
          itemId: entry.item.itemId,
          name: entry.name,
          iconUrl: '',
          isAdded: existingItemIds.has(entry.item.itemId),
          pieceItemIds,
          arePiecesAdded:
            pieceItemIds.length > 0 && pieceItemIds.every((id: number) => existingItemIds.has(id))
        }
      })

    return candidates.length > 0 ? candidates : null
  }

  function resolveCatalogItemId(input: string, catalog: { items: Record<number, { name?: string; itemId: number }> }): number | undefined {
    const query = input.trim()
    if (!query) return undefined

    const numericId = Number(query)
    if (Number.isInteger(numericId) && catalog.items[numericId]) return numericId

    const exactMatch = Object.values(catalog.items).find(
      (item: any) => item.name?.trim() === query
    )
    if (exactMatch) return exactMatch.itemId

    const partialMatches = Object.values(catalog.items)
      .filter((item: any) => item.name?.includes(query))
      .sort(
        (left: any, right: any) =>
          (left.name?.length ?? 0) - (right.name?.length ?? 0) || left.itemId - right.itemId
      )
    return partialMatches[0]?.itemId
  }

  return {
    normalizeCandidateText,
    getCandidateScore,
    buildCandidateSearchKeys,
    getCandidatePieceItemIds,
    getCandidateViews,
    resolveCatalogItemId,
  }
}
