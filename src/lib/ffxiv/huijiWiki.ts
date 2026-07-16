const HUIJI_WIKI_ITEM_URL_PREFIX = 'https://ff14.huijiwiki.com/wiki/物品:'

export function getHuijiWikiItemUrl(itemName: string): string {
  return `${HUIJI_WIKI_ITEM_URL_PREFIX}${encodeURIComponent(itemName.trim())}`
}
