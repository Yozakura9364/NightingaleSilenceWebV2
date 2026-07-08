import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { TextEncoder } from 'node:util'

const DEFAULT_BASE_URL = 'http://127.0.0.1:8765/api'
const DEFAULT_TIMEOUT_MS = 15000
const REQUIRED_STAIN_COUNT = 100
const BODY_SLOT = 'Body'
const TEMPLATE_SOURCE_FILES = [
  'src/lib/glamour/draft.ts',
  'src/lib/glamour/templates/definitions.ts',
  'src/lib/glamour/templates/renderProfiles.ts',
  'src/lib/glamour/templates/imageSlots.ts',
  'src/lib/glamour/templates/settings.ts',
  'src/lib/glamour/templates/rows.ts',
  'src/lib/glamour/templates/renderData.ts',
  'src/lib/glamour/templates/renderer.ts',
  'src/lib/glamour/templates/assets.ts',
  'src/pages/glamour/composables/useGlamourDraft.ts',
  'src/pages/glamour/composables/useGlamourTemplateWorkspace.ts',
  'src/lib/glamour/equipment.ts',
  'src/lib/glamour/recent.ts',
  'src/lib/glamour/links.ts',
  'src/pages/glamour/components/NSGlamourImportPanel.vue',
  'src/pages/glamour/components/NSGlamourWorkspace.vue',
  'src/pages/glamour/components/NSGlamourTemplateWorkspace.vue'
]
const LEGACY_TEMPLATE_DEFINITIONS_FILE = resolve('..', 'NSGlamour', 'static', 'template-definitions.js')
const LEGACY_TEMPLATE_RENDERERS_FILE = resolve('..', 'NSGlamour', 'static', 'template-renderers.js')
const TEMPLATE_IDS = ['eorzea', 'horizontal', 'story', 'risingstones', 'ec', 'silence-fashion']
const TEMPLATE_RENDER_MODES = ['eorzea', 'horizontal', 'double-pic', 'risingstones', 'ec', 'silence-fashion']
const TEMPLATE_SLOT_ORDER = [
  'MainHand',
  'OffHand',
  'HeadGear',
  'Body',
  'Hands',
  'Legs',
  'Feet',
  'Ears',
  'Neck',
  'Wrists',
  'LeftRing',
  'RightRing',
  'Glasses',
  'FashionAccessory'
]

const args = parseArgs(process.argv.slice(2))
const encoder = new TextEncoder()
const results = []
const warnings = []
const errors = []
const searchSamples = []
let equipinfoSamplePayload = null

if (args.help) {
  printHelp()
} else {
  await main()
}

async function main() {
  await check('GET /health', checkHealth)
  await check('GET /stains?locale=zh', () => checkStains('zh'))
  await check('GET /stains?locale=en', () => checkStains('en'))
  await check('GET /ui-localization', checkUiLocalization)
  await check('GET /search-items Chinese body query', () =>
    checkBodySearch(['\u957f\u888d', '\u5916\u5957'], 'zh')
  )
  await check('GET /search-items English fallback query', () =>
    checkBodySearch(['robe', 'coat'], 'zh')
  )
  await check('POST /equipinfo/parse-text valid sample', checkEquipinfoParseText)
  await check('POST /equipinfo/parse-text empty text error', checkEquipinfoEmptyText)
  await check('local /template data layer', checkLocalTemplateDataLayer)
  await check('POST /parse-chara optional fixture', checkOptionalParseChara)

  for (const result of results) {
    console.log(`[${result.status}] ${result.name}${result.detail ? ` - ${result.detail}` : ''}`)
  }

  for (const warning of warnings) {
    console.warn(`[warn] ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[error] ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`NSGlamour contract check passed. baseUrl=${normalizeBaseUrl(args.baseUrl)}`)
}

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ name, status: 'ok', detail })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`${name}: ${message}`)
    results.push({ name, status: 'fail', detail: message })
  }
}

async function checkHealth() {
  const response = await requestJson('/health')
  expectStatus(response, [200])
  assertPlainObject(response.data, 'health response must be an object')
  assert(response.data.ok === true, 'health.ok must be true')
  return `status=${response.status} bytes=${response.bytes}`
}

async function checkStains(locale) {
  const response = await requestJson('/stains', { query: { locale } })
  expectStatus(response, [200])
  assertPlainObject(response.data, 'stains response must be an object')
  assert(response.data.locale === locale, `stains.locale must be ${locale}`)
  assert(Array.isArray(response.data.results), 'stains.results must be an array')
  assert(
    response.data.results.length >= REQUIRED_STAIN_COUNT,
    `stains.results must contain at least ${REQUIRED_STAIN_COUNT} entries`
  )

  const noDye = response.data.results.find((entry) => Number(entry?.id) === 0)
  assertPlainObject(noDye, 'stains.results must include id=0')
  assert(typeof noDye.name === 'string' && noDye.name.length > 0, 'stain id=0 must include name')
  assertPlainObject(noDye.names, 'stain id=0 must include localized names')
  assert(typeof noDye.hex === 'string' && /^#[0-9a-f]{6}$/i.test(noDye.hex), 'stain id=0 hex must be #rrggbb')

  const cache = response.headers.get('cache-control') ?? ''
  assert(/max-age=3600/.test(cache), 'stains response must keep the 1 hour cache contract')
  return `results=${response.data.results.length} bytes=${response.bytes} cache=${cache}`
}

async function checkUiLocalization() {
  const response = await requestJson('/ui-localization')
  expectStatus(response, [200])
  assertPlainObject(response.data, 'ui-localization response must be an object')
  assert(Number.isFinite(Number(response.data.version)), 'ui-localization.version must be numeric')
  assertPlainObject(response.data.strings, 'ui-localization.strings must be an object')
  assert(Array.isArray(response.data.scope), 'ui-localization.scope must be an array')

  const cache = response.headers.get('cache-control') ?? ''
  assert(/no-store/.test(cache), 'ui-localization response must stay no-store')
  return `version=${response.data.version} strings=${Object.keys(response.data.strings).length} bytes=${response.bytes}`
}

async function checkBodySearch(queries, locale) {
  const attempts = []

  for (const query of queries) {
    const response = await requestJson('/search-items', {
      query: {
        slot: BODY_SLOT,
        q: query,
        locale,
        limit: 5
      }
    })
    expectStatus(response, [200])
    assertPlainObject(response.data, 'search response must be an object')
    assert(response.data.slot === BODY_SLOT, `search.slot must be ${BODY_SLOT}`)
    assert(Array.isArray(response.data.results), 'search.results must be an array')
    attempts.push(`${query}:${response.data.results.length}`)

    if (response.data.results.length === 0) {
      continue
    }

    const first = response.data.results[0]
    validateSearchResult(first)
    searchSamples.push(first)
    return `query=${query} results=${response.data.results.length} first=${first.name ?? first.key}`
  }

  throw new Error(`no search results for ${attempts.join(', ')}`)
}

async function checkEquipinfoParseText() {
  const names = [...new Set(searchSamples.map((sample) => sample?.name).filter(Boolean))]
  assert(names.length > 0, 'a successful search result is required before parse-text can be checked')

  const failures = []

  for (const name of names) {
    const response = await requestJson('/equipinfo/parse-text', {
      method: 'POST',
      json: {
        text: `\u8eab\u4f53\uff1a${name}`,
        source_locale: 'zh'
      }
    })

    if (response.status !== 200) {
      failures.push(`${name}: status ${response.status}`)
      continue
    }

    try {
      validateEquipinfoPayload(response.data)
      equipinfoSamplePayload = response.data
      const first = response.data.resolved_equipment[0]
      return `entries=${response.data.resolved_equipment.length} slot=${first.slot} item=${name}`
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  throw new Error(`no valid parse-text sample succeeded (${failures.join('; ')})`)
}

async function checkEquipinfoEmptyText() {
  const response = await requestJson('/equipinfo/parse-text', {
    method: 'POST',
    json: { text: '', source_locale: 'zh' }
  })
  expectStatus(response, [400])
  assertPlainObject(response.data, 'empty text error response must be an object')
  assert(typeof response.data.error === 'string' && response.data.error.length > 0, 'empty text response must include error')
  return `status=${response.status} error=${response.data.error}`
}

async function checkOptionalParseChara() {
  if (!args.charaFile) {
    warnings.push('POST /parse-chara skipped; set NSGLAMOUR_CONTRACT_CHARA_FILE or --chara-file when a real .chara fixture is available.')
    return 'skipped'
  }

  const filePath = resolve(args.charaFile)
  const bytes = await readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'application/json' }), basename(filePath))

  const response = await requestJson('/parse-chara', {
    method: 'POST',
    body: form
  })
  expectStatus(response, [200])
  assertPlainObject(response.data, 'parse-chara response must be an object')
  assert(Array.isArray(response.data.resolved_equipment), 'parse-chara resolved_equipment must be an array')
  assert(response.data.resolved_equipment.length > 0, 'parse-chara must resolve at least one equipment entry')
  return `entries=${response.data.resolved_equipment.length} fixture=${filePath}`
}

function validateSearchResult(result) {
  assertPlainObject(result, 'search result must be an object')
  assert(result.key !== undefined && result.key !== null, 'search result must include key')
  assert(typeof result.name === 'string' && result.name.length > 0, 'search result must include name')
  assertPlainObject(result.names, 'search result must include names')
  assertPlainObject(result.model_main, 'search result must include model_main')
  assert(Array.isArray(result.dye_entries), 'search result must include dye_entries array')
}

function validateEquipinfoPayload(data) {
  assertPlainObject(data, 'parse-text response must be an object')
  assert(data.source_locale === 'zh', 'parse-text source_locale must be zh')
  assert(Array.isArray(data.resolved_equipment), 'parse-text resolved_equipment must be an array')
  assert(data.resolved_equipment.length > 0, 'parse-text must resolve at least one equipment entry')

  const first = data.resolved_equipment[0]
  assertPlainObject(first, 'parse-text first equipment entry must be an object')
  assert(first.slot === BODY_SLOT, `parse-text first equipment slot must be ${BODY_SLOT}`)
  assert(Array.isArray(first.candidates), 'parse-text equipment entry must include candidates')
  assert(first.candidates.length > 0, 'parse-text equipment entry must include at least one candidate')
  validateSearchResult(first.candidates[0])
}

async function checkLocalTemplateDataLayer() {
  assertPlainObject(equipinfoSamplePayload, 'template data layer check requires a parse-text payload sample')

  const [
    draft,
    definitions,
    renderProfiles,
    imageSlots,
    settings,
    rows,
    renderData,
    renderer,
    assets,
    draftComposable,
    templateComposable,
    equipment,
    recent,
    links,
    importPanel,
    glamourWorkspace,
    templateWorkspace,
    legacyDefinitions,
    legacyRenderers
  ] = await Promise.all(
    [
      ...TEMPLATE_SOURCE_FILES.map((filePath) => resolve(filePath)),
      LEGACY_TEMPLATE_DEFINITIONS_FILE,
      LEGACY_TEMPLATE_RENDERERS_FILE
    ].map(
      (filePath) => readFile(filePath, 'utf8')
    )
  )

  const legacyOrder = extractQuotedArray(legacyDefinitions, 'TEMPLATE_SELECT_ORDER')
  const v2Order = extractQuotedArray(definitions, 'GLAMOUR_TEMPLATE_SELECT_ORDER')
  assertSameArray(legacyOrder, TEMPLATE_IDS, 'legacy /template select order must match the documented migration order')
  assertSameArray(v2Order, legacyOrder, 'V2 template select order must match legacy /template')

  validateTemplateDefinitions(definitions, legacyDefinitions, legacyOrder)
  validateTemplateRenderProfiles(renderProfiles, legacyRenderers)
  validateTemplateImageSlots(imageSlots, legacyDefinitions)

  assert(
    settings.includes('nsglamour.templateWorkspaceSettings'),
    'template settings must preserve the legacy workspace settings key'
  )
  assert(
    settings.includes('legacyFlatSettings') &&
      settings.includes('rawTemplateSettings') &&
      settings.includes('...legacyFlatSettings'),
    'template settings must preserve legacy flat workspace settings migration'
  )
  assert(
    settings.includes('shouldResetLegacyTemplateSubtitles') &&
      settings.includes('resetLegacySubtitleSettings') &&
      settings.includes('template.controls.ecSubtitle === true'),
    'template settings must preserve legacy version<3 subtitle reset for EC-style templates'
  )
  assert(
    settings.includes('legacySubtitleParts') &&
      settings.includes('legacySubtitleHasParts') &&
      settings.includes('hasStoredSubtitleSymbol') &&
      settings.includes('Object.prototype.hasOwnProperty.call'),
    'template settings must preserve legacy ecSubtitleText split into name/world fields'
  )
  assert(
    settings.includes('bottomText') &&
      settings.includes('padding: clampNumber') &&
      settings.includes('nameSize: clampNumber') &&
      settings.includes('showIcons'),
    'template settings must preserve legacy canvas-only settings for later renderer migration'
  )
  assert(
    rows.includes('createGlamourTemplateRows'),
    'template row adapter must expose createGlamourTemplateRows'
  )
  assert(
    renderData.includes('createGlamourTemplateRenderData') &&
      renderData.includes('getGlamourTemplateRenderProfile') &&
      renderData.includes('requiredAssets') &&
      renderData.includes('canvas') &&
      renderData.includes('sourceWidth') &&
      renderData.includes('sourceHeight') &&
      renderData.includes('imageSlots') &&
      renderData.includes('imageSlotAliases') &&
      renderData.includes('profile.forceIcons') &&
      renderData.includes('localizedRows') &&
      renderData.includes('getGlamourTemplateSubtitleText') &&
      renderData.includes('storySwatchColors') &&
      templateComposable.includes('createGlamourTemplateRenderData') &&
      templateComposable.includes('templateRenderData'),
    'template render data layer must preserve renderer-ready rows, localized rows, text, and canvas settings'
  )
  assert(
      renderer.includes('renderGlamourTemplateCanvas') &&
      renderer.includes('renderGlamourTemplateCanvasFallback') &&
      renderer.includes("options.renderData.template.renderMode === 'eorzea'") &&
      renderer.includes('renderEorzeaTemplateCanvas') &&
      renderer.includes('EORZEA_TEMPLATE') &&
      renderer.includes('drawEorzeaGuides') &&
      renderer.includes('drawEorzeaTitle') &&
      renderer.includes('drawEorzeaEquipment') &&
      renderer.includes('drawEorzeaImageSlots') &&
      renderer.includes("assets?.['figma-background']?.image") &&
      renderer.includes("options.renderData.template.renderMode === 'horizontal'") &&
      renderer.includes('renderHorizontalTemplateCanvas') &&
      renderer.includes('HORIZONTAL_TEMPLATE') &&
      renderer.includes('drawHorizontalImageSlots') &&
      renderer.includes('drawHorizontalTitleLine') &&
      renderer.includes('drawHorizontalEquipmentText') &&
      renderer.includes("assets?.['horizontal-background']?.image") &&
      renderer.includes("options.renderData.template.renderMode === 'double-pic'") &&
      renderer.includes('renderDoublePicTemplateCanvas') &&
      renderer.includes('DOUBLE_PIC_TEMPLATE') &&
      renderer.includes('drawDoublePicEquipmentText') &&
      renderer.includes('drawDoublePicCopyright') &&
      renderer.includes('createDoublePicSpreadMaskCanvas') &&
      renderer.includes('drawDoublePicMaskOuterGlow') &&
      renderer.includes("assets?.['double-pic-left-mask']?.image") &&
      renderer.includes('drawGlamourTemplateMaskedImageCover') &&
      renderer.includes('createGlamourTemplateLuminanceMaskCanvas') &&
      renderer.includes('alphaFromLightness') &&
      renderer.includes("options.renderData.template.renderMode === 'risingstones'") &&
      renderer.includes('renderRisingstonesTemplateCanvas') &&
      renderer.includes('RISINGSTONES_TEMPLATE') &&
      renderer.includes('drawRisingstonesEquipment') &&
      renderer.includes('rowHeight: 247') &&
      renderer.includes('getRisingstonesNameWidth') &&
      renderer.includes('RISINGSTONES_TEMPLATE.copyright.lines') &&
      renderer.includes("options.renderData.template.renderMode === 'ec'") &&
      renderer.includes('renderEcTemplateCanvas') &&
      renderer.includes('EC_TEMPLATE_LAYOUTS') &&
      renderer.includes('drawEcEquipment') &&
      renderer.includes('EC_ITEM_RARITY_COLORS') &&
      renderer.includes('drawEcCenteredFittedText') &&
      renderer.includes('trackingSize = size * (tracking / 1000)') &&
      renderer.includes('getEcItemNameColor') &&
      renderer.includes("options.renderData.template.renderMode === 'silence-fashion'") &&
      renderer.includes('renderSilenceFashionTemplateCanvas') &&
      renderer.includes('SILENCE_FASHION_TEMPLATE') &&
      renderer.includes('drawSilenceFashionBackground') &&
      renderer.includes('drawSilenceFashionImages') &&
      renderer.includes('drawSilenceFashionHeader') &&
      renderer.includes('drawSilenceFashionZhEquipment') &&
      renderer.includes('drawSilenceFashionEnJaEquipment') &&
      renderer.includes('renderData.localizedRows') &&
      renderer.includes("assets?.['silence-fashion-background']?.image") &&
      renderer.includes('drawGlamourTemplateImageCover') &&
      renderer.includes('drawGlamourTemplateImageResampled') &&
      renderer.includes("imageSmoothingQuality = 'high'") &&
      renderer.includes('sourceWidth / dw > 2 || sourceHeight / dh > 2') &&
      renderer.includes('GlamourTemplateImageResolver') &&
      renderer.includes('GlamourTemplateIconResolver') &&
      renderer.includes('GlamourTemplateCanvasRenderContext') &&
      renderer.includes('resolveIcon?: GlamourTemplateIconResolver') &&
      renderer.includes('GlamourTemplateLoadedAssetMap') &&
      renderer.includes('renderData.canvas.imageSlots') &&
      renderer.includes('resolveIcon?.(row.item.icon)?.image') &&
      templateWorkspace.includes('renderGlamourTemplateCanvas') &&
      !templateWorkspace.includes('renderGlamourTemplateCanvasFallback') &&
      templateWorkspace.includes('drawGlamourTemplateImageCover') &&
      templateWorkspace.includes('templateIconImages') &&
      templateWorkspace.includes('preloadTemplateIcons') &&
      templateWorkspace.includes('resolveIcon: getTemplateIcon') &&
      !templateWorkspace.includes('function drawTemplateCanvasFallback') &&
      !templateWorkspace.includes('function drawImageCover'),
    'template canvas drawing and icon consumption must keep the V2 renderer boundary instead of drawing inside the Vue workspace component'
  )
  assert(
    assets.includes('GLAMOUR_TEMPLATE_RENDER_ASSET_URLS') &&
      assets.includes('GlamourTemplateRenderAssetUrlMap') &&
      assets.includes('resolveGlamourTemplateRenderAssetUrl') &&
      assets.includes('loadGlamourTemplateRenderAssets') &&
      assets.includes('new Image()') &&
      /GLAMOUR_TEMPLATE_RENDER_ASSET_URLS:\s*GlamourTemplateRenderAssetUrlMap\s*=\s*\{\}/.test(assets),
    'template render assets must keep an explicit empty URL map until runtime asset/public strategy is confirmed'
  )
  assert(
    rows.includes('isTemplateDyeExcludedSlot') && /isTemplateDyeExcludedSlot\(entry, format\)[\s\S]*?return \[\]/.test(rows),
    'template row adapter must keep legacy accessory dye rows empty'
  )
  assert(
    templateComposable.includes('useGlamourTemplateWorkspace') &&
      templateComposable.includes('GLAMOUR_TEMPLATE_SETTINGS_STORAGE_KEY'),
    'template workspace composable must preserve the legacy settings storage boundary'
  )
  assert(
    templateComposable.includes('applyImportedTitleToAllTemplates') &&
      templateComposable.includes('GLAMOUR_TEMPLATE_SELECT_ORDER') &&
    settings.includes('applyGlamourTemplateImportedTitle'),
    'template link imports must preserve legacy all-template imported-title fill'
  )
  assert(
    settings.includes("source.importMode !== 'template-link'") &&
      settings.includes('function getImportedTitleText') &&
      settings.includes('function clearNonLinkImportedTitle') &&
      settings.includes("topText: getDefaultTopText(template)") &&
      settings.includes("importedTitleAutoText: ''"),
    'template title auto-fill must stay limited to template-page link imports and must clear stale .chara filename auto-titles'
  )
  assert(
    templateComposable.includes('getDefaultTemplateLocalesForUiLanguage') &&
      templateComposable.includes('currentUiLocale') &&
      templateComposable.includes('locales: getDefaultTemplateLocalesForUiLanguage'),
    'template switching must preserve legacy UI-language/default locale reset'
  )
  assert(
    templateWorkspace.includes('templateImportPreferredLocale') &&
      templateWorkspace.includes("preferredLocale: templateImportPreferredLocale.value") &&
      glamourWorkspace.includes('selectImportPreferredLocale') &&
      glamourWorkspace.includes('availableLocales.includes(normalizedPreferred)') &&
      glamourWorkspace.includes('payload.default_locale || payload.source_locale'),
    'template link imports must preserve legacy preferred template locale selection before accepting payload'
  )
  assert(
    templateComposable.includes('syncCurrentTemplateLocalesWithUiLanguage') &&
      templateComposable.includes('[currentUiLocale.value, templateId.value]') &&
      templateComposable.includes('areSameLocales'),
    'template workspace must preserve legacy init/UI-language locale synchronization'
  )
  assert(
    templateComposable.includes('syncTemplateLinkImportLocales') &&
      templateComposable.includes('template.value.localeOrder.includes(draftLocale)') &&
      templateComposable.includes('updateTemplateSettings({ locales: nextLocales })') &&
      templateComposable.includes('syncTemplateLinkImportLocales()'),
    'template link imports must reset template output locales to the imported edit locale'
  )
  assert(
    templateWorkspace.includes('toggleTemplateLocale') &&
      !templateWorkspace.includes('languageSettingRows') &&
      !templateWorkspace.includes('moveTemplateLocale') &&
      !templateWorkspace.includes('removeTemplateLocale') &&
      !templateWorkspace.includes('nsglamour-template__language-order-controls'),
    'template workspace must keep language switching without exposing extra language order controls'
  )
  assert(
    !/<div class="nsglamour-template__item-body">[\s\S]*?\{\{\s*row\.dyeText\s*\}\}/.test(templateWorkspace) &&
      !templateWorkspace.includes('dyeText: templateRow?.dyeText') &&
      !templateWorkspace.includes('hasDyeLine: templateRow?.hasDyeLine'),
    'template editor must not expose renderer-only dye summary lines'
  )
  assert(
    templateWorkspace.includes('ref="templateCanvasEl"') &&
      templateWorkspace.includes('nsglamour-template__canvas-upload-layer') &&
      templateWorkspace.includes('downloadTemplateCanvas') &&
      templateWorkspace.includes('queueImageFiles') &&
      templateWorkspace.includes('openImageUploadMenu') &&
      templateWorkspace.includes('nsglamour-template__image-menu') &&
      templateWorkspace.includes('nsglamourTemplateRecentImages') &&
      templateWorkspace.includes('recentTemplateImages') &&
      templateWorkspace.includes('storeRecentTemplateImage') &&
      templateWorkspace.includes('createRecentTemplateImageThumbnail') &&
      templateWorkspace.includes('saveGlamourTemplateRecentImage') &&
      templateWorkspace.includes('loadGlamourTemplateRecentImages') &&
      templateWorkspace.includes('clearStoredGlamourTemplateRecentImages') &&
      templateWorkspace.includes('useRecentTemplateImage') &&
      templateWorkspace.includes('record.thumbnailUrl') &&
      templateWorkspace.includes('record.imageName') &&
      templateWorkspace.includes('renderGlamourTemplateCanvas') &&
      templateWorkspace.includes('restoreCurrentTemplateImages') &&
      templateWorkspace.includes('templateImagesById') &&
      templateWorkspace.includes('saveCurrentTemplateRuntimeImages') &&
      templateWorkspace.includes('applyTemplateRuntimeImages') &&
      templateWorkspace.includes('carryTemplateImagesIntoCurrentTemplate') &&
      templateWorkspace.includes('loadGlamourTemplateImageStoreRecords') &&
      templateWorkspace.includes('saveGlamourTemplateImageStoreSlot') &&
      templateWorkspace.includes('restoreCurrentTemplateImagesFromStore') &&
      templateWorkspace.includes('normalizeDraggedImageUrl') &&
      templateWorkspace.includes('getDroppedImageUrl') &&
      templateWorkspace.includes('setTemplateImageFromUrl') &&
      templateWorkspace.includes('nsglamour-template-crop') &&
      templateWorkspace.includes('openImageCropper') &&
      templateWorkspace.includes('applyImageCrop') &&
      templateWorkspace.includes('resetImageCrop') &&
      templateWorkspace.includes('renderCroppedImageDataUrl') &&
      templateWorkspace.includes('writeGlamourTemplateImageSessionSlot') &&
      templateWorkspace.includes('findGlamourTemplateImageSessionRecord') &&
      !templateWorkspace.includes('nsglamour-template__preview-row'),
    'template workspace must use the legacy canvas/upload/crop surface, runtime image cache, carry-forward switching, IndexedDB image store, and same-tab image backup instead of the temporary DOM preview rows'
  )
  assert(
    templateWorkspace.includes('getTemplateSelectorCardTitle') &&
      templateWorkspace.includes('getTemplateLanguageSummary') &&
      templateWorkspace.includes('nsglamourTemplateSelectorCardTitle'),
    'template selector cards must preserve the legacy author/summary/supported-language title'
  )
  assert(
    templateComposable.includes('selectedLocales.value.includes(draftLocale)') &&
      templateWorkspace.includes("'update-locale': [locale: string]") &&
      templateWorkspace.includes('setTemplateActiveLocale') &&
      templateWorkspace.includes('setNormalizedTemplateLocales([...selected, locale])') &&
      templateWorkspace.includes('activeLocale.value !== locale') &&
      templateWorkspace.includes('watch(\n  activeLocale') &&
      templateWorkspace.includes('const editorLocale = computed(() => activeLocale.value || props.draft.locale)') &&
      templateWorkspace.includes('locale: editorLocale.value'),
    'template workspace must keep legacy current-edit locale separate from template output locale order'
  )
  assert(
    settings.includes('fallbackLocales') &&
      settings.includes('if (normalized.length)') &&
      settings.includes('normalizedFallback'),
    'template locale normalization must only use fallback when selected locales are empty or unsupported'
  )
  assert(
    draft.includes('templateDraftToGlamourPayload') &&
      draft.includes('storedGlamourValueToPayload'),
    'draft layer must preserve legacy /template cardDraft recovery helpers'
  )
  assert(
    draft.includes('_storeDisplayName') &&
      draft.includes('payload._storeDisplayName') &&
      draft.includes('payload.source_name'),
    'draft recovery must use legacy store display name before falling back to source_name'
  )
  assert(
    draft.includes('sourceMeta') &&
      draft.includes('sourceTitle') &&
      draft.includes('sourceUrl') &&
      draft.includes('authorName'),
    'template draft writes must preserve legacy sourceMeta used by /template'
  )
  assert(
    draft.includes('source_title') &&
      draft.includes('source_url') &&
      draft.includes('source_id') &&
      draft.includes('file_type') &&
      draft.includes('author_name') &&
      draft.includes('author_world') &&
      draft.includes('author_label') &&
      draft.includes('race') &&
      draft.includes('gender'),
    'template draft recovery must preserve legacy sourceMeta snake_case aliases'
  )
  assert(
    draft.includes("readStringAlias(sourceMeta, ['sourceTitle', 'source_title', 'title'])") &&
      draft.includes("readStringAlias(sourceMeta, ['sourceUrl', 'source_url', 'url'])") &&
      draft.includes("readStringAlias(sourceMeta, ['authorName', 'author_name'])"),
    'template draft recovery must read legacy source title/url/author aliases before filling template settings'
  )
  assert(
    draft.includes('isManualTemplateDraftSource') &&
      draft.includes("sourceTitle: manualSource ? ''"),
    'template draft writes must keep legacy manual-edit sourceMeta empty'
  )
  assert(
    draftComposable.includes('GLAMOUR_CARD_DRAFT_STORAGE_KEY') &&
      draftComposable.includes('loadStoredDraft'),
    'draft composable must read the legacy cardDraft storage key on startup'
  )
  assert(
    draftComposable.includes("window.addEventListener('storage'") &&
      draftComposable.includes('GLAMOUR_STORE_EQUIPMENT_STORAGE_KEY') &&
      draftComposable.includes('GLAMOUR_RECENT_STORAGE_KEY'),
    'draft composable must preserve legacy storage sync for shared equipment and recent loadouts'
  )
  assert(
    draftComposable.includes("mode?: 'template' | 'equipinfo'") &&
      draftComposable.includes("name: templateMode ? '手动编辑'") &&
      draftComposable.includes('if (!templateMode)'),
    'draft composable must keep legacy /template recent restore from reusing import source metadata'
  )
  assert(
    equipment.includes('nsglamour.ignoreEmperor') &&
      equipment.includes('is_emperor') &&
      equipment.includes('getVisibleEquipmentEntries'),
    'equipment normalization must preserve legacy emperor-item filtering key'
  )
  assert(
    recent.includes("sourceUrl: typeof draft.source?.url === 'string' ? draft.source.url : ''"),
    'recent snapshots must preserve legacy source_url instead of using the display title'
  )
  assert(
    recent.includes('normalizeRecentSnapshot') &&
      recent.includes('Array.isArray(value.parsed.resolved_equipment)') &&
      recent.includes('`legacy-${index}-${savedAt}-${sourceName}`'),
    'recent snapshots must keep legacy cache entries even when an old id is missing'
  )
  assert(
    links.includes('normalizeGlamourLinkUrl') &&
      links.includes('getGlamourLinkKind') &&
      links.includes('isSupportedGlamourLinkUrl') &&
      links.includes("url.hostname === 'ffxiv.eorzeacollection.com'") &&
      links.includes("url.hostname === 'ff14risingstones.web.sdo.com'") &&
      links.includes("`https://${text}`") &&
      importPanel.includes('normalizeGlamourLinkUrl(url.value)') &&
      templateWorkspace.includes('normalizeGlamourLinkUrl(importUrl.value)') &&
      templateWorkspace.includes('isSupportedGlamourLinkUrl(url)') &&
      !importPanel.includes('type="url"') &&
      !templateWorkspace.includes('type="url"'),
    'glamour link inputs must preserve legacy auto-https normalization and supported-domain validation'
  )

  const slotOrder = extractQuotedArray(rows, 'GLAMOUR_TEMPLATE_SLOT_ORDER')
  assertSameArray(slotOrder, TEMPLATE_SLOT_ORDER, 'template slot order must match the equipinfo mobile/template order')

  const body = equipinfoSamplePayload.resolved_equipment.find((entry) => entry?.slot === BODY_SLOT)
  assertPlainObject(body, 'template sample payload must include Body')
  assert(Array.isArray(body.candidates) && body.candidates[0], 'template sample Body entry must include item')

  return `templates=${TEMPLATE_IDS.length} slots=${TEMPLATE_SLOT_ORDER.length} sample=${body.candidates[0].name ?? body.candidates[0].key}`
}

function validateTemplateDefinitions(definitions, legacyDefinitions, templateIds) {
  for (const templateId of templateIds) {
    const legacyBlock = extractObjectBlock(legacyDefinitions, templateId)
    const v2Block = extractObjectBlock(definitions, templateId)

    for (const property of ['name', 'shortName', 'renderMode', 'summary']) {
      assert(
        extractStringProperty(v2Block, property) === extractStringProperty(legacyBlock, property),
        `template ${templateId}.${property} must match legacy /template`
      )
    }

    assert(
      extractStringProperty(v2Block, 'legacyPreviewPath') === extractLegacyPreviewPath(legacyBlock),
      `template ${templateId} preview path must match legacy /template`
    )
    assert(
      extractNumericProperty(v2Block, 'sourceWidth') === resolveLegacyTemplateSize(legacyBlock, 'sourceWidth'),
      `template ${templateId} sourceWidth must match legacy /template`
    )
    assert(
      extractNumericProperty(v2Block, 'sourceHeight') === resolveLegacyTemplateSize(legacyBlock, 'sourceHeight'),
      `template ${templateId} sourceHeight must match legacy /template`
    )
    assert(
      extractStringProperty(v2Block, 'defaultLocale') === resolveLegacyDefaultLocale(legacyBlock),
      `template ${templateId} defaultLocale must match legacy /template`
    )
    assertSameArray(
      extractArrayProperty(v2Block, 'localeOrder'),
      resolveLegacyLocaleOrder(legacyBlock),
      `template ${templateId} localeOrder must match legacy /template`
    )
    validateTemplateControls(v2Block, legacyBlock, templateId)
    validateTemplateLanguageOptions(v2Block, legacyBlock, templateId)
  }
}

function validateTemplateControls(v2Block, legacyBlock, templateId) {
  const legacyControls = extractControlProperties(legacyBlock)
  const v2Controls = extractControlProperties(v2Block)
  const legacyKeys = Object.keys(legacyControls).sort()
  const v2Keys = Object.keys(v2Controls).sort()

  assertSameArray(v2Keys, legacyKeys, `template ${templateId} controls keys must match legacy /template`)

  for (const key of legacyKeys) {
    assert(
      v2Controls[key] === legacyControls[key],
      `template ${templateId} controls.${key} must match legacy /template`
    )
  }
}

function validateTemplateLanguageOptions(v2Block, legacyBlock, templateId) {
  assertSameArray(
    extractOptionalQuotedArray(v2Block, 'languageOptions'),
    extractOptionalQuotedArray(legacyBlock, 'languageOptions'),
    `template ${templateId} languageOptions must match legacy /template`
  )
}

function validateTemplateImageSlots(imageSlots, legacyDefinitions) {
  assert(
    imageSlots.includes('nsglamour.templateImageSessionBackup.v2') &&
      imageSlots.includes('nsglamour.templateImageSessionBackup.v1') &&
      imageSlots.includes('readGlamourTemplateImageSessionBackupKey') &&
      imageSlots.includes('GLAMOUR_TEMPLATE_IMAGE_LEGACY_SESSION_STORAGE_KEY'),
    'template image slot helper must preserve legacy same-tab image backup storage keys'
  )
  assert(
    imageSlots.includes('nsglamour-template-images-v2') &&
      imageSlots.includes("GLAMOUR_TEMPLATE_IMAGE_DB_STORE_NAME = 'images'") &&
      imageSlots.includes("GLAMOUR_TEMPLATE_RECENT_IMAGE_DB_STORE_NAME = 'recentImages'") &&
      imageSlots.includes('GLAMOUR_TEMPLATE_RECENT_IMAGE_LIMIT = 5') &&
      imageSlots.includes('GlamourTemplateRecentImageRecord') &&
      imageSlots.includes('saveGlamourTemplateImageStoreSlot') &&
      imageSlots.includes('loadGlamourTemplateImageStoreRecords') &&
      imageSlots.includes('deleteGlamourTemplateImageStoreSlot') &&
      imageSlots.includes('saveGlamourTemplateRecentImage') &&
      imageSlots.includes('loadGlamourTemplateRecentImages') &&
      imageSlots.includes('clearGlamourTemplateRecentImages') &&
      imageSlots.includes('thumbnailUrl') &&
      imageSlots.includes('navigator.storage.persist') &&
      imageSlots.includes('indexedDB.open'),
    'template image slot helper must preserve legacy IndexedDB image persistence boundary and the confirmed recent-image stash'
  )
  assert(
    imageSlots.includes('GLAMOUR_TEMPLATE_IMAGE_SLOT_ALIASES') &&
      imageSlots.includes('GLAMOUR_TEMPLATE_RISINGSTONES_AVATAR_SLOT_ID') &&
      imageSlots.includes('GLAMOUR_TEMPLATE_SILENCE_FASHION_AVATAR_SLOT_ID') &&
      imageSlots.includes('getGlamourTemplateEquivalentImageSlotIds') &&
      imageSlots.includes('readGlamourTemplateImageSessionBackup') &&
      imageSlots.includes('writeGlamourTemplateImageSessionSlot') &&
      imageSlots.includes('findGlamourTemplateImageSessionRecord') &&
      imageSlots.includes('data:image/'),
    'template image slot helper must preserve legacy avatar slot alias and same-tab backup boundaries'
  )
  assert(
    !imageSlots.includes('Object.values(backup)'),
    'template same-tab image backup must not globally leak images across unrelated template ids'
  )
  assert(
    legacyDefinitions.includes('RISINGSTONES_AVATAR_SLOT_ID') &&
      legacyDefinitions.includes('SILENCE_FASHION_AVATAR_SLOT_ID'),
    'legacy template definitions must still expose avatar slot ids'
  )
}

function validateTemplateRenderProfiles(renderProfiles, legacyRenderers) {
  for (const renderMode of TEMPLATE_RENDER_MODES) {
    const legacyBlock = extractObjectBlock(legacyRenderers, renderMode)
    const v2Block = extractObjectBlock(renderProfiles, renderMode)

    assert(
      extractStringProperty(v2Block, 'defaultTopText') === extractStringProperty(legacyBlock, 'defaultTopText'),
      `render profile ${renderMode}.defaultTopText must match legacy /template`
    )
    assert(
      extractOptionalStringProperty(v2Block, 'legacyTopText') === extractOptionalStringProperty(legacyBlock, 'legacyTopText'),
      `render profile ${renderMode}.legacyTopText must match legacy /template`
    )
    assert(
      extractBooleanProperty(v2Block, 'forceIcons', false) === extractBooleanProperty(legacyBlock, 'forceIcons', false),
      `render profile ${renderMode}.forceIcons must match legacy /template`
    )
    assertSameArray(
      extractArrayProperty(v2Block, 'assets'),
      extractLegacyRenderAssets(legacyBlock),
      `render profile ${renderMode} asset requirements must match legacy /template loadAssets`
    )
  }

  const legacyDefaultBlock = extractObjectBlock(legacyRenderers, 'default')
  const v2DefaultBlock = extractAssignedObjectBlock(renderProfiles, 'GLAMOUR_TEMPLATE_DEFAULT_RENDER_PROFILE')
  assert(
    extractStringProperty(v2DefaultBlock, 'defaultTopText') === extractStringProperty(legacyDefaultBlock, 'defaultTopText'),
    'default render profile defaultTopText must match legacy /template'
  )
  assertSameArray(
    extractArrayProperty(v2DefaultBlock, 'assets'),
    extractLegacyRenderAssets(legacyDefaultBlock),
    'default render profile asset requirements must match legacy /template loadAssets'
  )
  assert(
    renderProfiles.includes('getGlamourTemplateRenderProfile') &&
      renderProfiles.includes('GLAMOUR_TEMPLATE_RENDER_PROFILES') &&
      renderProfiles.includes('GLAMOUR_TEMPLATE_DEFAULT_RENDER_PROFILE'),
    'template render profiles must expose the V2 renderer profile lookup boundary'
  )
}

function extractQuotedArray(source, name) {
  const pattern = new RegExp(`${escapeRegExp(name)}(?:\\s*:[^=]+)?\\s*=\\s*\\[([\\s\\S]*?)\\]`, 'm')
  const match = source.match(pattern)
  assert(match, `source must declare ${name}`)
  return extractQuotedStrings(match[1])
}

function extractArrayProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'm'))
  assert(match, `template block must include array property ${property}`)
  return extractQuotedStrings(match[1])
}

function extractOptionalQuotedArray(block, property) {
  const start = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*\\[`, 'm'))

  if (!start) {
    return []
  }

  const openBracketIndex = block.indexOf('[', start.index)
  return extractQuotedStrings(extractBalancedBlock(block, openBracketIndex, '[', ']'))
}

function extractQuotedStrings(source) {
  return Array.from(source.matchAll(/['"]([^'"]+)['"]/g)).map((match) => match[1])
}

function extractControlProperties(block) {
  const start = block.match(/controls\s*:\s*\{/m)
  assert(start, 'template block must include controls')
  const openBraceIndex = block.indexOf('{', start.index)
  const controlsBlock = extractBalancedBlock(block, openBraceIndex, '{', '}')
  return Object.fromEntries(
    Array.from(controlsBlock.matchAll(/([a-zA-Z0-9_]+)\s*:\s*(true|false)/g)).map((match) => [
      match[1],
      match[2] === 'true'
    ])
  )
}

function extractObjectBlock(source, key) {
  const quotedKey = key.includes('-') ? `['"]${escapeRegExp(key)}['"]` : `(?:${escapeRegExp(key)}|['"]${escapeRegExp(key)}['"])`
  const pattern = new RegExp(`${quotedKey}\\s*:\\s*\\{`, 'm')
  const match = pattern.exec(source)
  assert(match, `template definitions must include ${key}`)

  const openBraceIndex = source.indexOf('{', match.index)
  return extractBalancedBlock(source, openBraceIndex, '{', '}')
}

function extractBalancedBlock(source, openIndex, openChar, closeChar) {
  let depth = 0
  let inString = ''
  let escaped = false

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === inString) {
        inString = ''
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char
      continue
    }

    if (char === openChar) {
      depth += 1
      continue
    }

    if (char === closeChar) {
      depth -= 1

      if (depth === 0) {
        return source.slice(openIndex, index + 1)
      }
    }
  }

  throw new Error(`balanced block starting at ${openIndex} is not closed`)
}

function extractStringProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*['"]([^'"]*)['"]`, 'm'))
  assert(match, `template block must include string property ${property}`)
  return match[1]
}

function extractOptionalStringProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*['"]([^'"]*)['"]`, 'm'))
  return match ? match[1] : ''
}

function extractBooleanProperty(block, property, fallback) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*(true|false)`, 'm'))
  return match ? match[1] === 'true' : fallback
}

function extractNumericProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, 'm'))
  assert(match, `template block must include numeric property ${property}`)
  return Number(match[1])
}

function extractAssignedObjectBlock(source, name) {
  const pattern = new RegExp(`${escapeRegExp(name)}(?:\\s*:[^=]+)?\\s*=\\s*\\{`, 'm')
  const match = pattern.exec(source)
  assert(match, `source must assign ${name}`)

  const openBraceIndex = source.indexOf('{', match.index)
  return extractBalancedBlock(source, openBraceIndex, '{', '}')
}

function extractLegacyRenderAssets(block) {
  const assetMap = {
    loadFigmaTemplateBackground: 'figma-background',
    loadHorizontalTemplateBackground: 'horizontal-background',
    loadDoublePicLeftMask: 'double-pic-left-mask',
    loadStoryTemplateLeftMask: 'story-left-mask',
    loadSilenceFashionBackground: 'silence-fashion-background'
  }

  return Array.from(block.matchAll(/\b(load[A-Za-z0-9]+)\(\)/g)).map((match) => {
    const asset = assetMap[match[1]]
    assert(asset, `unsupported legacy template asset loader ${match[1]}`)
    return asset
  })
}

function extractLegacyPreviewPath(block) {
  const match = block.match(/previewUrl\s*:\s*appPath\(['"]([^'"]+)['"]\)/m)
  assert(match, 'legacy template block must include previewUrl appPath')
  return match[1]
}

function resolveLegacyDefaultLocale(block) {
  const match = block.match(/defaultLocale\s*:\s*([^,\n]+)/m)
  assert(match, 'legacy template block must include defaultLocale')
  const value = match[1].trim().replace(/['"]/g, '')
  return value === 'DEFAULT_LOCALE' ? 'zh' : value
}

function resolveLegacyTemplateSize(block, property) {
  const match =
    block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*([^,\\n]+)`, 'm')) ||
    block.match(/sourceSize\s*:\s*([^,\n]+)/m)
  assert(match, `legacy template block must include ${property} or sourceSize`)
  const value = match[1].trim()

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
    return Number(value)
  }

  if (value === 'FIGMA_SOURCE_SIZE') {
    return 3840
  }

  if (value === 'EC_TEMPLATE_SOURCE_SIZE') {
    return 3840
  }

  if (value === 'RISINGSTONES_TEMPLATE.sourceSize') {
    return 3840
  }

  if (value === 'SILENCE_FASHION_TEMPLATE.sourceSize') {
    return 3000
  }

  if (value === 'HORIZONTAL_TEMPLATE_SOURCE_WIDTH') {
    return 4846
  }

  if (value === 'HORIZONTAL_TEMPLATE_SOURCE_HEIGHT') {
    return 3635
  }

  if (value === 'DOUBLE_PIC_SOURCE_WIDTH') {
    return 2968
  }

  if (value === 'DOUBLE_PIC_SOURCE_HEIGHT') {
    return 3958
  }

  if (value === 'SILENCE_FASHION_SOURCE_SIZE') {
    return 3000
  }

  throw new Error(`unsupported legacy template size reference ${value}`)
}

function resolveLegacyLocaleOrder(block) {
  const literal = block.match(/localeOrder\s*:\s*\[([\s\S]*?)\]/m)

  if (literal) {
    return extractQuotedStrings(literal[1])
  }

  const reference = block.match(/localeOrder\s*:\s*([A-Z_]+)/m)
  assert(reference, 'legacy template block must include localeOrder')

  if (reference[1] === 'TEMPLATE_LOCALE_ORDER') {
    return ['zh', 'tc']
  }

  if (reference[1] === 'EC_TEMPLATE_LOCALE_ORDER') {
    return ['en', 'zh', 'tc', 'ja', 'ko', 'fr', 'de']
  }

  if (reference[1] === 'HORIZONTAL_TEMPLATE_LOCALE_ORDER') {
    return ['zh', 'tc', 'en', 'ja', 'ko', 'fr', 'de']
  }

  throw new Error(`unsupported legacy localeOrder reference ${reference[1]}`)
}

function assertSameArray(actual, expected, message) {
  assert(
    actual.length === expected.length && actual.every((value, index) => value === expected[index]),
    `${message}; expected ${expected.join(',')}, got ${actual.join(',')}`
  )
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function requestJson(path, options = {}) {
  const url = buildUrl(path, options.query)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs)
  const headers = new Headers(options.headers ?? {})

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'zh')
  }

  const init = {
    method: options.method ?? (options.json === undefined ? 'GET' : 'POST'),
    headers,
    signal: controller.signal
  }

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json; charset=utf-8')
    init.body = JSON.stringify(options.json)
  } else if (options.body !== undefined) {
    init.body = options.body
  }

  try {
    const response = await fetch(url, init)
    const text = await response.text()
    const data = parseJson(text, url)
    return {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      bytes: encoder.encode(text).length,
      data
    }
  } finally {
    clearTimeout(timeout)
  }
}

function parseJson(text, url) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Expected JSON from ${url}, got ${text.slice(0, 120)}`)
  }
}

function expectStatus(response, statuses) {
  if (!statuses.includes(response.status)) {
    throw new Error(
      `expected status ${statuses.join(' or ')}, got ${response.status} ${response.statusText} from ${response.url}`
    )
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertPlainObject(value, message) {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), message)
}

function buildUrl(path, query = {}) {
  const normalizedPath = String(path ?? '').replace(/^\/+/, '')
  const url = new URL(normalizedPath, normalizeBaseUrl(args.baseUrl))

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url
}

function normalizeBaseUrl(value) {
  const text = String(value ?? DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL
  return text.endsWith('/') ? text : `${text}/`
}

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.NSGLAMOUR_CONTRACT_BASE_URL || DEFAULT_BASE_URL,
    charaFile: process.env.NSGLAMOUR_CONTRACT_CHARA_FILE || '',
    timeoutMs: parsePositiveInt(process.env.NSGLAMOUR_CONTRACT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    help: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }

    if (arg === '--base-url') {
      parsed.baseUrl = argv[index + 1] || DEFAULT_BASE_URL
      index += 1
      continue
    }

    if (arg === '--chara-file') {
      parsed.charaFile = argv[index + 1] || ''
      index += 1
      continue
    }

    if (arg === '--timeout-ms') {
      parsed.timeoutMs = parsePositiveInt(argv[index + 1], DEFAULT_TIMEOUT_MS)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return parsed
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function printHelp() {
  console.log(`Check the NSGlamour legacy backend contract used by V2.

Usage:
  node scripts/check-nsglamour-contract.mjs
  node scripts/check-nsglamour-contract.mjs --base-url http://127.0.0.1:5173/api/glamour

Options:
  --base-url <url>     API base URL. Default: ${DEFAULT_BASE_URL}
  --chara-file <path>  Optional real .chara fixture for POST /parse-chara.
  --timeout-ms <ms>    Per-request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --help, -h           Show this help.

Environment:
  NSGLAMOUR_CONTRACT_BASE_URL
  NSGLAMOUR_CONTRACT_CHARA_FILE
  NSGLAMOUR_CONTRACT_TIMEOUT_MS
`)
}
