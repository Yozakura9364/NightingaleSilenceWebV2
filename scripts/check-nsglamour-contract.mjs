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
  'src/lib/glamour/templates/imageProcessing.ts',
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
  'src/pages/glamour/NSGlamourPage.vue',
  'src/pages/glamour/components/NSGlamourEquipmentPanel.vue',
  'src/pages/glamour/components/NSGlamourEquipmentSlot.vue',
  'src/pages/glamour/styles/equipment-slot.css',
  'src/pages/glamour/components/NSGlamourImportPanel.vue',
  'src/pages/glamour/components/NSGlamourWorkspace.vue',
  'src/pages/glamour/components/NSGlamourTemplateWorkspace.vue',
  'src/pages/glamour/components/NSGlamourTemplateSettingsPanel.vue',
  'src/pages/glamour/components/NSGlamourTemplateEquipmentPanel.vue',
  'src/pages/glamour/components/NSGlamourTemplateEquipmentEditor.vue',
  'src/pages/glamour/composables/useGlamourTemplateLanguageControls.ts',
  'src/pages/glamour/styles/template-workspace.css',
  'src/pages/glamour/composables/useGlamourDyePicker.ts',
  'src/pages/glamour/composables/useGlamourEquipInfoEditor.ts',
  'src/pages/glamour/composables/useGlamourEquipmentSearch.ts',
  'src/pages/glamour/composables/useGlamourTemplateCanvas.ts',
  'src/pages/glamour/services/nsglamourApi.ts',
  'src/pages/glamour/composables/useGlamourTemplateEquipmentEditor.ts',
  'src/pages/glamour/composables/useGlamourTemplateImageInteraction.ts',
  'src/pages/glamour/composables/useGlamourTemplateImageStore.ts',
  'src/pages/glamour/components/NSGlamourTemplateCropDialog.vue',
  'src/pages/glamour/components/NSGlamourTemplateSelectorDialog.vue',
  'src/pages/glamour/components/NSGlamourTemplateImportDialog.vue',
  'src/locales/modules/glamour.ts'
]
const LEGACY_TEMPLATE_DEFINITIONS_FILE = resolve('..', 'NSGlamour', 'static', 'template-definitions.js')
const LEGACY_TEMPLATE_RENDERERS_FILE = resolve('..', 'NSGlamour', 'static', 'template-renderers.js')
const LEGACY_TEMPLATE_FILE = resolve('..', 'NSGlamour', 'static', 'template.js')
const TEMPLATE_IDS = ['eorzea', 'horizontal', 'story', 'risingstones', 'ec', 'silence-fashion']
const TEMPLATE_RENDER_MODES = ['eorzea', 'horizontal', 'double-pic', 'risingstones', 'ec', 'silence-fashion']
const TEMPLATE_RENDER_ASSET_FILES = [
  'public/data/glamour/templates/eorzea-magazine.png',
  'public/data/glamour/templates/eorzea-horizontal-magazine-bg.png',
  'public/data/glamour/templates/double-pic-left-mask.png',
  'public/data/glamour/templates/silence-fashion-background.png',
  'public/data/glamour/templates/com_icon_clear.svg'
]
const TEMPLATE_PREVIEW_ASSET_FILES = [
  'public/data/glamour/template-preview/1-Eorzea Magazine/1-Preview.webp',
  'public/data/glamour/template-preview/2-Double Pic/2-Preview.webp',
  'public/data/glamour/template-preview/3-Eorzea Collection/3-preview.webp',
  'public/data/glamour/template-preview/4-Horizontal Eorzea Magazine/4-Preview.webp',
  'public/data/glamour/template-preview/5-Risingstones/5-preview.webp',
  'public/data/glamour/template-preview/6-Silence Fashion/6-preview.webp'
]
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
    imageProcessing,
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
    glamourPage,
    equipmentPanel,
    equipmentSlot,
    equipmentSlotStyles,
    importPanel,
    glamourWorkspace,
    templateWorkspace,
    templateSettingsPanel,
    templateEquipmentPanel,
    templateEquipmentEditor,
    templateLanguageControls,
    templateWorkspaceStyles,
    dyePickerComposable,
    equipInfoEditorComposable,
    equipmentSearchComposable,
    templateCanvas,
    glamourApi,
    templateEquipmentComposable,
    templateImageInteraction,
    templateImageStore,
    templateCropDialog,
    templateSelectorDialog,
    templateImportDialog,
    uiLocaleSource,
    legacyDefinitions,
    legacyRenderers,
    legacyTemplate
  ] = await Promise.all(
    [
      ...TEMPLATE_SOURCE_FILES.map((filePath) => resolve(filePath)),
      LEGACY_TEMPLATE_DEFINITIONS_FILE,
      LEGACY_TEMPLATE_RENDERERS_FILE,
      LEGACY_TEMPLATE_FILE
    ].map(
      (filePath) => readFile(filePath, 'utf8')
    )
  )

  const templateEditorSource = [
    templateWorkspace,
    templateSettingsPanel,
    templateEquipmentPanel,
    templateEquipmentEditor,
    templateLanguageControls,
    templateWorkspaceStyles,
    templateEquipmentComposable
  ].join('\n')
  const sharedEquipmentEditorSource = [dyePickerComposable, equipInfoEditorComposable, equipmentSearchComposable, templateEquipmentComposable].join('\n')
  const templateImageSource = [
    templateWorkspace,
    templateImageInteraction,
    templateImageStore,
    imageProcessing,
    imageSlots
  ].join('\n')

  const legacyOrder = extractQuotedArray(legacyDefinitions, 'TEMPLATE_SELECT_ORDER')
  const v2Order = extractQuotedArray(definitions, 'GLAMOUR_TEMPLATE_SELECT_ORDER')
  assertSameArray(legacyOrder, TEMPLATE_IDS, 'legacy /template select order must match the documented migration order')
  assertSameArray(v2Order, legacyOrder, 'V2 template select order must match legacy /template')

  validateTemplateDefinitions(definitions, legacyDefinitions, legacyOrder)
  validateTemplateImageSlotRegions(definitions, legacyDefinitions, legacyTemplate)
  validateTemplateEquipmentFormats(definitions, legacyDefinitions, legacyTemplate)
  validateTemplateRenderProfiles(renderProfiles, legacyRenderers)
  validateEcTemplateColors(renderer, legacyTemplate)
  validateCanvasRendererConstants(renderer, legacyTemplate)
  validateTemplateSettingsDefaults(settings, legacyTemplate)
  validateTemplateImageSlots(imageSlots, legacyDefinitions)
  validateNsglamourVisibleText(uiLocaleSource)
  await validateTemplatePublicAssets()

  assert(
    glamourPage.includes('--ns-ffxiv-workspace-bg: var(--ns-glamour-workspace-bg)') &&
      !glamourPage.includes('#fff8fc') &&
      glamourWorkspace.includes('background: #fff;') &&
      templateWorkspaceStyles.includes('background: #fff;') &&
      !glamourWorkspace.includes('#fff8fc') &&
      !templateWorkspaceStyles.includes('#fff8fc'),
    'NSGlamour page shell must keep the shared theme background while equipinfo/template workspaces stay pure white'
  )
  assert(
    countSubstring(glamourWorkspace, 'defineAsyncComponent(') === 4 &&
      glamourWorkspace.includes("import('@/pages/glamour/components/NSGlamourCopyPanel.vue')") &&
      glamourWorkspace.includes("import('@/pages/glamour/components/NSGlamourEquipmentPanel.vue')") &&
      glamourWorkspace.includes("import('@/pages/glamour/components/NSGlamourImportPanel.vue')") &&
      glamourWorkspace.includes("import('@/pages/glamour/components/NSGlamourTemplateWorkspace.vue')") &&
      !glamourWorkspace.includes('import NSGlamourTemplateWorkspace from'),
    'template and equipinfo UI branches must remain lazy-loaded outside the shared NSGlamour workspace chunk'
  )
  assert(
    templateWorkspace.includes('import NSGlamourTemplateSettingsPanel') &&
      templateWorkspace.includes('import NSGlamourTemplateEquipmentPanel') &&
      templateWorkspace.includes('<NSGlamourTemplateSettingsPanel') &&
      templateWorkspace.includes('<NSGlamourTemplateEquipmentPanel') &&
      templateWorkspace.includes('<style src="../styles/template-workspace.css"></style>') &&
      templateSettingsPanel.includes('nsglamour-template__author-popover') &&
      templateEquipmentPanel.includes('<NSGlamourTemplateEquipmentEditor') &&
      templateLanguageControls.includes('useGlamourTemplateLanguageControls'),
    'template workspace must keep settings, equipment controls, language state, and module styles in their dedicated boundaries'
  )
  assert(
    equipmentSlot.includes('nsglamour-slot--selected-no-dye') &&
      countSubstring(equipmentSlot, 'v-else-if="!entry.itemName" class="nsglamour-slot__search"') === 1 &&
      !equipmentSlot.includes('<div v-else class="nsglamour-slot__search">'),
    'selected NSGlamour equipment without dye rows must center the selected item and must not render an empty-slot search box'
  )
  assert(
    /nsglamour-slot__candidate-panel[\s\S]*?width:\s*min\(420px, calc\(100vw - 42px\)\)/.test(equipmentSlotStyles) &&
      /nsglamour-slot__candidate-option[\s\S]*?grid-template-columns:\s*42px minmax\(0, 1fr\)[\s\S]*?min-height:\s*52px/.test(equipmentSlotStyles) &&
      /nsglamour-slot__candidate-option img[\s\S]*?width:\s*42px[\s\S]*?height:\s*42px/.test(equipmentSlotStyles) &&
      /nsglamour-slot__candidate-option span[\s\S]*?font-size:\s*14px/.test(equipmentSlotStyles) &&
      /nsglamour-slot__search-result[\s\S]*?grid-template-columns:\s*42px minmax\(0, 1fr\)[\s\S]*?min-height:\s*52px/.test(equipmentSlotStyles) &&
      /nsglamour-slot__search-result img[\s\S]*?width:\s*42px[\s\S]*?height:\s*42px/.test(equipmentSlotStyles) &&
      /nsglamour-slot__search-result[\s\S]*?font-size:\s*14px/.test(equipmentSlotStyles),
    'NSGlamour equipment candidates/search results must stay aligned with selected equipment icon and text sizing'
  )
  assert(
    /nsglamour-slot__dye-chip[\s\S]*?radial-gradient\(\s*circle at 11px center,\s*var\(--nsglamour-dye-color, #000000\) 0 5px,\s*transparent 6px\s*\)/.test(equipmentSlotStyles) &&
      /nsglamour-slot__dye-chip\.empty-dye[\s\S]*?com_icon_clear\.svg'\) 6px center \/ 10px 10px no-repeat/.test(equipmentSlotStyles) &&
      /nsglamour-template__dye-chip::before[\s\S]*?width:\s*10px[\s\S]*?height:\s*10px/.test(templateEditorSource) &&
      /nsglamour-template__dye-chip\.empty-dye::before[\s\S]*?com_icon_clear\.svg'\) center \/ 10px 10px no-repeat/.test(templateEditorSource),
    'NSGlamour clear dye icon must occupy the same 10px box as normal dye swatches in equipinfo and template editors'
  )
  assert(
    equipmentPanel.includes('v-if="!isMobileLayout"') &&
      equipmentPanel.includes('v-else class="nsglamour-equipment__grid nsglamour-equipment__grid--mobile"') &&
      equipmentPanel.includes("window.matchMedia('(max-width: 1080px)')") &&
      countSubstring(equipmentPanel, '<NSGlamourEquipmentSlot') === 2,
    'equipinfo must mount only the active desktop or mobile slot layout while preserving both explicit slot orders'
  )
  assert(
    equipmentSearchComposable.includes('new AbortController()') &&
      equipmentSearchComposable.includes('controllers.get(slot)?.abort()') &&
      equipmentSearchComposable.includes('signal: controller.signal') &&
      equipmentSearchComposable.includes('onBeforeUnmount(() =>') &&
      dyePickerComposable.includes('sharedStainLists') &&
      dyePickerComposable.includes('sharedStainRequests') &&
      equipInfoEditorComposable.includes('useGlamourEquipmentSearch') &&
      templateEquipmentComposable.includes('useGlamourEquipmentSearch') &&
      sharedEquipmentEditorSource.includes('useGlamourDyePicker'),
    'equipinfo and template must share cancellable equipment search and cross-page stain loading logic'
  )

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
      settings.includes('showIcons') &&
      settings.includes('getGlamourTemplateSubtitleParts'),
    'template settings must preserve legacy canvas-only settings for later renderer migration'
  )
  assert(
    rows.includes('createGlamourTemplateRows'),
    'template row adapter must expose createGlamourTemplateRows'
  )
  assert(
    rows.includes('const sourceEntries = getOrderedFilledEntries(draft).filter') &&
      rows.includes('locales.some((candidateLocale)') &&
      rows.includes('const limitedEntries = maxRows > 0 ? sourceEntries.slice(0, maxRows) : sourceEntries') &&
      rows.includes('const rows = limitedEntries'),
    'template row adapter must preserve legacy order: filter renderable rows by selected locales before maxRows, then map each output locale'
  )
  assert(
    rows.includes('normalizeTemplateDyeName(sourceName)') &&
      !rows.includes('normalizeTemplateDyeName(sourceName, locale, format.stripDyeSuffix') &&
      renderer.includes('function normalizeDyeLabel') &&
      renderer.includes("replace(/染剂$/u, '').replace(/染劑$/u, '')"),
    'template row adapter must keep legacy dye text suffixes; EC/Risingstones chip renderers trim dye suffixes locally'
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
      renderData.includes('getGlamourTemplateSubtitleParts') &&
      renderData.includes('subtitleParts') &&
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
      renderer.includes('const suffix = locale === \'tc\' ? \'染劑\' : \'染剂\'') &&
      renderer.includes('text.replace(/染剂$/u, suffix)') &&
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
      renderer.includes('nameWeight: 400') &&
      renderer.includes('"Noto Sans SC Variable", "HarmonyOS Sans SC", "Source Han Sans CN", "Microsoft YaHei", sans-serif') &&
      renderer.includes('fontFamily: layout.fontFamily') &&
      renderer.includes('inkCenter?: boolean') &&
      renderer.includes('layout.inkCenter') &&
      renderer.includes('getTextInkCenterBaseline(ctx, text, centerY)') &&
      renderer.includes('RISINGSTONES_TEMPLATE.copyright.lines') &&
      renderer.includes('© 2010-${TEMPLATE_COPYRIGHT_END_YEAR} SQUARE ENIX CO., LTD. All Rights Reserved.') &&
      renderer.includes("options.renderData.template.renderMode === 'ec'") &&
      renderer.includes('renderEcTemplateCanvas') &&
      renderer.includes('EC_TEMPLATE_LAYOUTS') &&
      renderer.includes('drawEcEquipment') &&
      renderer.includes('EC_ITEM_RARITY_COLORS') &&
      renderer.includes('drawEcCenteredFittedText') &&
      renderer.includes('drawEcSubtitle') &&
      renderer.includes('renderData.text.subtitleParts') &&
      renderer.includes('NS Cambria') &&
      renderer.includes('trackingSize = size * (tracking / 1000)') &&
      renderer.includes('getEcItemNameColor') &&
      renderer.includes('getEcVariantLabel') &&
      renderer.includes('makeEcVariantDye') &&
      renderer.includes("row.slot === 'Glasses'") &&
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
      rows.includes('ecVariantLabel?: string') &&
      rows.includes('candidate.ec_variant_label') &&
      templateCanvas.includes('renderGlamourTemplateCanvas') &&
      templateCanvas.includes('canvasFonts') &&
      templateCanvas.includes('ensureCanvasFonts') &&
      templateCanvas.includes('document.fonts') &&
      templateCanvas.includes('fontSet.load(font, loadText)') &&
      templateCanvas.includes('fontLoadFallbackText') &&
      templateCanvas.includes('loadGlamourTemplateRenderAssets') &&
      templateCanvas.includes('renderAssets') &&
      templateCanvas.includes('loadRenderAssets') &&
      templateCanvas.includes("options.renderData.value.requiredAssets.join('|')") &&
      templateCanvas.includes('assets: renderAssets.value') &&
      !templateCanvas.includes('renderGlamourTemplateCanvasFallback') &&
      imageProcessing.includes('drawGlamourTemplateImageCover') &&
      !templateWorkspace.includes('function drawGlamourTemplateImageCover') &&
      templateCanvas.includes('iconImages') &&
      templateCanvas.includes('preloadIcons') &&
      templateCanvas.includes('shouldPreloadIcons') &&
      templateCanvas.includes("renderMode === 'ec' || renderMode === 'risingstones'") &&
      templateCanvas.includes('resolveIcon: getIcon') &&
      !templateCanvas.includes('function drawTemplateCanvasFallback') &&
      !templateCanvas.includes('function drawImageCover'),
    'template canvas composable must keep the V2 renderer, font, asset, and icon-loading boundary outside the Vue workspace component'
  )
  assert(
    renderData.includes('GLAMOUR_TEMPLATE_PREVIEW_MAX_EDGE = 1920') &&
      renderData.includes('createGlamourTemplatePreviewRenderData') &&
      renderData.includes('scaleTemplateImageSlot') &&
      templateWorkspace.includes(':width="previewCanvasSize.width"') &&
      templateWorkspace.includes(':height="previewCanvasSize.height"') &&
      templateCanvas.includes('createGlamourTemplatePreviewRenderData') &&
      templateCanvas.includes('window.requestAnimationFrame') &&
      templateCanvas.includes('document.createElement(\'canvas\')') &&
      templateCanvas.includes('const renderData = options.renderData.value') &&
      glamourApi.includes('SEARCH_CACHE_LIMIT = 80') &&
      glamourApi.includes('SEARCH_CACHE_TTL_MS = 5 * 60 * 1000') &&
      glamourApi.includes('makeSearchCacheKey') &&
      glamourApi.includes('rememberSearchResults') &&
      glamourApi.includes("cache: 'force-cache'"),
    'template preview performance boundary must retain scaled previews, original-size exports, frame batching, and bounded search/stain caching'
  )
  assert(
    assets.includes('GLAMOUR_TEMPLATE_RENDER_ASSET_URLS') &&
      assets.includes('GlamourTemplateRenderAssetUrlMap') &&
      assets.includes('resolveGlamourTemplateRenderAssetUrl') &&
      assets.includes('loadGlamourTemplateRenderAssets') &&
      assets.includes('new Image()') &&
      assets.includes("'figma-background': '/data/glamour/templates/eorzea-magazine.png'") &&
      assets.includes("'horizontal-background': '/data/glamour/templates/eorzea-horizontal-magazine-bg.png'") &&
      assets.includes("'double-pic-left-mask': '/data/glamour/templates/double-pic-left-mask.png'") &&
      assets.includes("'silence-fashion-background': '/data/glamour/templates/silence-fashion-background.png'") &&
      assets.includes("'clear-dye-icon': '/data/glamour/templates/com_icon_clear.svg'") &&
      !assets.includes('template-preview') &&
      !assets.includes('.psd') &&
      !assets.includes('Codia'),
    'template render assets must only expose confirmed public runtime backgrounds and masks through the V2 lazy-load boundary'
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
    templateLanguageControls.includes('templateImportPreferredLocale') &&
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
    templateLanguageControls.includes('toggleTemplateLocale') &&
      templateLanguageControls.includes("const displayOrder: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']") &&
      templateLanguageControls.includes('getLanguageRank(left.locales)') &&
      templateSelectorDialog.includes("const languageOrder: GlamourLocale[] = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']") &&
      templateSelectorDialog.includes('sortLanguageOptions(option.languageOptions)') &&
      templateSelectorDialog.includes('[...option.localeOrder]') &&
      !templateEditorSource.includes('languageSettingRows') &&
      !templateEditorSource.includes('moveTemplateLocale') &&
      !templateEditorSource.includes('removeTemplateLocale') &&
      !templateEditorSource.includes('nsglamour-template__language-order-controls'),
    'template workspace must keep fixed language display order without exposing extra language order controls'
  )
  assert(
    !templateSelectorDialog.includes('nsglamourTemplateSelectorHint'),
    'template selector must not show extra V2-only hint text that is absent from legacy /template'
  )
  assert(
    !/<div class="nsglamour-template__item-body">[\s\S]*?\{\{\s*row\.dyeText\s*\}\}/.test(templateEditorSource) &&
      !templateEditorSource.includes('dyeText: templateRow?.dyeText') &&
      !templateEditorSource.includes('hasDyeLine: templateRow?.hasDyeLine'),
    'template editor must not expose renderer-only dye summary lines'
  )
  assert(
    templateImageSource.includes('ref="templateCanvasEl"') &&
      templateImageSource.includes('nsglamour-template__canvas-upload-layer') &&
      templateImageSource.includes('downloadTemplateCanvas') &&
      templateImageSource.includes('queueImageFiles') &&
      templateImageSource.includes('openImageUploadMenu') &&
      templateImageSource.includes('nsglamour-template__image-menu') &&
      templateImageSource.includes('nsglamourTemplateRecentImages') &&
      templateImageSource.includes('recentTemplateImages') &&
      templateImageSource.includes('storeRecentTemplateImage') &&
      templateImageSource.includes('createGlamourTemplateImageCoverDataUrl') &&
      templateImageSource.includes('saveGlamourTemplateRecentImage') &&
      templateImageSource.includes('loadGlamourTemplateRecentImages') &&
      templateImageSource.includes('clearStoredGlamourTemplateRecentImages') &&
      templateImageSource.includes('useRecentTemplateImage') &&
      templateImageSource.includes('record.thumbnailUrl') &&
      templateImageSource.includes('record.imageName') &&
      templateCanvas.includes('renderGlamourTemplateCanvas') &&
      templateImageSource.includes('restoreCurrentTemplateImages') &&
      templateImageSource.includes('templateImagesById') &&
      templateImageSource.includes('saveCurrentTemplateRuntimeImages') &&
      templateImageSource.includes('applyTemplateRuntimeImages') &&
      templateImageSource.includes('carryTemplateImagesIntoCurrentTemplate') &&
      templateImageSource.includes('makeTemplateImageForSlotFromSource') &&
      templateImageSource.includes('const sourceUrl = sourceImage.sourceUrl || sourceImage.imageUrl') &&
      templateImageSource.includes('createGlamourTemplateImageCoverDataUrl(source, rect.width, rect.height)') &&
      /makeTemplateImageForSlotFromSource[\s\S]*?backupOnly:\s*false/.test(templateImageSource) &&
      templateImageSource.includes('loadGlamourTemplateImageStoreRecords') &&
      templateImageSource.includes('saveGlamourTemplateImageStoreSlot') &&
      templateImageSource.includes('restoreCurrentTemplateImagesFromStore') &&
      templateImageSource.includes('normalizeGlamourDraggedImageUrl') &&
      templateImageSource.includes('getGlamourDroppedImageUrl') &&
      templateImageSource.includes('setTemplateImageFromUrl') &&
      templateCropDialog.includes('nsglamour-template-crop') &&
      templateImageSource.includes('openImageCropper') &&
      templateImageSource.includes('applyImageCrop') &&
      templateCropDialog.includes('resetCrop') &&
      templateCropDialog.includes("output.toDataURL('image/png')") &&
      templateCropDialog.includes('canvasDisplayStyle') &&
      templateCropDialog.includes('getAspectRatio') &&
      templateCropDialog.includes('props.slot.aspectRatio') &&
      templateCropDialog.includes("window.addEventListener('resize', updateViewportSize)") &&
      templateCropDialog.includes('width: 100%;\n  height: 100%;') &&
      !templateCropDialog.includes('max-height: min(62vh, 620px);') &&
      templateImageSource.includes('writeGlamourTemplateImageSessionSlot') &&
      templateImageSource.includes('findGlamourTemplateImageSessionRecord') &&
      templateImageSource.includes('let nearestSlotId = activeImageSlotId.value') &&
      templateImageSource.includes('let nearestDistance = Number.POSITIVE_INFINITY') &&
      templateImageSource.includes('for (let index = slots.length - 1; index >= 0; index -= 1)') &&
      templateImageSource.includes('handleTemplateDocumentDragEvent') &&
      templateImageSource.includes('getTemplateDocumentDragTargets') &&
      templateImageSource.includes("['dragenter', 'dragover', 'dragleave', 'drop']") &&
      templateImageSource.includes('target.addEventListener(eventName') &&
      templateImageSource.includes('target.removeEventListener(eventName') &&
      templateImageSource.includes('capture: true') &&
      templateImageSource.includes('previewResizeObserver') &&
      templateImageSource.includes('updatePreviewSize') &&
      templateImageSource.includes('previewSize.height * aspectRatio') &&
      templateImageSource.includes('redrawTemplateCanvasAfterPageResume') &&
      templateImageSource.includes('canvasResumeRenderFrame') &&
      templateImageSource.includes("document.addEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes("window.addEventListener('pageshow', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes("window.addEventListener('focus', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes("document.removeEventListener('visibilitychange', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes("window.removeEventListener('pageshow', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes("window.removeEventListener('focus', redrawTemplateCanvasAfterPageResume)") &&
      templateImageSource.includes('closeFloatingTemplatePanels') &&
      templateImageSource.includes("window.addEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)") &&
      templateImageSource.includes("window.removeEventListener('nsglamour:header-popover-open', closeFloatingTemplatePanels)") &&
      !templateImageSource.includes('width: min(100%, 760px)') &&
      !templateImageSource.includes('nsglamour-template__preview-row'),
    'template workspace must use the legacy canvas/upload/crop surface, runtime image cache, carry-forward switching, IndexedDB image store, resume redraw, header popover cleanup, and same-tab image backup instead of the temporary DOM preview rows'
  )
  assert(
    templateSelectorDialog.includes('getCardTitle') &&
      templateSelectorDialog.includes("getLanguageLabels(option).join(' ')") &&
      templateSelectorDialog.includes('getPreviewUrl') &&
      templateSelectorDialog.includes('/data/glamour/template-preview/') &&
      templateSelectorDialog.includes('legacyPreviewPath') &&
      templateSelectorDialog.includes('nsglamourTemplateSelectorCardTitle') &&
      templateSelectorDialog.includes('loading="lazy"') &&
      !templateSelectorDialog.includes('{{ option.sourceWidth }}'),
    'template selector cards must preserve the legacy preview image and author/summary/supported-language title'
  )
  assert(
    templateComposable.includes('selectedLocales.value.includes(draftLocale)') &&
      templateWorkspace.includes("'update-locale': [locale: string]") &&
      templateLanguageControls.includes('function setActiveLocale') &&
      templateLanguageControls.includes('setNormalizedLocales([...selected, locale])') &&
      templateLanguageControls.includes('options.activeLocale.value !== locale') &&
      templateLanguageControls.includes('watch(\n    options.activeLocale') &&
      templateLanguageControls.includes('options.activeLocale.value || options.draftLocale.value') &&
      templateWorkspace.includes(':editor-locale="editorLocale"') &&
      equipmentSearchComposable.includes('locale: options.editorLocale.value'),
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
      !templateImportDialog.includes('type="url"'),
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
      normalizeTemplateLocaleOrder(resolveLegacyLocaleOrder(legacyBlock)),
      `template ${templateId} localeOrder must use the V2 template display order while preserving legacy-supported locales`
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

function validateTemplateImageSlotRegions(definitions, legacyDefinitions, legacyTemplate) {
  for (const templateId of TEMPLATE_IDS) {
    const v2Block = extractObjectBlock(definitions, templateId)
    const legacyBlock = extractObjectBlock(legacyDefinitions, templateId)
    const v2Slots = extractImageSlotBlocks(v2Block, legacyTemplate)
    const legacySlots = extractImageSlotBlocks(legacyBlock, legacyTemplate)

    assert(
      v2Slots.length === legacySlots.length,
      `template ${templateId} image slot count must match legacy /template`
    )

    for (let index = 0; index < legacySlots.length; index += 1) {
      assertTemplateSlotRect(v2Slots[index], legacySlots[index], legacyTemplate, templateId, index, 'region')
      assertTemplateOptionalSlotRect(v2Slots[index], legacySlots[index], legacyTemplate, templateId, index, 'uploadRegion')
      assertTemplateOptionalSlotRect(v2Slots[index], legacySlots[index], legacyTemplate, templateId, index, 'dropRegion')
    }
  }
}

function validateTemplateEquipmentFormats(definitions, legacyDefinitions, legacyTemplate) {
  for (const templateId of TEMPLATE_IDS) {
    const v2Format = extractObjectPropertyBlock(extractObjectBlock(definitions, templateId), 'equipmentFormat')
    const legacyFormat = extractObjectPropertyBlock(extractObjectBlock(legacyDefinitions, templateId), 'equipmentFormat')
    const v2ItemName = extractObjectPropertyBlock(v2Format, 'itemName')
    const legacyItemName = extractObjectPropertyBlock(legacyFormat, 'itemName')
    const v2Dye = extractObjectPropertyBlock(v2Format, 'dye')
    const legacyDye = extractObjectPropertyBlock(legacyFormat, 'dye')

    assertSameStringProperty(v2Format, legacyFormat, 'source', `template ${templateId} equipmentFormat`)
    assertSameOptionalNumericPropertyResolved(
      v2Format,
      legacyFormat,
      'maxRows',
      legacyTemplate,
      `template ${templateId} equipmentFormat`
    )

    for (const property of ['wrap', 'shrink', 'shrinkOnOverflow', 'inlineDye']) {
      assertSameOptionalBooleanProperty(v2ItemName, legacyItemName, property, `template ${templateId} itemName`)
    }
    assertSameOptionalNumericPropertyResolved(v2ItemName, legacyItemName, 'minScale', legacyTemplate, `template ${templateId} itemName`)

    assertSameStringProperty(v2Dye, legacyDye, 'mode', `template ${templateId} dye`)
    for (const property of [
      'includeAccessories',
      'showWhenDyeCountZero',
      'showEmptySlots',
      'stripDyeSuffix',
      'reserveLineHeight'
    ]) {
      assertSameOptionalBooleanProperty(v2Dye, legacyDye, property, `template ${templateId} dye`)
    }
    for (const property of ['maxSlots', 'forceSlotCount']) {
      assertSameOptionalNumericPropertyResolved(v2Dye, legacyDye, property, legacyTemplate, `template ${templateId} dye`)
    }
    assertSameOptionalStringProperty(v2Dye, legacyDye, 'separator', `template ${templateId} dye`)
  }
}

function assertTemplateSlotRect(v2Slot, legacySlot, legacyTemplate, templateId, slotIndex, property) {
  assertSameNumericPropertiesResolved(
    extractRectPropertyBlock(v2Slot, property, legacyTemplate),
    extractRectPropertyBlock(legacySlot, property, legacyTemplate),
    ['x', 'y', 'width', 'height'],
    `template ${templateId} imageSlots[${slotIndex}].${property}`,
    legacyTemplate
  )
}

function extractImageSlotBlocks(block, legacyTemplate) {
  const literal = new RegExp('imageSlots\\s*:\\s*\\[', 'm').exec(block)

  if (literal) {
    return extractObjectArrayPropertyBlocks(block, 'imageSlots')
  }

  const reference = block.match(/imageSlots\s*:\s*([A-Z0-9_]+)/m)
  assert(reference, 'template block must include imageSlots')
  return extractObjectArrayBlocks(extractAssignedArrayBlock(legacyTemplate, reference[1]))
}

function assertTemplateOptionalSlotRect(v2Slot, legacySlot, legacyTemplate, templateId, slotIndex, property) {
  const v2HasProperty = hasObjectLikeProperty(v2Slot, property)
  const legacyHasProperty = hasObjectLikeProperty(legacySlot, property)

  assert(
    v2HasProperty === legacyHasProperty,
    `template ${templateId} imageSlots[${slotIndex}].${property} presence must match legacy /template`
  )

  if (!legacyHasProperty) {
    return
  }

  assertTemplateSlotRect(v2Slot, legacySlot, legacyTemplate, templateId, slotIndex, property)
}

function validateTemplateImageSlots(imageSlots, legacyDefinitions) {
  const recentImageRecordBlock = extractInterfaceBlock(imageSlots, 'GlamourTemplateRecentImageRecord')

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
    recentImageRecordBlock.includes('imageName: string') &&
      recentImageRecordBlock.includes('thumbnailUrl: string') &&
      recentImageRecordBlock.includes('blob: Blob') &&
      recentImageRecordBlock.includes('updatedAt: number') &&
      !/\b(path|filePath|sourceUrl|sourceName)\b/.test(recentImageRecordBlock),
    'template recent-image stash records must only expose thumbnail, file name, time, and local Blob; no paths or source metadata'
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
      withV2ClearDyeAsset(renderMode, extractLegacyRenderAssets(legacyBlock)),
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

function validateEcTemplateColors(renderer, legacyTemplate) {
  const legacyColors = extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_COLORS')
  const v2Colors = extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_COLORS')

  for (const property of ['background', 'row', 'rowDeep', 'accent', 'text', 'textDim', 'line', 'placeholder']) {
    assert(
      extractStringProperty(v2Colors, property).toLowerCase() === extractStringProperty(legacyColors, property).toLowerCase(),
      `EC template color ${property} must match legacy /template`
    )
  }
}

function validateCanvasRendererConstants(renderer, legacyTemplate) {
  const v2Eorzea = extractAssignedObjectBlock(renderer, 'EORZEA_TEMPLATE')
  assert(
    extractNumericProperty(v2Eorzea, 'sourceSize') === extractAssignedNumber(legacyTemplate, 'FIGMA_SOURCE_SIZE'),
    'Eorzea template sourceSize must match legacy /template'
  )
  assert(
    extractStringProperty(v2Eorzea, 'maskFill').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'FIGMA_MASK_FILL').toLowerCase(),
    'Eorzea template maskFill must match legacy /template'
  )
  assert(
    extractStringProperty(v2Eorzea, 'textColor').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'FIGMA_TEXT_COLOR').toLowerCase(),
    'Eorzea template textColor must match legacy /template'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Eorzea, 'titleMask'),
    extractAssignedObjectBlock(legacyTemplate, 'FIGMA_TITLE_MASK'),
    ['x', 'y', 'width', 'height'],
    'Eorzea title mask'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Eorzea, 'titleText'),
    extractAssignedObjectBlock(legacyTemplate, 'FIGMA_TITLE_TEXT'),
    ['right', 'baselineY', 'width', 'maxSize', 'minSize'],
    'Eorzea title text'
  )
  assert(
    extractNumericProperty(v2Eorzea, 'titleTracking') === extractAssignedNumber(legacyTemplate, 'FIGMA_TITLE_TRACKING'),
    'Eorzea titleTracking must match legacy /template'
  )
  assert(
    extractNumericProperty(v2Eorzea, 'itemNameTracking') === extractAssignedNumber(legacyTemplate, 'FIGMA_ITEM_NAME_TRACKING'),
    'Eorzea itemNameTracking must match legacy /template'
  )
  const v2EorzeaLayouts = extractObjectPropertyBlock(v2Eorzea, 'layouts')
  const legacyEorzeaLayouts = extractAssignedObjectBlock(legacyTemplate, 'FIGMA_EQUIPMENT_LAYOUTS')
  for (const layoutName of ['roomy', 'sixRows', 'compact']) {
    const v2Layout = extractObjectPropertyBlock(v2EorzeaLayouts, layoutName)
    const legacyLayout = extractObjectPropertyBlock(legacyEorzeaLayouts, layoutName)
    assertSameNumericArray(
      extractNumericArrayProperty(v2Layout, 'rowY'),
      extractNumericArrayProperty(legacyLayout, 'rowY'),
      `Eorzea ${layoutName}.rowY must match legacy /template`
    )
    assertSameNumericArray(
      extractNumericArrayProperty(v2Layout, 'dyeX'),
      extractNumericArrayProperty(legacyLayout, 'dyeX'),
      `Eorzea ${layoutName}.dyeX must match legacy /template`
    )
    assertSameNumericProperties(
      v2Layout,
      legacyLayout,
      [
        'nameX',
        'nameWidth',
        'nameSize',
        'lineHeight',
        'dyeYOffset',
        'dyeWidth',
        'dyeHeight',
        'dyeRadius',
        'dyeTextWidth',
        'dyeTextXOffset',
        'dyeTextYOffset',
        'dyeFontSize'
      ],
      `Eorzea ${layoutName}`
    )
  }

  const v2Horizontal = extractAssignedObjectBlock(renderer, 'HORIZONTAL_TEMPLATE')
  const legacyHorizontalEquipment = extractAssignedObjectBlock(legacyTemplate, 'HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT')
  const legacyHorizontalTitle = extractAssignedObjectBlock(legacyTemplate, 'HORIZONTAL_TEMPLATE_TITLE')
  const legacyHorizontalTitleLine = extractAssignedObjectBlock(legacyTemplate, 'HORIZONTAL_TEMPLATE_TITLE_LINE')
  const legacyHorizontalContentGroup = extractAssignedObjectBlock(legacyTemplate, 'HORIZONTAL_TEMPLATE_CONTENT_GROUP')

  assert(
    extractNumericProperty(v2Horizontal, 'sourceWidth') === extractAssignedNumber(legacyTemplate, 'HORIZONTAL_TEMPLATE_SOURCE_WIDTH'),
    'horizontal template sourceWidth must match legacy /template'
  )
  assert(
    extractNumericProperty(v2Horizontal, 'sourceHeight') === extractAssignedNumber(legacyTemplate, 'HORIZONTAL_TEMPLATE_SOURCE_HEIGHT'),
    'horizontal template sourceHeight must match legacy /template'
  )
  assert(
    extractStringProperty(v2Horizontal, 'textColor').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'HORIZONTAL_TEMPLATE_TEXT_COLOR').toLowerCase(),
    'horizontal template textColor must match legacy /template'
  )
  assertSameArray(
    extractArrayProperty(v2Horizontal, 'lineColors').map((color) => color.toLowerCase()),
    extractQuotedArray(legacyTemplate, 'HORIZONTAL_TEMPLATE_LINE_COLORS').map((color) => color.toLowerCase()),
    'horizontal template lineColors must match legacy /template'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Horizontal, 'equipmentText'),
    legacyHorizontalEquipment,
    [
      'x',
      'y',
      'width',
      'height',
      'itemSize',
      'dyeSize',
      'itemLineHeight',
      'dyeLineHeight',
      'itemInkHeight',
      'dyeInkHeight',
      'topPadding',
      'groupGap'
    ],
    'horizontal equipment text'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Horizontal, 'title'),
    legacyHorizontalTitle,
    ['x', 'y', 'width', 'height', 'size', 'clipBleedTop', 'clipBleedBottom'],
    'horizontal title'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Horizontal, 'titleLine'),
    legacyHorizontalTitleLine,
    ['x', 'y', 'width', 'height'],
    'horizontal title line'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Horizontal, 'contentGroup'),
    legacyHorizontalContentGroup,
    ['top', 'bottom'],
    'horizontal content group'
  )

  const v2DoublePic = extractAssignedObjectBlock(renderer, 'DOUBLE_PIC_TEMPLATE')
  const legacyDoublePicEquipment = extractAssignedObjectBlock(legacyTemplate, 'STORY_TEMPLATE_EQUIPMENT_TEXT')
  const legacyDoublePicCopyrightRect = extractAssignedObjectBlock(legacyTemplate, 'DOUBLE_PIC_COPYRIGHT_RECT')
  const legacyDoublePicCopyrightStyle = extractAssignedObjectBlock(legacyTemplate, 'DOUBLE_PIC_COPYRIGHT_TEXT_STYLE')
  const v2DoublePicEquipment = extractObjectPropertyBlock(v2DoublePic, 'equipment')
  const v2DoublePicCopyright = extractObjectPropertyBlock(v2DoublePic, 'copyright')

  assert(
    extractNumericProperty(v2DoublePic, 'sourceWidth') === extractAssignedNumber(legacyTemplate, 'DOUBLE_PIC_SOURCE_WIDTH'),
    'Double Pic sourceWidth must match legacy /template'
  )
  assert(
    extractNumericProperty(v2DoublePic, 'sourceHeight') === extractAssignedNumber(legacyTemplate, 'DOUBLE_PIC_SOURCE_HEIGHT'),
    'Double Pic sourceHeight must match legacy /template'
  )
  assert(
    extractStringProperty(v2DoublePic, 'background').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'STORY_TEMPLATE_BACKGROUND_COLOR').toLowerCase(),
    'Double Pic background must match legacy /template'
  )
  assert(
    extractStringProperty(v2DoublePic, 'frameBlack').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'STORY_TEMPLATE_FRAME_BLACK').toLowerCase(),
    'Double Pic frameBlack must match legacy /template'
  )
  assert(
    extractStringProperty(v2DoublePic, 'frameWhite').toLowerCase() ===
      extractAssignedString(legacyTemplate, 'STORY_TEMPLATE_FRAME_WHITE').toLowerCase(),
    'Double Pic frameWhite must match legacy /template'
  )
  assert(
    extractNumericProperty(v2DoublePic, 'fontWeight') === extractAssignedNumber(legacyTemplate, 'STORY_TEMPLATE_FONT_WEIGHT'),
    'Double Pic fontWeight must match legacy /template'
  )
  assertSameNumericProperties(
    v2DoublePicEquipment,
    legacyDoublePicEquipment,
    [
      'x',
      'y',
      'width',
      'height',
      'maxFontSize',
      'lineHeightRatio',
      'underlineOffsetRatio',
      'underlineWidth',
      'outerGlowOpacity',
      'outerGlowSpread',
      'outerGlowSize'
    ],
    'Double Pic equipment text'
  )
  assert(
    extractStringProperty(v2DoublePicEquipment, 'outerGlowColor').toLowerCase() ===
      extractStringProperty(legacyDoublePicEquipment, 'outerGlowColor').toLowerCase(),
    'Double Pic equipment outerGlowColor must match legacy /template'
  )
  assert(
    extractStringProperty(v2DoublePicCopyright, 'text') === extractAssignedString(legacyTemplate, 'DOUBLE_PIC_COPYRIGHT_TEXT'),
    'Double Pic copyright text must match legacy /template'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2DoublePicCopyright, 'rect'),
    legacyDoublePicCopyrightRect,
    ['x', 'y', 'width', 'height'],
    'Double Pic copyright rect'
  )
  assertSameNumericProperties(
    v2DoublePicCopyright,
    legacyDoublePicCopyrightStyle,
    ['maxFontSize', 'minFontSize'],
    'Double Pic copyright text style'
  )

  validateEcCanvasConstants(renderer, legacyTemplate)
  validateRisingstonesCanvasConstants(renderer, legacyTemplate)

  const v2SilenceFashion = extractAssignedObjectBlock(renderer, 'SILENCE_FASHION_TEMPLATE')
  const legacySilenceFashion = extractAssignedObjectBlock(legacyTemplate, 'SILENCE_FASHION_TEMPLATE')
  assertSameNumericProperties(
    v2SilenceFashion,
    legacySilenceFashion,
    ['sourceSize', 'equipmentBottom', 'equipmentRight'],
    'Silence Fashion template'
  )
  assert(
    extractStringProperty(v2SilenceFashion, 'textColor').toLowerCase() ===
      extractStringProperty(legacySilenceFashion, 'textColor').toLowerCase(),
    'Silence Fashion textColor must match legacy /template'
  )
  for (const property of ['imageRegion', 'avatarRegion']) {
    assertSameNumericProperties(
      extractObjectPropertyBlock(v2SilenceFashion, property),
      extractObjectPropertyBlock(legacySilenceFashion, property),
      ['x', 'y', 'width', 'height'],
      `Silence Fashion ${property}`
    )
  }
  for (const property of ['character', 'title']) {
    assertSameNumericProperties(
      extractObjectPropertyBlock(v2SilenceFashion, property),
      extractObjectPropertyBlock(legacySilenceFashion, property),
      ['x', 'y', 'width', 'size', 'minSize', 'weight'],
      `Silence Fashion ${property}`
    )
  }
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2SilenceFashion, 'zh'),
    extractObjectPropertyBlock(legacySilenceFashion, 'zh'),
    [
      'maxRows',
      'itemX',
      'dyeX',
      'width',
      'y',
      'bottom',
      'rowStep',
      'itemSize',
      'dyeSize',
      'itemLineHeight',
      'dyeLineHeight',
      'groupGap',
      'weight',
      'dyeYOffset'
    ],
    'Silence Fashion zh equipment'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2SilenceFashion, 'enJa'),
    extractObjectPropertyBlock(legacySilenceFashion, 'enJa'),
    [
      'maxRows',
      'itemX',
      'dyeX',
      'width',
      'y',
      'bottom',
      'rowStep',
      'jaSize',
      'enSize',
      'dyeSize',
      'jaLineHeight',
      'enLineHeight',
      'dyeLineHeight',
      'lineGap',
      'groupGap',
      'weight'
    ],
    'Silence Fashion enJa equipment'
  )
}

function validateEcCanvasConstants(renderer, legacyTemplate) {
  const v2Ec = {
    sourceSize: extractAssignedNumber(renderer, 'EC_TEMPLATE_SOURCE_SIZE'),
    colors: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_COLORS'),
    rarityColors: extractAssignedObjectBlock(renderer, 'EC_ITEM_RARITY_COLORS'),
    title: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_TITLE'),
    subtitle: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_SUBTITLE'),
    header: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_EQUIPMENT_HEADER'),
    copyright: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_COPYRIGHT'),
    cornerMarks: extractAssignedArrayBlock(renderer, 'EC_TEMPLATE_CORNER_MARKS'),
    layouts: extractAssignedObjectBlock(renderer, 'EC_TEMPLATE_LAYOUTS')
  }
  const legacyEc = {
    sourceSize: extractAssignedNumber(legacyTemplate, 'EC_TEMPLATE_SOURCE_SIZE'),
    colors: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_COLORS'),
    rarityColors: extractAssignedObjectBlock(legacyTemplate, 'EC_ITEM_RARITY_COLORS'),
    title: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_TITLE'),
    subtitle: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_SUBTITLE'),
    header: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_EQUIPMENT_HEADER'),
    copyright: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_COPYRIGHT'),
    cornerMarks: extractAssignedArrayBlock(legacyTemplate, 'EC_TEMPLATE_CORNER_MARKS'),
    layouts: extractAssignedObjectBlock(legacyTemplate, 'EC_TEMPLATE_LAYOUTS')
  }

  assert(v2Ec.sourceSize === legacyEc.sourceSize, 'EC template source size must match legacy /template')

  for (const property of ['background', 'row', 'rowDeep', 'accent', 'text', 'textDim', 'line', 'placeholder']) {
    assert(
      extractStringProperty(v2Ec.colors, property).toLowerCase() ===
        extractStringProperty(legacyEc.colors, property).toLowerCase(),
      `EC template color ${property} must match legacy /template`
    )
  }

  for (const property of ['1', '2', '3', '4', '7']) {
    assert(
      extractStringProperty(v2Ec.rarityColors, property).toLowerCase() ===
        extractStringProperty(legacyEc.rarityColors, property).toLowerCase(),
      `EC template rarity color ${property} must match legacy /template`
    )
  }

  assertSameNumericProperties(
    v2Ec.title,
    legacyEc.title,
    ['x', 'y', 'width', 'height', 'maxSize', 'minSize', 'tracking'],
    'EC title'
  )
  assertSameNumericProperties(
    v2Ec.subtitle,
    legacyEc.subtitle,
    ['x', 'y', 'width', 'height', 'maxSize', 'minSize'],
    'EC subtitle'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Ec.header, 'label'),
    extractObjectPropertyBlock(legacyEc.header, 'label'),
    ['x', 'y', 'width', 'height'],
    'EC equipment header label'
  )
  assertSameNumericProperties(
    extractObjectPropertyBlock(v2Ec.header, 'line'),
    extractObjectPropertyBlock(legacyEc.header, 'line'),
    ['x', 'y', 'width', 'height'],
    'EC equipment header line'
  )
  assertSameNumericProperties(v2Ec.header, legacyEc.header, ['labelSize', 'labelLineGap'], 'EC equipment header')
  assertSameNumericProperties(
    v2Ec.copyright,
    legacyEc.copyright,
    ['x', 'y', 'width', 'height', 'titleSize', 'textSize'],
    'EC copyright'
  )
  assertSameNumericArray(
    extractNumericArrayProperty(v2Ec.copyright, 'lineY'),
    extractNumericArrayProperty(legacyEc.copyright, 'lineY'),
    'EC copyright lineY must match legacy /template'
  )

  for (const index of [0, 1]) {
    assertSameNumericProperties(
      extractObjectArrayBlock(v2Ec.cornerMarks, index),
      extractObjectArrayBlock(legacyEc.cornerMarks, index),
      ['x', 'y', 'size'],
      `EC corner mark ${index}`
    )
  }

  for (const layoutName of ['normal', 'dense', 'compact']) {
    const v2Layout = extractObjectPropertyBlock(v2Ec.layouts, layoutName)
    const legacyLayout = extractObjectPropertyBlock(legacyEc.layouts, layoutName)
    assertSameNumericArray(
      extractNumericArrayProperty(v2Layout, 'rowY'),
      extractNumericArrayProperty(legacyLayout, 'rowY'),
      `EC ${layoutName}.rowY must match legacy /template`
    )
    assertSameNumericProperties(
      v2Layout,
      legacyLayout,
      [
        'maxRows',
        'rowX',
        'rowWidth',
        'rowHeight',
        'rowRadius',
        'iconX',
        'iconYOffset',
        'iconSize',
        'iconRadius',
        'nameX',
        'nameWidth',
        'nameHeight',
        'nameSize',
        'nameMinSize',
        'nameWeight',
        'dyeYOffset',
        'dyeHeight',
        'dyeRadius',
        'dyeFontSize',
        'dyeDotSize',
        'dyeDotXOffset',
        'dyeTextXOffset',
        'dyeTextYOffset',
        'dyeGap'
      ],
      `EC ${layoutName}`
    )
    for (const index of [0, 1]) {
      assertSameNumericProperties(
        extractObjectArrayPropertyBlock(v2Layout, 'dyes', index),
        extractObjectArrayPropertyBlock(legacyLayout, 'dyes', index),
        ['x', 'minWidth'],
        `EC ${layoutName}.dyes[${index}]`
      )
    }
  }
}

function validateRisingstonesCanvasConstants(renderer, legacyTemplate) {
  const v2 = extractAssignedObjectBlock(renderer, 'RISINGSTONES_TEMPLATE')
  const legacy = extractAssignedObjectBlock(legacyTemplate, 'RISINGSTONES_TEMPLATE')

  assertSameNumericProperties(
    v2,
    legacy,
    ['sourceSize', 'backgroundStrokeWidth', 'imageRadius', 'imageStrokeWidth', 'avatarRadius', 'avatarStrokeWidth'],
    'Risingstones template'
  )
  assert(
    extractStringProperty(v2, 'background').toLowerCase() === extractStringProperty(legacy, 'background').toLowerCase(),
    'Risingstones background must match legacy /template'
  )
  assert(
    extractStringProperty(v2, 'borderColor').toLowerCase() === extractStringProperty(legacy, 'borderColor').toLowerCase(),
    'Risingstones borderColor must match legacy /template'
  )
  assert(
    extractStringProperty(v2, 'imagePlaceholder').toLowerCase() ===
      extractStringProperty(legacy, 'imagePlaceholder').toLowerCase(),
    'Risingstones imagePlaceholder must match legacy /template'
  )
  assert(
    (extractOptionalStringProperty(v2, 'sourceText') || '最终幻想14 - FINAL FANTASY XIV') ===
      (extractOptionalStringProperty(legacy, 'sourceText') || '最终幻想14 - FINAL FANTASY XIV'),
    'Risingstones sourceText fallback must match legacy /template'
  )
  assert(
    extractBooleanProperty(v2, 'showMeta', true) === extractBooleanProperty(legacy, 'showMeta', true),
    'Risingstones showMeta must match legacy /template'
  )

  for (const property of ['imageRegion', 'avatarRegion']) {
    assertSameNumericProperties(
      extractObjectPropertyBlock(v2, property),
      extractObjectPropertyBlock(legacy, property),
      ['x', 'y', 'width', 'height'],
      `Risingstones ${property}`
    )
  }
  for (const property of ['title', 'author', 'source']) {
    assertSameNumericProperties(
      extractObjectPropertyBlock(v2, property),
      extractObjectPropertyBlock(legacy, property),
      ['x', 'y', 'width', 'height', 'maxSize', 'minSize'],
      `Risingstones ${property}`
    )
  }

  for (const index of [0, 1, 2]) {
    const v2Meta = extractObjectArrayPropertyBlock(v2, 'meta', index)
    const legacyMeta = extractObjectArrayPropertyBlock(legacy, 'meta', index)
    assertSameNumericProperties(v2Meta, legacyMeta, ['x', 'y', 'width', 'height'], `Risingstones meta[${index}]`)
    assert(
      extractStringProperty(v2Meta, 'key') === extractStringProperty(legacyMeta, 'key'),
      `Risingstones meta[${index}].key must match legacy /template`
    )
  }

  const v2Equipment = extractObjectPropertyBlock(v2, 'equipment')
  const legacyEquipment = extractObjectPropertyBlock(legacy, 'equipment')
  assertSameNumericProperties(
    v2Equipment,
    legacyEquipment,
    [
      'maxRows',
      'rowStartY',
      'rowStep',
      'rowBottom',
      'rowX',
      'rowWidth',
      'rowHeight',
      'rowRadius',
      'iconX',
      'iconYOffset',
      'iconSize',
      'iconRadius',
      'nameX',
      'nameWidth',
      'nameYOffset',
      'nameHeight',
      'nameSize',
      'nameMinSize',
      'nameWeight',
      'dyeYOffset',
      'dyeHeight',
      'dyeFontSize',
      'dyeMinFontSize',
      'dyeDotSize',
      'dyeDotRadius',
      'dyeDotStrokeWidth',
      'dyeDotXOffset',
      'dyeTextXOffset',
      'dyeTextYOffset',
      'dyeTextHeight',
      'dyeTextWidth',
      'dyeTextRightPadding',
      'dyeGap'
    ],
    'Risingstones equipment'
  )
  assert(
    normalizeFontLiteral(extractStringProperty(v2Equipment, 'fontFamily')) ===
      normalizeFontLiteral(extractStringProperty(legacyEquipment, 'fontFamily')),
    'Risingstones equipment fontFamily must match legacy /template'
  )
  for (const index of [0, 1]) {
    assertSameNumericProperties(
      extractObjectArrayPropertyBlock(v2Equipment, 'dyes', index),
      extractObjectArrayPropertyBlock(legacyEquipment, 'dyes', index),
      ['x', 'minWidth'],
      `Risingstones equipment.dyes[${index}]`
    )
  }

  for (const property of ['textColor', 'textDim', 'accent', 'dyeText']) {
    assert(
      extractStringProperty(v2, property).toLowerCase() === extractStringProperty(legacy, property).toLowerCase(),
      `Risingstones ${property} must match legacy /template`
    )
  }

  assertSameNumericProperties(
    extractObjectPropertyBlock(v2, 'copyright'),
    extractObjectPropertyBlock(legacy, 'copyright'),
    ['x', 'y', 'width', 'height'],
    'Risingstones copyright'
  )
}

function validateTemplateSettingsDefaults(settings, legacyTemplate) {
  const legacyDefaults = extractAssignedObjectBlock(legacyTemplate, 'DEFAULT_TEMPLATE_SETTINGS')

  for (const property of ['textColor', 'panelColor']) {
    assert(
      settings.includes(`${property}: '${extractStringProperty(legacyDefaults, property)}'`),
      `template setting default ${property} must match legacy /template`
    )
  }
}

async function validateTemplatePublicAssets() {
  const assetFiles = [...TEMPLATE_RENDER_ASSET_FILES, ...TEMPLATE_PREVIEW_ASSET_FILES]
  const files = await Promise.all(
    assetFiles.map(async (filePath) => ({
      filePath,
      bytes: await readFile(resolve(filePath))
    }))
  )

  for (const file of files) {
    assert(file.bytes.length > 0, `template public asset must not be empty: ${file.filePath}`)
  }
}

function validateNsglamourVisibleText(uiLocaleSource) {
  const nsglamourBlock = extractNsglamourLocaleBlock(uiLocaleSource)
  const forbiddenVisiblePatterns = [
    { pattern: /模型码/u, label: '模型码' },
    { pattern: /候选数量/u, label: '候选数量' },
    { pattern: /个候选/u, label: 'X个候选' },
    { pattern: /未导入/u, label: '未导入' },
    { pattern: /(^|[^a-z0-9_])\.chara([^a-z0-9_]|$)/iu, label: '.chara' },
    { pattern: /chara\s*文件/iu, label: 'chara 文件' },
    { pattern: /model\s*code/iu, label: 'model code' }
  ]

  for (const { pattern, label } of forbiddenVisiblePatterns) {
    assert(
      !pattern.test(nsglamourBlock),
      `NSGlamour visible UI text must not expose internal import/debug wording: ${label}`
    )
  }

  assert(
    /'nsglamour\.locale\.zh'\s*:\s*same\('简体中文'\)/u.test(nsglamourBlock),
    'NSGlamour zh locale label must stay 简体中文'
  )
  assert(
    /'nsglamour\.equipment\.search\.placeholder'\s*:\s*msg\(\{[\s\S]*?zh:\s*'搜索装备名'/u.test(nsglamourBlock),
    'NSGlamour empty equipment/search placeholder must stay 搜索装备名'
  )
  assert(
    /'nsglamour\.equipment\.switchCandidate'\s*:\s*msg\(\{[\s\S]*?zh:\s*'切换匹配项'/u.test(nsglamourBlock) &&
      /'nsglamour\.equipment\.switchCandidate\.symbol'\s*:\s*same\('⇄'\)/u.test(nsglamourBlock),
    'NSGlamour candidate switch UI must preserve the legacy visible switch-match control without candidate counts'
  )
}

function extractNsglamourLocaleBlock(uiLocaleSource) {
  const start = uiLocaleSource.indexOf("'nsglamour.")
  assert(start >= 0, 'ui locale source must include nsglamour keys')
  return uiLocaleSource.slice(start)
}

function countSubstring(source, substring) {
  if (!substring) {
    return 0
  }

  return source.split(substring).length - 1
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

function extractNumericArrayProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'm'))
  assert(match, `template block must include numeric array property ${property}`)
  return Array.from(match[1].matchAll(/-?[0-9]+(?:\.[0-9]+)?/g)).map((entry) => Number(entry[0]))
}

function extractAssignedArrayBlock(source, name) {
  const pattern = new RegExp(`${escapeRegExp(name)}(?:\\s*:[^=]+)?\\s*=\\s*\\[`, 'm')
  const match = pattern.exec(source)
  assert(match, `source must assign array ${name}`)

  const openBracketIndex = source.indexOf('[', match.index)
  return extractBalancedBlock(source, openBracketIndex, '[', ']')
}

function extractObjectArrayPropertyBlock(block, property, index) {
  const blocks = extractObjectArrayPropertyBlocks(block, property)
  assert(blocks[index], `object array property ${property} must include index ${index}`)
  return blocks[index]
}

function extractObjectArrayPropertyBlocks(block, property) {
  const pattern = new RegExp(`${escapeRegExp(property)}\\s*:\\s*\\[`, 'm')
  const match = pattern.exec(block)
  assert(match, `object block must include object array property ${property}`)

  const openBracketIndex = block.indexOf('[', match.index)
  return extractObjectArrayBlocks(extractBalancedBlock(block, openBracketIndex, '[', ']'))
}

function extractObjectArrayBlock(arrayBlock, index) {
  const blocks = extractObjectArrayBlocks(arrayBlock)
  assert(blocks[index], `object array must include index ${index}`)
  return blocks[index]
}

function extractObjectArrayBlocks(arrayBlock) {
  const blocks = []

  for (let cursor = 0; cursor < arrayBlock.length; cursor += 1) {
    if (arrayBlock[cursor] !== '{') {
      continue
    }

    const objectBlock = extractBalancedBlock(arrayBlock, cursor, '{', '}')
    blocks.push(objectBlock)
    cursor += objectBlock.length - 1
  }

  return blocks
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

function extractObjectPropertyBlock(block, property) {
  const pattern = new RegExp(`${escapeRegExp(property)}\\s*:\\s*\\{`, 'm')
  const match = pattern.exec(block)
  assert(match, `object block must include object property ${property}`)

  const openBraceIndex = block.indexOf('{', match.index)
  return extractBalancedBlock(block, openBraceIndex, '{', '}')
}

function extractRectPropertyBlock(block, property, legacyTemplate) {
  const pattern = new RegExp(`${escapeRegExp(property)}\\s*:\\s*(\\{|[A-Za-z0-9_.]+)`, 'm')
  const match = pattern.exec(block)
  assert(match, `object block must include rect property ${property}`)

  if (match[1] === '{') {
    const openBraceIndex = block.indexOf('{', match.index)
    return extractBalancedBlock(block, openBraceIndex, '{', '}')
  }

  return resolveLegacyRectReference(legacyTemplate, match[1])
}

function resolveLegacyRectReference(legacyTemplate, reference) {
  if (reference === 'FIGMA_IMAGE_REGION' || reference === 'EC_TEMPLATE_IMAGE_REGION') {
    return extractAssignedObjectBlock(legacyTemplate, reference)
  }

  const nested = reference.match(/^(RISINGSTONES_TEMPLATE|SILENCE_FASHION_TEMPLATE)\.([A-Za-z0-9_]+)$/)
  if (nested) {
    return extractObjectPropertyBlock(extractAssignedObjectBlock(legacyTemplate, nested[1]), nested[2])
  }

  throw new Error(`unsupported legacy rect reference ${reference}`)
}

function hasObjectLikeProperty(block, property) {
  return new RegExp(`${escapeRegExp(property)}\\s*:\\s*(\\{|[A-Za-z0-9_.]+)`, 'm').test(block)
}

function extractObjectBlock(source, key) {
  const quotedKey = key.includes('-') ? `['"]${escapeRegExp(key)}['"]` : `(?:${escapeRegExp(key)}|['"]${escapeRegExp(key)}['"])`
  const pattern = new RegExp(`${quotedKey}\\s*:\\s*\\{`, 'm')
  const match = pattern.exec(source)
  assert(match, `template definitions must include ${key}`)

  const openBraceIndex = source.indexOf('{', match.index)
  return extractBalancedBlock(source, openBraceIndex, '{', '}')
}

function extractInterfaceBlock(source, name) {
  const pattern = new RegExp(`interface\\s+${escapeRegExp(name)}\\s*\\{`, 'm')
  const match = pattern.exec(source)
  assert(match, `source must include interface ${name}`)

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

function hasValueProperty(block, property) {
  return new RegExp(`${escapeRegExp(property)}\\s*:`, 'm').test(block)
}

function extractNumericProperty(block, property) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)`, 'm'))
  assert(match, `template block must include numeric property ${property}`)
  return Number(match[1])
}

function extractNumericPropertyResolved(block, property, source) {
  const match = block.match(new RegExp(`${escapeRegExp(property)}\\s*:\\s*([^,\\n}]+)`, 'm'))
  assert(match, `template block must include numeric property ${property}`)
  return resolveNumericExpression(match[1], source)
}
function resolveNumericExpression(value, source) {
  const text = String(value || '').trim()

  if (/^-?[0-9]+(?:\.[0-9]+)?$/.test(text)) {
    return Number(text)
  }

  if (/^[A-Z][A-Z0-9_]*$/.test(text)) {
    return extractAssignedNumber(source, text)
  }

  const path = text.match(/^([A-Z][A-Z0-9_]*)(?:\.([A-Za-z0-9_]+))(?:\.([A-Za-z0-9_]+))?$/)
  if (path) {
    let block = extractAssignedObjectBlock(source, path[1])

    if (path[3]) {
      block = extractObjectPropertyBlock(block, path[2])
      return extractNumericPropertyResolved(block, path[3], source)
    }

    return extractNumericPropertyResolved(block, path[2], source)
  }

  const division = text.match(/^(.+?)\s*\/\s*(.+)$/)
  if (division) {
    return resolveNumericExpression(division[1], source) / resolveNumericExpression(division[2], source)
  }

  throw new Error(`unsupported numeric expression ${text}`)
}

function extractAssignedObjectBlock(source, name) {
  const pattern = new RegExp(`${escapeRegExp(name)}(?:\\s*:[^=]+)?\\s*=\\s*\\{`, 'm')
  const match = pattern.exec(source)
  assert(match, `source must assign ${name}`)

  const openBraceIndex = source.indexOf('{', match.index)
  return extractBalancedBlock(source, openBraceIndex, '{', '}')
}

function extractAssignedNumber(source, name) {
  const match = source.match(new RegExp(`${escapeRegExp(name)}\\s*=\\s*(-?[0-9]+(?:\\.[0-9]+)?)`, 'm'))
  assert(match, `source must assign number ${name}`)
  return Number(match[1])
}

function extractAssignedString(source, name) {
  const match = source.match(new RegExp(`${escapeRegExp(name)}\\s*=\\s*['"]([^'"]*)['"]`, 'm'))
  assert(match, `source must assign string ${name}`)
  return match[1]
}

function assertSameNumericProperties(actualBlock, expectedBlock, properties, label) {
  for (const property of properties) {
    assert(
      extractNumericProperty(actualBlock, property) === extractNumericProperty(expectedBlock, property),
      `${label}.${property} must match legacy /template`
    )
  }
}

function assertSameStringProperty(actualBlock, expectedBlock, property, label) {
  assert(
    extractStringProperty(actualBlock, property) === extractStringProperty(expectedBlock, property),
    `${label}.${property} must match legacy /template`
  )
}

function assertSameOptionalStringProperty(actualBlock, expectedBlock, property, label) {
  const actualHasProperty = hasValueProperty(actualBlock, property)
  const expectedHasProperty = hasValueProperty(expectedBlock, property)
  assert(actualHasProperty === expectedHasProperty, `${label}.${property} presence must match legacy /template`)

  if (!expectedHasProperty) {
    return
  }

  assertSameStringProperty(actualBlock, expectedBlock, property, label)
}

function assertSameOptionalBooleanProperty(actualBlock, expectedBlock, property, label) {
  const actualHasProperty = hasValueProperty(actualBlock, property)
  const expectedHasProperty = hasValueProperty(expectedBlock, property)
  assert(actualHasProperty === expectedHasProperty, `${label}.${property} presence must match legacy /template`)

  if (!expectedHasProperty) {
    return
  }

  assert(
    extractBooleanProperty(actualBlock, property, false) === extractBooleanProperty(expectedBlock, property, false),
    `${label}.${property} must match legacy /template`
  )
}

function assertSameOptionalNumericPropertyResolved(actualBlock, expectedBlock, property, source, label) {
  const actualHasProperty = hasValueProperty(actualBlock, property)
  const expectedHasProperty = hasValueProperty(expectedBlock, property)
  assert(actualHasProperty === expectedHasProperty, `${label}.${property} presence must match legacy /template`)

  if (!expectedHasProperty) {
    return
  }

  assert(
    extractNumericPropertyResolved(actualBlock, property, source) === extractNumericPropertyResolved(expectedBlock, property, source),
    `${label}.${property} must match legacy /template`
  )
}

function assertSameNumericPropertiesResolved(actualBlock, expectedBlock, properties, label, source) {
  for (const property of properties) {
    assert(
      extractNumericPropertyResolved(actualBlock, property, source) ===
        extractNumericPropertyResolved(expectedBlock, property, source),
      `${label}.${property} must match legacy /template`
    )
  }
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

function withV2ClearDyeAsset(renderMode, assets) {
  if (!['eorzea', 'ec', 'risingstones'].includes(renderMode)) {
    return assets
  }

  return [...assets, 'clear-dye-icon']
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

function normalizeTemplateLocaleOrder(locales) {
  const preferred = ['ja', 'en', 'fr', 'de', 'zh', 'tc', 'ko']
  return preferred.filter((locale) => locales.includes(locale))
}

function assertSameArray(actual, expected, message) {
  assert(
    actual.length === expected.length && actual.every((value, index) => value === expected[index]),
    `${message}; expected ${expected.join(',')}, got ${actual.join(',')}`
  )
}

function assertSameNumericArray(actual, expected, message) {
  assert(
    actual.length === expected.length && actual.every((value, index) => value === expected[index]),
    `${message}; expected ${expected.join(',')}, got ${actual.join(',')}`
  )
}

function normalizeFontLiteral(value) {
  return String(value).replace(/["']/g, '').replace(/\s+/g, ' ').trim()
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
