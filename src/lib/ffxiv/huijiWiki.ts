const HUIJI_WIKI_ITEM_URL_PREFIX = 'https://ff14.huijiwiki.com/wiki/物品:'
const LODESTONE_ITEM_URL_PREFIX = 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/'
const LODESTONE_SEARCH_URL_PREFIX = 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/'
const GARLAND_ITEM_URL_PREFIX = 'https://www.garlandtools.cn/db/#item/'
const KR_GUIDE_SEARCH_URL_PREFIX = 'https://guide.ff14.co.kr/lodestone/search'

let _lodestoneMap: Record<string, string> | null = null
let _lodestoneMapPromise: Promise<Record<string, string>> | null = null

async function _loadLodestoneMap(): Promise<Record<string, string>> {
  const res = await fetch('/data/ffxiv/lodestone-id-map.json')
  _lodestoneMap = (await res.json()) as Record<string, string>
  return _lodestoneMap
}

function _lodestoneSearchUrl(name: string): string {
  return `${LODESTONE_SEARCH_URL_PREFIX}?q=${encodeURIComponent(name.trim())}`
}

export function getHuijiWikiItemUrl(itemName: string): string {
  return `${HUIJI_WIKI_ITEM_URL_PREFIX}${encodeURIComponent(itemName.trim())}`
}

export async function getLodestoneItemUrl(itemId: number, itemName: string): Promise<string> {
  if (!_lodestoneMapPromise) {
    _lodestoneMapPromise = _loadLodestoneMap()
  }
  const map = await _lodestoneMapPromise
  const hash = map[String(itemId)]
  if (hash) {
    return `${LODESTONE_ITEM_URL_PREFIX}${hash}/`
  }
  return _lodestoneSearchUrl(itemName)
}

export function getGarlandItemUrl(itemId: number): string {
  return `${GARLAND_ITEM_URL_PREFIX}${itemId}`
}

export function getKrGuideSearchUrl(itemName: string): string {
  return `${KR_GUIDE_SEARCH_URL_PREFIX}?keyword=${encodeURIComponent(itemName.trim())}`
}
