<template>
  <div class="content-studio-page">
    <div class="studio-layout">
      <DraftList :drafts="drafts" :selectedId="currentDraftId" @create="createDraft" @select="selectDraft" />
      <div class="studio-main">
        <ContentMetadataPanel v-if="currentDraftId" v-model="metadata" :publicId="publicId" />
        <ContentEditor v-if="currentDraftId" v-model="editorContent" @change="onEditorChange" ref="editorRef" />
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
        <div class="studio-status">
          <span v-if="autosave?.saving.value">{{ t(statusKeys.saving) }}</span>
          <span v-else-if="autosave?.error.value" class="error">{{ autosave.error.value }}</span>
          <span v-else-if="autosave?.lastSaved.value">{{ t(statusKeys.saved) }} {{ autosave.lastSaved.value.toLocaleTimeString() }}</span>
        </div>
      </div>
    </div>
    <button @click="showMediaDialog = true" class="btn-media">📷 {{ t(statusKeys.insertImage) }}</button>
    <MediaInsertDialog v-if="showMediaDialog" @close="showMediaDialog = false" @insertImage="insertSingleImage" @addToGallery="addToGallery" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { useLocale } from '@/stores/locale'
import { contentStudioKeys } from '@/locales/keys/content'
import DraftList from './components/DraftList.vue'
import ContentEditor from './components/ContentEditor.vue'
import ContentMetadataPanel from './components/ContentMetadataPanel.vue'
import TableToolbar from './components/TableToolbar.vue'
import GalleryEditor from './components/GalleryEditor.vue'
import MediaInsertDialog from './components/MediaInsertDialog.vue'
import { ContentStudioApi } from './services/contentStudioApi'
import { useDraftAutosave } from './composables/useDraftAutosave'
import type { AutosaveState } from './composables/useDraftAutosave'
import { extractEditorDoc, buildSaveDraftBody } from './helpers/contentDocumentHelpers'
import type { BareDoc } from './helpers/contentDocumentHelpers'
import { clearPreviews, hasPreviewUrl } from '@/lib/content/editor/imagePreviewCache'
import { fetchAndPreview } from './services/contentMediaPreview'
import {
  addImage, removeImage, moveImage, setLayout, findFirstGalleryGid,
  deriveGalleryState, deriveGalleryOnLoad,
  type GalleryState, type GalleryImage, type PendingGalleryRecord,
} from '@/lib/content/editor/galleryDocumentController'

const { t } = useLocale()
const statusKeys = { saving: contentStudioKeys.saving, saved: contentStudioKeys.saved, insertImage: contentStudioKeys.insertImage }

const token = import.meta.env.VITE_CONTENT_STUDIO_TOKEN || ''
const api = new ContentStudioApi(token)

const drafts = ref<Array<{ id: string; title?: string; status?: string; updatedAt?: string }>>([])
const currentDraftId = ref<string | null>(null)
const editorContent = ref<BareDoc | null>(null)
const metadata = ref<{ title: string; summary?: string; tags?: string[]; coverMediaId?: string }>({ title: '' })
const publicId = ref<number | null>(null)
const editorRef = ref<any>(null)
const showMediaDialog = ref(false)
const galleryState = ref<GalleryState | null>(null)
// draftId → session gid (in-memory; re-derived on load when doc has gallery)
const sessionGids = new Map<string, string>()

// Pending single-image gallery state, persisted across REFRESH via localStorage.
// Schema: { gid: string; mediaId: string } | null
function loadPending(draftId: string): PendingGalleryRecord | null {
  try {
    const raw = localStorage.getItem('contentStudio.pending.' + draftId)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function savePending(draftId: string, v: PendingGalleryRecord | null) {
  try {
    if (v) localStorage.setItem('contentStudio.pending.' + draftId, JSON.stringify(v))
    else localStorage.removeItem('contentStudio.pending.' + draftId)
  } catch {}
}
let autosave: AutosaveState | undefined

function makeGid(): string { return 'g' + Math.random().toString(36).slice(2, 10) }

function rememberGid(draftId: string, gid: string) { sessionGids.set(draftId, gid) }

// ---- Preview ----
async function loadPreviews(doc: BareDoc) {
  const ids: string[] = []
  function walk(n: any) { if (n.type === 'image' && n.attrs?.mediaId) ids.push(n.attrs.mediaId); if (n.content) n.content.forEach(walk) }
  walk(doc)
  for (const id of ids) {
    if (hasPreviewUrl(id)) continue
    try { await fetchAndPreview(id) } catch {}
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

function commitDoc(doc: BareDoc, state?: GalleryState | null) {
  applyDoc(doc, state)
  onEditorChange()
}

// ---- Gallery actions ----
function addToGallery(mediaId: string, attrs: Record<string, unknown>) {
  const img: GalleryImage = {
    mediaId, alt: (attrs.alt as string) || '',
    caption: (attrs.caption as string) || null,
    align: (attrs.align as string) || 'center',
    displayWidth: (attrs.displayWidth as number) || 75,
  }
  const result = addImage(currentDoc(), galleryState.value, img)
  rememberGid(currentDraftId.value || '', result.state.gid)
  savePending(currentDraftId.value || '', result.state.images.length === 1
    ? { gid: result.state.gid, mediaId: result.state.images[0].mediaId }
    : null)
  commitDoc(result.doc, result.state)
  showMediaDialog.value = false
}

function removeGalleryImage(index: number) {
  if (!galleryState.value) return
  const result = removeImage(currentDoc(), galleryState.value, index)
  if (result.state) {
    if (result.state.images.length === 1) savePending(currentDraftId.value || '', { gid: result.state.gid, mediaId: result.state.images[0].mediaId })
    else savePending(currentDraftId.value || '', null)
    rememberGid(currentDraftId.value || '', result.state.gid)
  } else {
    savePending(currentDraftId.value || '', null)
    sessionGids.delete(currentDraftId.value || '')
  }
  commitDoc(result.doc, result.state)
}

function moveGalleryItem(delta: number) { return (index: number) => {
  if (!galleryState.value) return
  const to = index + delta
  if (to < 0 || to >= galleryState.value.images.length) return
  const result = moveImage(currentDoc(), galleryState.value, index, to)
  commitDoc(result.doc, result.state)
}}

function setGalleryLayout(layout: string) {
  if (!galleryState.value) return
  const result = setLayout(currentDoc(), galleryState.value, layout)
  commitDoc(result.doc, result.state)
}

// ---- Draft management ----
async function loadDrafts() { const r = await api.listDrafts(); if (r.ok) drafts.value = r.data.data }

function metaFromResult(r: any) {
  return { title: r.title, summary: r.metadata?.summary || undefined, tags: r.metadata?.tags || [], coverMediaId: r.metadata?.coverMediaId || undefined }
}

async function createDraft() {
  const doc = { schemaVersion: 'content.document.v1', doc: { type: 'doc', content: [] } }
  const r = await api.createDraft({ metadata: { title: '新建文章', tags: [] }, document: doc })
  if (r.ok) {
    drafts.value.unshift(r.data); currentDraftId.value = r.data.id
    editorContent.value = extractEditorDoc(r.data.document as any)
    metadata.value = metaFromResult(r.data); publicId.value = r.data.publicId
    galleryState.value = null; setupAutosave()
    if (autosave) autosave.revision.value = r.data.revision
  }
}

async function selectDraft(id: string) {
  const r = await api.getDraft(id)
  if (r.ok) {
    currentDraftId.value = id
    let bare = extractEditorDoc(r.data.document as any)
    metadata.value = metaFromResult(r.data); publicId.value = r.data.publicId
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

function setupAutosave() {
  autosave = useDraftAutosave(currentDraftId,
    async (document, expectedRevision, meta) => {
      const body = buildSaveDraftBody(document as BareDoc, (meta as any) || { title: metadata.value.title, tags: [] }, expectedRevision)
      const r = await api.saveDraft(currentDraftId.value!, body as any); if (!r.ok) throw r.error
      return { revision: r.data.revision }
    },
    async (id) => { const r = await api.getDraft(id); if (!r.ok) throw r.error; return { revision: r.data.revision, document: r.data.document } })
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

function onEditorChange() { autosave?.markDirty(editorContent.value) }

function insertSingleImage(mediaId: string, attrs: Record<string, unknown>) {
  const doc = currentDoc()
  doc.content.push({ type: 'image', attrs: { mediaId, ...attrs } })
  commitDoc(doc)
  showMediaDialog.value = false
}

loadDrafts()
watch(metadata, (val) => { if (autosave && editorContent.value) autosave.markDirty(editorContent.value, val) }, { deep: true })
</script>

<style scoped>
.content-studio-page { height: 100vh; display: flex; flex-direction: column; }
.studio-layout { display: flex; flex: 1; overflow: hidden; }
.studio-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.studio-status { padding: 4px 12px; font-size: 12px; color: var(--text-secondary,#666); border-top: 1px solid var(--border-color,#e0e0e0); }
.error { color: red; }
.btn-media { margin: 8px; padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
</style>
