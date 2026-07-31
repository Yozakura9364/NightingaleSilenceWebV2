// useDraftAutosave — T025 [US1]
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface SaveApi { (document: unknown, expectedRevision: number, metadata?: unknown): Promise<{ revision: number }> }
interface GetApi { (id: string): Promise<{ revision: number; document: unknown }> }

export interface AutosaveState {
  saving: Ref<boolean>
  lastSaved: Ref<Date | null>
  error: Ref<string | null>
  revision: Ref<number>
  markDirty: (document: unknown, metadata?: unknown) => void
  recover: () => Promise<unknown | null>
}

export function useDraftAutosave(contentId: Ref<string | null>, apiSave: SaveApi, apiGet: GetApi, debounceMs = 2000): AutosaveState {
  const saving = ref(false)
  const lastSaved = ref<Date | null>(null)
  const error = ref<string | null>(null)
  const revision = ref(0)
  let pendingDoc: unknown = null
  let pendingMeta: unknown = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, ms)
  }

  const flush = async () => {
    const doc = pendingDoc
    const meta = pendingMeta
    if (!contentId.value || !doc) return
    pendingDoc = null
    pendingMeta = null
    saving.value = true
    error.value = null
    try {
      const r = await apiSave(doc, revision.value, meta || undefined)
      revision.value = r.revision
      lastSaved.value = new Date()
    } catch (e: any) {
      const m = e?.error?.message || e?.message || ''
      const c = e?.error?.code || ''
      error.value = (c === 'CONFLICT' || m.includes('conflict')) ? '冲突：请刷新恢复' : `保存失败：${m}`
      pendingDoc = doc
      pendingMeta = meta
      schedule(5000)
    } finally {
      saving.value = false
    }
  }

  const markDirty = (document: unknown, metadata?: unknown) => {
    pendingDoc = document
    if (metadata !== undefined) pendingMeta = metadata
    schedule(debounceMs)
  }

  const recover = async (): Promise<unknown | null> => {
    if (!contentId.value) return null
    try {
      const r = await apiGet(contentId.value)
      revision.value = r.revision
      return r.document
    } catch { error.value = '恢复失败'; return null }
  }

  onUnmounted(() => { if (timer) clearTimeout(timer) })
  return { saving, lastSaved, error, revision, markDirty, recover }
}
