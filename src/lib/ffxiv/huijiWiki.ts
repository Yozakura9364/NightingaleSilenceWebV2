const HUIJI_WIKI_ITEM_URL_PREFIX = 'https://ff14.huijiwiki.com/wiki/物品:'
const LODESTONE_ITEM_URL_PREFIX = 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/'
const GARLAND_ITEM_URL_PREFIX = 'https://www.garlandtools.cn/db/#item/'

export function getHuijiWikiItemUrl(itemName: string): string {
  return `${HUIJI_WIKI_ITEM_URL_PREFIX}${encodeURIComponent(itemName.trim())}`
}

export function getLodestoneItemUrl(itemId: number): string {
  return `${LODESTONE_ITEM_URL_PREFIX}${itemId}/`
}

export function getGarlandItemUrl(itemId: number): string {
  return `${GARLAND_ITEM_URL_PREFIX}${itemId}`
}
