import { NSPLATE_NAMEPLATE_CATEGORIES } from '@/lib/plate/draft'
import type { NSPlateAssetSummary } from '@/lib/plate/types'

export type NSPlateInfoTextAdaptiveColorSource =
  | 'none'
  | 'nameplateBase'
  | 'nameplateHeaderThenBase'

type NSPlateInfoTextFontColorByte = 1 | 2

interface NSPlateInfoTextAdaptiveColorInput {
  color?: string
  adaptiveColorSource?: string
  adaptiveColorFont1?: string
  adaptiveColorFont2?: string
}

const NAMEPLATE_BASE_CATEGORY = NSPLATE_NAMEPLATE_CATEGORIES[1]
const NAMEPLATE_HEADER_CATEGORY = NSPLATE_NAMEPLATE_CATEGORIES[4]
const AUTO_LIGHT_COLOR = '#ffffff'
const AUTO_DARK_COLOR = '#000000'

// Derived from old NSPortable vendor/ffxiv-datamining-chs CharaCardBase.csv.
const baseFontColorPairs: ReadonlyArray<readonly [number, NSPlateInfoTextFontColorByte]> = [
  [193002, 1],
  [193003, 2],
  [193004, 1],
  [193005, 1],
  [193006, 1],
  [193007, 1],
  [193008, 2],
  [193009, 1],
  [193010, 2],
  [193011, 2],
  [193901, 1],
  [193902, 1],
  [193701, 1],
  [193702, 1],
  [193703, 2],
  [193704, 1],
  [193966, 1],
  [193012, 1],
  [193013, 1],
  [193014, 1],
  [193015, 1],
  [193962, 1],
  [193963, 1],
  [193964, 1],
  [193965, 1],
  [193967, 1],
  [193705, 1],
  [193710, 1],
  [193711, 1],
  [193712, 2],
  [193713, 2],
  [193714, 1],
  [193960, 1],
  [193959, 1],
  [193961, 1],
  [193715, 1],
  [193716, 1],
  [193717, 1],
  [193718, 1],
  [193719, 1],
  [193956, 1],
  [193957, 1],
  [193958, 1],
  [193723, 2],
  [193724, 2],
  [193725, 2],
  [193726, 2],
  [193727, 2],
  [193728, 2],
  [193729, 2],
  [193730, 2],
  [193731, 2],
  [193732, 2],
  [193733, 2],
  [193734, 2],
  [193722, 1],
  [193720, 2],
  [193721, 1],
  [193735, 1],
  [193736, 1],
  [193737, 1],
  [193738, 1],
  [193954, 1],
  [193952, 1],
  [193951, 1],
  [193955, 1],
  [193953, 1],
  [193662, 1],
  [193663, 1],
  [193664, 1],
  [193665, 2],
  [193968, 1],
  [193654, 2],
  [193672, 1],
  [193655, 2],
  [193673, 1],
  [193656, 1],
  [193668, 2],
  [193657, 1],
  [193669, 2],
  [193658, 2],
  [193670, 1],
  [193659, 1],
  [193671, 1],
  [193660, 1],
  [193666, 2],
  [193661, 1],
  [193667, 1],
  [193739, 2],
  [193969, 1],
  [193706, 1],
  [193707, 2],
  [193708, 1],
  [193709, 1],
  [193740, 1],
  [193741, 1],
  [193742, 1],
  [193743, 2],
  [193970, 1],
  [193744, 1],
  [193745, 1],
  [193746, 1],
  [193747, 2],
  [193748, 2],
  [193016, 2],
  [193017, 2],
  [193018, 2],
  [193019, 2],
  [193020, 2],
  [193021, 2],
  [193022, 2],
  [193023, 2],
  [193749, 1],
  [193750, 2],
  [193751, 1],
  [193752, 1],
  [193753, 1],
  [193754, 2],
  [193755, 1],
  [193756, 1],
  [193757, 1],
  [193758, 1],
  [193759, 1],
  [193760, 1],
  [193764, 2],
  [193765, 2],
  [193766, 2],
  [193767, 2],
  [193768, 2],
  [193769, 2],
  [193770, 2],
  [193771, 2],
  [193772, 2],
  [193773, 2],
  [193774, 2],
  [193775, 2],
  [193776, 2],
  [193777, 2]
]

// Derived from old NSPortable vendor/ffxiv-datamining-chs CharaCardHeader.csv.
const headerFontColorPairs: ReadonlyArray<readonly [number, NSPlateInfoTextFontColorByte]> = [
  [196002, 1],
  [196003, 1],
  [196004, 1],
  [196005, 2],
  [196006, 1],
  [196007, 1],
  [196008, 2],
  [196009, 1],
  [196010, 1],
  [196011, 1],
  [196101, 1],
  [196102, 1],
  [196103, 1],
  [196104, 1],
  [196216, 1],
  [196012, 1],
  [196013, 1],
  [196014, 1],
  [196015, 1],
  [196016, 1],
  [196212, 1],
  [196213, 1],
  [196214, 1],
  [196215, 1],
  [196217, 1],
  [196105, 1],
  [196210, 1],
  [196209, 2],
  [196211, 1],
  [196106, 1],
  [196107, 1],
  [196108, 1],
  [196109, 1],
  [196206, 1],
  [196207, 1],
  [196208, 1],
  [196113, 1],
  [196112, 1],
  [196110, 2],
  [196111, 1],
  [196114, 1],
  [196115, 1],
  [196116, 1],
  [196117, 1],
  [196204, 1],
  [196202, 1],
  [196201, 1],
  [196205, 2],
  [196203, 1],
  [196062, 1],
  [196063, 1],
  [196064, 1],
  [196065, 2],
  [196218, 1],
  [196054, 1],
  [196072, 1],
  [196055, 2],
  [196073, 1],
  [196056, 1],
  [196068, 2],
  [196057, 1],
  [196069, 1],
  [196058, 1],
  [196070, 1],
  [196059, 1],
  [196071, 1],
  [196060, 1],
  [196066, 2],
  [196061, 1],
  [196067, 1],
  [196118, 1],
  [196219, 1],
  [196119, 1],
  [196120, 1],
  [196121, 1],
  [196122, 1],
  [196220, 1],
  [196123, 1],
  [196124, 1],
  [196125, 1],
  [196017, 2],
  [196018, 2],
  [196019, 2],
  [196020, 2],
  [196021, 2],
  [196022, 2],
  [196023, 2],
  [196024, 2],
  [196126, 1],
  [196127, 2],
  [196128, 1],
  [196135, 1],
  [196129, 1],
  [196130, 2],
  [196136, 1],
  [196131, 1],
  [196132, 1],
  [196133, 1],
  [196134, 1],
  [196137, 1],
  [196140, 1],
  [196141, 1]
]

const baseFontColorByImageId = new Map<number, NSPlateInfoTextFontColorByte>(baseFontColorPairs)
const headerFontColorByImageId = new Map<number, NSPlateInfoTextFontColorByte>(
  headerFontColorPairs
)

export function resolveNSPlateInfoTextAdaptiveColor(
  layer: NSPlateInfoTextAdaptiveColorInput,
  selectedByCategory?: Map<string, NSPlateAssetSummary>
) {
  const base = normalizeHexColor(layer.color, AUTO_LIGHT_COLOR)
  const source = normalizeAdaptiveColorSource(layer.adaptiveColorSource)

  if (source === 'none') {
    return base
  }

  const adaptiveColorFont1 = normalizeOptionalHexColor(layer.adaptiveColorFont1)
  const adaptiveColorFont2 = normalizeOptionalHexColor(layer.adaptiveColorFont2)
  const hasCustomAdaptiveColorMap = !!(adaptiveColorFont1 || adaptiveColorFont2)

  if (!hasCustomAdaptiveColorMap && !isAutoAdaptiveInfoTextColor(base)) {
    return base
  }

  const fontColor = resolveAdaptiveInfoTextColorByteBySource(source, selectedByCategory)

  if (hasCustomAdaptiveColorMap) {
    if (fontColor === 1 && adaptiveColorFont1) {
      return adaptiveColorFont1
    }

    if (fontColor === 2 && adaptiveColorFont2) {
      return adaptiveColorFont2
    }

    return base
  }

  if (fontColor === 1) {
    return AUTO_LIGHT_COLOR
  }

  if (fontColor === 2) {
    return AUTO_DARK_COLOR
  }

  return base
}

function resolveAdaptiveInfoTextColorByteBySource(
  source: NSPlateInfoTextAdaptiveColorSource,
  selectedByCategory: Map<string, NSPlateAssetSummary> | undefined
): NSPlateInfoTextFontColorByte | null {
  if (source === 'nameplateHeaderThenBase') {
    return (
      resolveSelectedAssetFontColorByte(
        selectedByCategory?.get(NAMEPLATE_HEADER_CATEGORY),
        headerFontColorByImageId
      ) ??
      resolveSelectedAssetFontColorByte(
        selectedByCategory?.get(NAMEPLATE_BASE_CATEGORY),
        baseFontColorByImageId
      )
    )
  }

  return resolveSelectedAssetFontColorByte(
    selectedByCategory?.get(NAMEPLATE_BASE_CATEGORY),
    baseFontColorByImageId
  )
}

function resolveSelectedAssetFontColorByte(
  asset: NSPlateAssetSummary | undefined,
  fontColorByImageId: Map<number, NSPlateInfoTextFontColorByte>
) {
  const imageId = resolveAssetImageId(asset)

  if (!imageId) {
    return null
  }

  return fontColorByImageId.get(imageId) ?? null
}

function resolveAssetImageId(asset: NSPlateAssetSummary | undefined) {
  if (!asset) {
    return null
  }

  return (
    parseImageIdFromLayerToken(asset.raw.id) ??
    parseImageIdFromLayerToken(asset.raw.file) ??
    parseImageIdFromLayerToken(asset.raw.path) ??
    parseImageIdFromLayerToken(asset.file) ??
    parseImageIdFromLayerToken(asset.path) ??
    parseImageIdFromLayerToken(asset.id)
  )
}

function parseImageIdFromLayerToken(raw: unknown) {
  const source = String(raw ?? '').trim()

  if (!source) {
    return null
  }

  const direct = source.match(/^(\d+)$/)

  if (direct) {
    const value = Number(direct[1])
    return Number.isInteger(value) && value > 0 ? value : null
  }

  const tail = source.match(/(\d+)(?:_hr\d+)?(?:\.[A-Za-z0-9]+)?$/)

  if (!tail) {
    return null
  }

  const value = Number(tail[1])
  return Number.isInteger(value) && value > 0 ? value : null
}

function normalizeAdaptiveColorSource(raw: unknown): NSPlateInfoTextAdaptiveColorSource {
  if (raw === 'none') {
    return 'none'
  }

  if (raw === 'nameplateHeaderThenBase') {
    return 'nameplateHeaderThenBase'
  }

  return 'nameplateBase'
}

function isAutoAdaptiveInfoTextColor(hexColor: string) {
  const color = normalizeHexColor(hexColor, AUTO_LIGHT_COLOR)
  return color === AUTO_DARK_COLOR || color === AUTO_LIGHT_COLOR
}

function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : fallback
}

function normalizeOptionalHexColor(value: unknown) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : ''
}
