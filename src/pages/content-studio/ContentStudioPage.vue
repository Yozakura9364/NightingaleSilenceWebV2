<template>
  <div class="content-studio-page">
    <div class="studio-layout">
      <DraftList
        :drafts="drafts"
        :selectedId="currentDraftId"
        @create="createDraft"
        @select="selectDraft"
        @remove="deleteDraftById"
      />
      <div class="studio-main">
        <ContentMetadataPanel v-if="currentDraftId" v-model="metadata" :publicId="publicId" />
        <PublicationPanel
          v-if="currentDraftId"
          :status="status"
          :publicId="publicId"
          :publishedAt="publishedAt"
          :busy="pubBusy"
          :error="pubError"
          @preview="showPreview = true"
          @publish="onPublish"
          @withdraw="onWithdraw"
          @archive="onArchive"
          @restore="onRestore"
        />
        <ContentEditor
          v-if="currentDraftId"
          v-model="editorContent"
          @change="onEditorChange"
          @request-media-insert="showMediaDialog = true"
          ref="editorRef"
        />
        <TableToolbar :editor="editorRef?.editor ?? null" />
        <GalleryEditor
          v-if="galleryState"
          :items="galleryState.images"
          :layout="galleryState.layout"
          @removeImage="removeGalleryImage"
          @moveUp="moveGalleryItem(-1)"
          @moveDown="moveGalleryItem(1)"
          @update:layout="setGalleryLayout"
          @addImages="showMediaDialog = true"
        />
        <div class="studio-footer">
          <div class="studio-status">
            <span v-if="autosave?.saving.value">{{ t(statusKeys.saving) }}</span>
            <span v-else-if="autosave?.error.value" class="error">{{ autosave.error.value }}</span>
            <span v-else-if="autosave?.lastSaved.value"
              >{{ t(statusKeys.saved) }} {{ autosave.lastSaved.value.toLocaleTimeString() }}</span
            >
          </div>
          <div class="studio-actions">
            <AppButton size="compact" @click="showMediaDialog = true">
              {{ t(statusKeys.insertImage) }}
            </AppButton>
            <AppButton
              v-if="currentDraftId"
              type="button"
              variant="primary"
              size="compact"
              @click="showExportDialog = true"
            >
              {{ t(statusKeys.exportTitle) }}
            </AppButton>
          </div>
        </div>
        <ExportDialog
          v-if="showExportDialog && currentDraftId"
          :document="exportDocument"
          @close="showExportDialog = false"
        />
      </div>
    </div>
    <MediaInsertDialog
      v-if="showMediaDialog"
      @close="showMediaDialog = false"
      @insertImage="insertSingleImage"
      @addToGallery="addToGallery"
    />
    <ContentPreview
      v-if="showPreview && currentDraftId"
      :view-model="previewViewModel"
      :title="metadata.title"
      :summary="metadata.summary ?? null"
      :tags="metadata.tags ?? []"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import AppButton from '@/components/AppButton.vue'
import { useDialog } from '@/composables/useDialog'
import type { ContentDocument } from '@/lib/content/model/types'
import {
  buildContentViewModel,
  type SafeDocumentViewModel
} from '@/lib/content/render/contentViewModel'
import DraftList from './components/DraftList.vue'
import ContentEditor from './components/ContentEditor.vue'
import ContentMetadataPanel from './components/ContentMetadataPanel.vue'
import PublicationPanel from './components/PublicationPanel.vue'
import ContentPreview from './components/ContentPreview.vue'
import TableToolbar from './components/TableToolbar.vue'
import GalleryEditor from './components/GalleryEditor.vue'
import MediaInsertDialog from './components/MediaInsertDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import { ContentStudioApi } from '@/services/contentStudio/contentStudioApi'
import { contentStudioToken } from '@/config/env'
import type { ContentStatus } from '@/services/contentStudio/contentStudioTypes'
import { useDraftAutosave } from './composables/useDraftAutosave'
import type { AutosaveState } from './composables/useDraftAutosave'
import { extractEditorDoc, buildSaveDraftBody } from './helpers/contentDocumentHelpers'
import { toCanonicalDocument } from '@/lib/content/editor/toCanonicalDocument'
import type { BareDoc } from './helpers/contentDocumentHelpers'
import { clearPreviews, hasPreviewUrl, getPreviewUrl } from '@/lib/content/editor/imagePreviewCache'
import { fetchAndPreview } from '@/services/contentStudio/contentMediaPreview'
import {
  addImage,
  removeImage,
  moveImage,
  setLayout,
  findFirstGalleryGid,
  deriveGalleryState,
  deriveGalleryOnLoad,
  type GalleryState,
  type GalleryImage,
  type PendingGalleryRecord
} from '@/lib/content/editor/galleryDocumentController'

const { t } = useLocale()
const dialog = useDialog()
const statusKeys = {
  saving: contentStudioKeys.saving,
  saved: contentStudioKeys.saved,
  insertImage: contentStudioKeys.insertImage,
  exportTitle: contentStudioKeys.exportTitle
}

const token = contentStudioToken
const api = new ContentStudioApi(token)

const drafts = ref<Array<{ id: string; title?: string; status?: string; updatedAt?: string }>>([])
const currentDraftId = ref<string | null>(null)
const editorContent = ref<BareDoc | null>(null)
const metadata = ref<{ title: string; summary?: string; tags?: string[]; coverMediaId?: string }>({
  title: ''
})
const publicId = ref<number | null>(null)
const status = ref<ContentStatus>('DRAFT')
const publishedAt = ref<string | null>(null)
const editorRef = ref<any>(null)
const showMediaDialog = ref(false)
const showExportDialog = ref(false)
const showPreview = ref(false)
const pubBusy = ref(false)
const pubError = ref<string | null>(null)
const galleryState = ref<GalleryState | null>(null)
// draftId → session gid (in-memory; re-derived on load when doc has gallery)
const sessionGids = new Map<string, string>()

// Pending single-image gallery state, persisted across REFRESH via localStorage.
// Schema: { gid: string; mediaId: string } | null
function loadPending(draftId: string): PendingGalleryRecord | null {
  try {
    const raw = localStorage.getItem('contentStudio.pending.' + draftId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function savePending(draftId: string, v: PendingGalleryRecord | null) {
  try {
    if (v) localStorage.setItem('contentStudio.pending.' + draftId, JSON.stringify(v))
    else localStorage.removeItem('contentStudio.pending.' + draftId)
  } catch {}
}
let autosave: AutosaveState | undefined

function makeGid(): string {
  return 'g' + Math.random().toString(36).slice(2, 10)
}

function rememberGid(draftId: string, gid: string) {
  sessionGids.set(draftId, gid)
}

// ---- Preview ----
async function loadPreviews(doc: BareDoc) {
  const ids: string[] = []
  function walk(n: any) {
    if (n.type === 'image' && n.attrs?.mediaId) ids.push(n.attrs.mediaId)
    if (n.content) n.content.forEach(walk)
  }
  walk(doc)
  for (const id of ids) {
    if (hasPreviewUrl(id)) continue
    try {
      await fetchAndPreview(id)
    } catch {}
  }
}

onBeforeUnmount(() => clearPreviews())

// ---- Editor sync ----
function applyDoc(doc: BareDoc, nextState?: GalleryState | null) {
  editorContent.value = doc
  // Explicit next state wins (commitDoc result); otherwise re-derive:
  // try gallery node by gid first, fall back to the standalone image
  // carrying our gid (1-image pending candidate) so inserting an unrelated
  // image does NOT wipe the candidate state.
  if (nextState !== undefined) {
    galleryState.value = nextState
  } else {
    const gid = galleryState.value?.gid || findFirstGalleryGid(doc)
    galleryState.value = deriveGalleryState(doc, gid)
  }
  if (galleryState.value) rememberGid(currentDraftId.value || '', galleryState.value.gid)
  nextTick(() => loadPreviews(doc))
}

function currentDoc(): BareDoc {
  return editorContent.value || { type: 'doc', content: [] }
}

// NGA export needs a ContentDocument envelope ({ schemaVersion, doc }) with
// runtime-only attrs (gid etc.) stripped via the canonical conversion.
const exportDocument = computed<ContentDocument>(() => ({
  schemaVersion: 'content.document.v1',
  doc: toCanonicalDocument(currentDoc() as any) as unknown as ContentDocument['doc']
}))

// 发布预览：与公开阅读页同一 view model 管线，媒体走编辑器预览缓存。
const previewViewModel = computed<SafeDocumentViewModel | null>(() => {
  if (!showPreview.value) return null
  try {
    return buildContentViewModel(
      {
        schemaVersion: 'content.document.v1',
        doc: toCanonicalDocument(currentDoc() as any) as unknown as ContentDocument['doc']
      },
      { mediaResolver: (mediaId: string) => getPreviewUrl(mediaId) ?? null }
    )
  } catch {
    return null
  }
})

function commitDoc(doc: BareDoc, state?: GalleryState | null) {
  applyDoc(doc, state)
  onEditorChange()
}

// ---- Gallery actions ----
function addToGallery(mediaId: string, attrs: Record<string, unknown>) {
  const img: GalleryImage = {
    mediaId,
    alt: (attrs.alt as string) || '',
    caption: (attrs.caption as string) || null,
    align: (attrs.align as string) || 'center',
    displayWidth: (attrs.displayWidth as number) || 75
  }
  const result = addImage(currentDoc(), galleryState.value, img)
  rememberGid(currentDraftId.value || '', result.state.gid)
  savePending(
    currentDraftId.value || '',
    result.state.images.length === 1
      ? { gid: result.state.gid, mediaId: result.state.images[0].mediaId }
      : null
  )
  commitDoc(result.doc, result.state)
  showMediaDialog.value = false
}

function removeGalleryImage(index: number) {
  if (!galleryState.value) return
  const result = removeImage(currentDoc(), galleryState.value, index)
  if (result.state) {
    if (result.state.images.length === 1)
      savePending(currentDraftId.value || '', {
        gid: result.state.gid,
        mediaId: result.state.images[0].mediaId
      })
    else savePending(currentDraftId.value || '', null)
    rememberGid(currentDraftId.value || '', result.state.gid)
  } else {
    savePending(currentDraftId.value || '', null)
    sessionGids.delete(currentDraftId.value || '')
  }
  commitDoc(result.doc, result.state)
}

function moveGalleryItem(delta: number) {
  return (index: number) => {
    if (!galleryState.value) return
    const to = index + delta
    if (to < 0 || to >= galleryState.value.images.length) return
    const result = moveImage(currentDoc(), galleryState.value, index, to)
    commitDoc(result.doc, result.state)
  }
}

function setGalleryLayout(layout: string) {
  if (!galleryState.value) return
  const result = setLayout(currentDoc(), galleryState.value, layout)
  commitDoc(result.doc, result.state)
}

// ---- Draft management ----
async function loadDrafts() {
  const r = await api.listDrafts()
  if (r.ok) drafts.value = r.data.data
}

async function refreshDrafts() {
  await loadDrafts()
}

function metaFromResult(r: any) {
  return {
    title: r.title,
    summary: r.metadata?.summary || undefined,
    tags: r.metadata?.tags || [],
    coverMediaId: r.metadata?.coverMediaId || undefined
  }
}

function entryStateFromResult(r: any) {
  status.value = (r.status ?? 'DRAFT') as ContentStatus
  publishedAt.value = r.publishedAt ?? null
}

async function createDraft() {
  const doc = { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [] } }
  const r = await api.createDraft({ metadata: { title: '新建文章', tags: [] }, document: doc })
  if (r.ok) {
    drafts.value.unshift(r.data)
    currentDraftId.value = r.data.id
    editorContent.value = extractEditorDoc(r.data.document as any)
    metadata.value = metaFromResult(r.data)
    publicId.value = r.data.publicId
    entryStateFromResult(r.data)
    pubError.value = null
    galleryState.value = null
    setupAutosave()
    if (autosave) autosave.revision.value = r.data.revision
  }
}

async function selectDraft(id: string) {
  const r = await api.getDraft(id)
  if (r.ok) {
    currentDraftId.value = id
    let bare = extractEditorDoc(r.data.document as any)
    metadata.value = metaFromResult(r.data)
    publicId.value = r.data.publicId
    entryStateFromResult(r.data)
    pubError.value = null
    // Re-derive gallery state on load: gallery node → adopt first gallery;
    // single standalone image matching persisted pending → adopt as candidate.
    const sessGid = sessionGids.get(id) || makeGid()
    const derived = deriveGalleryOnLoad(bare, sessGid, loadPending(id))
    bare = derived.doc
    galleryState.value = derived.state
    if (derived.state) rememberGid(id, derived.state.gid)
    editorContent.value = bare
    setupAutosave()
    loadPreviews(bare)
  }
}

async function deleteDraftById(id: string) {
  const confirmed = await dialog.confirm(
    t(contentStudioKeys.deleteDraftConfirm),
    t(contentStudioKeys.deleteDraft)
  )
  if (!confirmed) return
  const r = await api.deleteDraft(id)
  if (r.ok) {
    drafts.value = drafts.value.filter((d) => d.id !== id)
    if (currentDraftId.value === id) {
      currentDraftId.value = null
      editorContent.value = null
      galleryState.value = null
      metadata.value = { title: '' }
      publicId.value = null
      status.value = 'DRAFT'
      publishedAt.value = null
      sessionGids.delete(id)
    }
  } else if (r.error.error.code === 'STATE_CONFLICT') {
    await dialog.alert(t(contentStudioKeys.pubErrStateConflict), t(contentStudioKeys.deleteDraft))
  }
}

function setupAutosave() {
  autosave = useDraftAutosave(
    currentDraftId,
    async (document, expectedRevision, meta) => {
      const body = buildSaveDraftBody(
        document as BareDoc,
        (meta as any) || { title: metadata.value.title, tags: [] },
        expectedRevision
      )
      const r = await api.saveDraft(currentDraftId.value!, body as any)
      if (!r.ok) throw r.error
      return { revision: r.data.revision }
    },
    async (id) => {
      const r = await api.getDraft(id)
      if (!r.ok) throw r.error
      return { revision: r.data.revision, document: r.data.document }
    }
  )
  autosave.recover().then(async (result: any) => {
    let bare = extractEditorDoc(result)
    if (bare.content?.length > 0) {
      const id = currentDraftId.value || ''
      const sessGid = sessionGids.get(id) || makeGid()
      const derived = deriveGalleryOnLoad(bare, sessGid, loadPending(id))
      bare = derived.doc
      galleryState.value = derived.state
      if (derived.state) rememberGid(id, derived.state.gid)
      editorContent.value = bare
      await loadPreviews(bare)
    }
  })
}

function onEditorChange() {
  autosave?.markDirty(editorContent.value)
}

function insertSingleImage(mediaId: string, attrs: Record<string, unknown>) {
  const doc = currentDoc()
  doc.content.push({ type: 'image', attrs: { mediaId, ...attrs } })
  commitDoc(doc)
  showMediaDialog.value = false
}

// ---- Publication actions (T046) ----
const publishErrorKeyMap: Record<string, string> = {
  EMPTY_DOCUMENT: contentStudioKeys.pubErrEmptyDocument,
  METADATA_INVALID: contentStudioKeys.pubErrMetadataInvalid,
  DOCUMENT_INVALID: contentStudioKeys.pubErrDocumentInvalid,
  MEDIA_NOT_FOUND: contentStudioKeys.pubErrMediaNotFound,
  MEDIA_NOT_VERIFIED: contentStudioKeys.pubErrMediaNotVerified,
  MEDIA_URL_UNSTABLE: contentStudioKeys.pubErrMediaUrlUnstable,
  MEDIA_NOT_PUBLIC: contentStudioKeys.pubErrMediaNotPublic,
  CONFLICT: contentStudioKeys.pubErrConflict,
  STATE_CONFLICT: contentStudioKeys.pubErrStateConflict
}

function describePublishError(code: string): string {
  return t(publishErrorKeyMap[code] ?? contentStudioKeys.publicationOperationFailed)
}

async function onPublish() {
  if (!currentDraftId.value || pubBusy.value) return
  const confirmed = await dialog.confirm(
    t(contentStudioKeys.publicationPublishConfirm),
    t(contentStudioKeys.publicationPublish)
  )
  if (!confirmed) return
  pubBusy.value = true
  pubError.value = null
  try {
    if (autosave && !(await autosave.flushNow())) {
      pubError.value = t(contentStudioKeys.publicationSaveFirst)
      return
    }
    const revision = autosave?.revision.value ?? 0
    const r = await api.publishDraft(currentDraftId.value, revision)
    if (r.ok) {
      status.value = 'PUBLISHED'
      publishedAt.value = r.data.publishedAt
      if (autosave) autosave.revision.value = r.data.revision
      refreshDrafts()
    } else {
      pubError.value = describePublishError(r.error.error.code)
    }
  } finally {
    pubBusy.value = false
  }
}

async function onWithdraw() {
  if (!currentDraftId.value || pubBusy.value) return
  const confirmed = await dialog.confirm(
    t(contentStudioKeys.publicationWithdrawConfirm),
    t(contentStudioKeys.publicationWithdraw)
  )
  if (!confirmed) return
  pubBusy.value = true
  pubError.value = null
  try {
    const r = await api.withdrawPublication(currentDraftId.value)
    if (r.ok) {
      status.value = 'DRAFT'
      publishedAt.value = null
      // 撤回会推进服务端 revision（204 无响应体），重新拉取以同步
      const g = await api.getDraft(currentDraftId.value)
      if (g.ok) {
        entryStateFromResult(g.data)
        if (autosave) autosave.revision.value = g.data.revision
      }
      refreshDrafts()
    } else {
      pubError.value = describePublishError(r.error.error.code)
    }
  } finally {
    pubBusy.value = false
  }
}

async function onArchive() {
  if (!currentDraftId.value || pubBusy.value) return
  const confirmed = await dialog.confirm(
    t(contentStudioKeys.publicationArchiveConfirm),
    t(contentStudioKeys.publicationArchive)
  )
  if (!confirmed) return
  pubBusy.value = true
  pubError.value = null
  try {
    if (autosave && !(await autosave.flushNow())) {
      pubError.value = t(contentStudioKeys.publicationSaveFirst)
      return
    }
    const r = await api.archiveDraft(currentDraftId.value, autosave?.revision.value ?? 0)
    if (r.ok) {
      status.value = 'ARCHIVED'
      publishedAt.value = null
      if (autosave) autosave.revision.value = r.data.revision
      refreshDrafts()
    } else {
      pubError.value = describePublishError(r.error.error.code)
    }
  } finally {
    pubBusy.value = false
  }
}

async function onRestore() {
  if (!currentDraftId.value || pubBusy.value) return
  const confirmed = await dialog.confirm(
    t(contentStudioKeys.publicationRestoreConfirm),
    t(contentStudioKeys.publicationRestore)
  )
  if (!confirmed) return
  pubBusy.value = true
  pubError.value = null
  try {
    const r = await api.restoreDraft(currentDraftId.value, autosave?.revision.value ?? 0)
    if (r.ok) {
      status.value = 'DRAFT'
      if (autosave) autosave.revision.value = r.data.revision
      refreshDrafts()
    } else {
      pubError.value = describePublishError(r.error.error.code)
    }
  } finally {
    pubBusy.value = false
  }
}

// ---- 离开保护：有未保存修改时提示 ----
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (autosave?.dirty.value || autosave?.saving.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

loadDrafts()
watch(
  metadata,
  (val) => {
    if (autosave && editorContent.value) autosave.markDirty(editorContent.value, val)
  },
  { deep: true }
)
</script>

<style scoped>
.content-studio-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--ns-body-background);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
}
.studio-layout {
  display: flex;
  flex: 1;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  min-height: 0;
}
.studio-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
}
.studio-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}
.studio-status {
  font-size: 12px;
  color: var(--ns-color-text-muted);
}
.studio-status .error {
  color: var(--ns-color-danger);
}
.studio-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
