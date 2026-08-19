export const silenceViiokoLayoutPresets = ['full', 'thirds', 'two-one', 'one-two'] as const

export type SilenceViiokoLayoutPreset = (typeof silenceViiokoLayoutPresets)[number]
export type SilenceViiokoRowTrack = 'auto' | number

export interface SilenceViiokoImageLayout {
  fit?: 'contain' | 'cover'
  positionX?: number
  positionY?: number
  scale?: number
  flipX?: boolean
}

export interface SilenceViiokoCellLayout {
  id: string
  image?: SilenceViiokoImageLayout
}

export interface SilenceViiokoRowLayout {
  id: string
  preset: SilenceViiokoLayoutPreset
  track: SilenceViiokoRowTrack
  cells?: SilenceViiokoCellLayout[]
}

export interface SilenceViiokoPageLayout {
  id: string
  rows: SilenceViiokoRowLayout[]
}

const defaultPages: SilenceViiokoPageLayout[] = [
  {
    id: 'profile',
    rows: [
      {
        id: 'portrait',
        preset: 'two-one',
        track: 'auto',
        cells: [
          { id: 'hero', image: { fit: 'cover', positionX: 50, positionY: 15 } },
          { id: 'crop', image: { fit: 'cover', positionX: 50, positionY: 32, scale: 1.9 } }
        ]
      },
      { id: 'overview', preset: 'full', track: 'auto' },
      { id: 'facts', preset: 'thirds', track: 1 },
      {
        id: 'appearance',
        preset: 'thirds',
        track: 'auto',
        cells: [
          { id: 'standee-front', image: { fit: 'contain', positionX: 50, positionY: 100 } },
          {
            id: 'standee-back',
            image: { fit: 'contain', positionX: 50, positionY: 100, flipX: true }
          },
          { id: 'specimen-1', image: { fit: 'cover', positionX: 50, positionY: 13, scale: 1.95 } },
          { id: 'specimen-2', image: { fit: 'cover', positionX: 50, positionY: 42, scale: 1.55 } },
          { id: 'specimen-3', image: { fit: 'cover', positionX: 50, positionY: 72, scale: 1.72 } },
          {
            id: 'specimen-4',
            image: { fit: 'cover', positionX: 50, positionY: 50, scale: 1.46, flipX: true }
          }
        ]
      }
    ]
  },
  {
    id: 'followup',
    rows: [
      {
        id: 'portrait',
        preset: 'two-one',
        track: 'auto',
        cells: [
          { id: 'hero', image: { fit: 'cover', positionX: 50, positionY: 42, scale: 1.14 } },
          { id: 'crop', image: { fit: 'cover', positionX: 50, positionY: 60, scale: 2.05 } }
        ]
      },
      { id: 'overview', preset: 'full', track: 'auto' },
      { id: 'facts', preset: 'thirds', track: 1 },
      {
        id: 'details',
        preset: 'one-two',
        track: 'auto',
        cells: [
          { id: 'standee-front', image: { fit: 'contain', positionX: 50, positionY: 100 } },
          {
            id: 'standee-back',
            image: { fit: 'contain', positionX: 50, positionY: 100, flipX: true }
          },
          { id: 'specimen-1', image: { fit: 'cover', positionX: 50, positionY: 13, scale: 1.95 } },
          { id: 'specimen-2', image: { fit: 'cover', positionX: 50, positionY: 42, scale: 1.55 } },
          { id: 'specimen-3', image: { fit: 'cover', positionX: 50, positionY: 72, scale: 1.72 } },
          {
            id: 'specimen-4',
            image: { fit: 'cover', positionX: 50, positionY: 50, scale: 1.46, flipX: true }
          }
        ]
      }
    ]
  },
  {
    id: 'large-visual',
    rows: [
      {
        id: 'lead',
        preset: 'full',
        track: 0.58,
        cells: [{ id: 'hero', image: { fit: 'cover', positionX: 50, positionY: 22, scale: 1.08 } }]
      },
      { id: 'strip', preset: 'full', track: 0.42 }
    ]
  },
  {
    id: 'dossier-grid',
    rows: [
      {
        id: 'lead',
        preset: 'one-two',
        track: 0.58,
        cells: [{ id: 'hero', image: { fit: 'cover', positionX: 50, positionY: 52, scale: 1.65 } }]
      },
      {
        id: 'strip',
        preset: 'one-two',
        track: 0.42,
        cells: createSampleBoardCells()
      }
    ]
  },
  {
    id: 'material-wall',
    rows: [
      {
        id: 'lead',
        preset: 'two-one',
        track: 0.58,
        cells: [
          {
            id: 'hero',
            image: { fit: 'cover', positionX: 50, positionY: 38, scale: 1.2, flipX: true }
          }
        ]
      },
      {
        id: 'strip',
        preset: 'two-one',
        track: 0.42,
        cells: createSampleBoardCells()
      }
    ]
  },
  {
    id: 'thirds-board',
    rows: [
      {
        id: 'lead',
        preset: 'thirds',
        track: 0.58,
        cells: [{ id: 'hero', image: { fit: 'cover', positionX: 50, positionY: 52, scale: 1.65 } }]
      },
      {
        id: 'strip',
        preset: 'thirds',
        track: 0.42,
        cells: createSampleBoardCells()
      }
    ]
  }
]

const characterPageLayouts: Partial<Record<string, SilenceViiokoPageLayout[]>> = {
  salvance: defaultPages
}

export function getSilenceViiokoPageLayouts(characterId: string): SilenceViiokoPageLayout[] {
  return clonePages(characterPageLayouts[characterId] ?? defaultPages)
}

export function mergeSilenceViiokoPageLayouts(
  basePages: SilenceViiokoPageLayout[],
  overridePages: SilenceViiokoPageLayout[]
): SilenceViiokoPageLayout[] {
  const overrideById = new Map(overridePages.map((page) => [page.id, page] as const))
  const mergedPages = basePages.map((page) => {
    const override = overrideById.get(page.id)

    if (!override) {
      return page
    }

    overrideById.delete(page.id)
    return mergePageLayout(page, override)
  })

  return clonePages([...mergedPages, ...overrideById.values()])
}

export function getSilenceViiokoLayoutClass(preset: SilenceViiokoLayoutPreset): string {
  return `silence-viioko__layout--${preset}`
}

export function parseSilenceViiokoPageLayouts(
  value: unknown
): SilenceViiokoPageLayout[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isPageLayout)) {
    return undefined
  }

  const pageIds = new Set(value.map((page) => page.id))
  return pageIds.size === value.length ? clonePages(value) : undefined
}

function isPageLayout(value: unknown): value is SilenceViiokoPageLayout {
  if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.rows)) {
    return false
  }

  if (value.id.trim() === '' || value.rows.length === 0 || !value.rows.every(isRowLayout)) {
    return false
  }

  return new Set(value.rows.map((row) => row.id)).size === value.rows.length
}

function isRowLayout(value: unknown): value is SilenceViiokoRowLayout {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !silenceViiokoLayoutPresets.includes(value.preset as SilenceViiokoLayoutPreset) ||
    !isRowTrack(value.track)
  ) {
    return false
  }

  if (value.cells === undefined) {
    return true
  }

  if (!Array.isArray(value.cells) || !value.cells.every(isCellLayout)) {
    return false
  }

  return new Set(value.cells.map((cell) => cell.id)).size === value.cells.length
}

function isCellLayout(value: unknown): value is SilenceViiokoCellLayout {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim() !== '' &&
    (value.image === undefined || isImageLayout(value.image))
  )
}

function isImageLayout(value: unknown): value is SilenceViiokoImageLayout {
  if (!isRecord(value)) {
    return false
  }

  const validFit = value.fit === undefined || value.fit === 'contain' || value.fit === 'cover'
  const validFlip = value.flipX === undefined || typeof value.flipX === 'boolean'
  const validPositionX = isOptionalNumberInRange(value.positionX, 0, 100)
  const validPositionY = isOptionalNumberInRange(value.positionY, 0, 100)
  const validScale = value.scale === undefined || isFiniteNumberInRange(value.scale, 0.01, 20)

  return validFit && validFlip && validPositionX && validPositionY && validScale
}

function isRowTrack(value: unknown): value is SilenceViiokoRowTrack {
  return value === 'auto' || (typeof value === 'number' && Number.isFinite(value) && value > 0)
}

function isOptionalNumberInRange(value: unknown, minimum: number, maximum: number): boolean {
  return value === undefined || isFiniteNumberInRange(value, minimum, maximum)
}

function isFiniteNumberInRange(value: unknown, minimum: number, maximum: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clonePages(pages: SilenceViiokoPageLayout[]): SilenceViiokoPageLayout[] {
  return pages.map((page) => ({
    ...page,
    rows: page.rows.map((row) => ({
      ...row,
      cells: row.cells?.map((cell) => ({
        ...cell,
        image: cell.image ? { ...cell.image } : undefined
      }))
    }))
  }))
}

function mergePageLayout(
  basePage: SilenceViiokoPageLayout,
  overridePage: SilenceViiokoPageLayout
): SilenceViiokoPageLayout {
  const overrideRowsById = new Map(overridePage.rows.map((row) => [row.id, row] as const))
  const rows = basePage.rows.map((row) => {
    const override = overrideRowsById.get(row.id)

    if (!override) {
      return row
    }

    overrideRowsById.delete(row.id)
    return {
      ...row,
      ...override,
      cells: mergeCells(row.cells ?? [], override.cells ?? [])
    }
  })

  return {
    ...basePage,
    ...overridePage,
    rows: [...rows, ...overrideRowsById.values()]
  }
}

function mergeCells(
  baseCells: SilenceViiokoCellLayout[],
  overrideCells: SilenceViiokoCellLayout[]
): SilenceViiokoCellLayout[] {
  const overrideById = new Map(overrideCells.map((cell) => [cell.id, cell] as const))
  const cells = baseCells.map((cell) => {
    const override = overrideById.get(cell.id)

    if (!override) {
      return cell
    }

    overrideById.delete(cell.id)
    return {
      ...cell,
      ...override,
      image: cell.image || override.image ? { ...cell.image, ...override.image } : undefined
    }
  })

  return [...cells, ...overrideById.values()]
}

function createSampleBoardCells(): SilenceViiokoCellLayout[] {
  return [
    { id: 'board-full', image: { fit: 'cover', positionX: 50, positionY: 24 } },
    { id: 'board-face', image: { fit: 'cover', positionX: 50, positionY: 18, scale: 1.9 } },
    { id: 'board-detail', image: { fit: 'cover', positionX: 50, positionY: 66, scale: 1.55 } },
    {
      id: 'board-reverse',
      image: { fit: 'cover', positionX: 50, positionY: 42, scale: 1.28, flipX: true }
    }
  ]
}
