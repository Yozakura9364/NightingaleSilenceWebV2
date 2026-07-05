import type {
  NSPlateFilesResponse,
  NSPlateLayeredExportPayload,
  NSPlatePresetsResponse
} from '@/lib/plate/types'

export type NSPlateDataSourceKind = 'legacy-api' | 'static-manifest'

export interface NSPlateCatalogDataSource {
  readonly kind: NSPlateDataSourceKind
  fetchPresets: () => Promise<NSPlatePresetsResponse>
  fetchFiles: () => Promise<NSPlateFilesResponse>
}

export interface NSPlateLayeredExportDataSource {
  exportLayeredZip?: (payload: NSPlateLayeredExportPayload) => Promise<Blob>
}

export type NSPlateDataSource = NSPlateCatalogDataSource & NSPlateLayeredExportDataSource
