import type { Locale } from '@/stores/locale'
import { uiMessages } from '@/locales/ui'

export type RoutePath =
  | '/'
  | '/ffxiv'
  | '/ffxiv/glamour'
  | '/ffxiv/plate'
  | '/ffxiv/armoire'
  | '/silence'
  | '/silence/angel'
  | '/silence/glitch'
  | '/about'

export interface NavItem {
  id: string
  labelKey: string
  commandKey?: string
  route: RoutePath
  variant?: 'default' | 'primary'
}

export interface SiteCategory {
  id: string
  titleKey: string
  shortTitleKey: string
  kickerKey: string
  descriptionKey: string
  route: RoutePath
}

export interface ToolEntry {
  id: string
  titleKey: string
  projectName: string
  route: RoutePath
  summaryKey: string
  sourcePath: string
  apiBase?: string
  devPort?: number
  statusLabelKey: string
}

export interface SilenceGroupEntry {
  id: 'angel' | 'glitch'
  titleKey: string
  route: RoutePath
  summaryKey: string
  statusLabelKey: string
}

export interface SiteLocaleOption {
  locale: Locale
  labelKey: string
  commandKey: string
}

export const textKeys = {
  placeholder: 'common.placeholder',
  back: 'common.back',
  enter: 'common.enter',
  children: 'common.children',
  closeMenu: 'common.close.menu',
  closeConfig: 'common.close.config',
  itemsUnit: 'common.items.unit',
  layersUnit: 'common.layers.unit',
  notSelected: 'common.notSelected',
  noAssets: 'common.noAssets',
  selectPreset: 'common.selectPreset',
  check: 'common.check',
  checking: 'common.checking',
  api: 'common.api',
  project: 'common.project',
  port: 'common.port',
  health: 'common.health',
  import: 'common.import',
  export: 'common.export',
  save: 'common.save',
  saveDraft: 'common.saveDraft',
  open: 'common.open',
  details: 'common.details',
  status: 'common.status',
  toolbar: 'common.toolbar',
  tabs: 'common.tabs',
  primaryNavigation: 'common.primaryNavigation',
  siteZhName: 'site.name.zh',
  siteEnName: 'site.name.en',
  siteTitle: 'site.title',
  siteDescription: 'site.description',
  menu: 'site.nav.menu',
  menuCommand: 'site.nav.menuCommand',
  menuCategory: 'site.nav.menuCategory',
  homeCommand: 'site.nav.homeCommand',
  config: 'site.nav.config',
  configCommand: 'site.nav.configCommand',
  about: 'site.nav.about',
  aboutCommand: 'site.nav.aboutCommand',
  silenceCommand: 'site.nav.silenceCommand',
  home: 'site.nav.home',
  menuTitle: 'site.window.menuTitle',
  configTitle: 'site.window.configTitle',
  themeMode: 'site.theme.mode',
  day: 'site.theme.day',
  dayCommand: 'site.theme.dayCommand',
  night: 'site.theme.night',
  nightCommand: 'site.theme.nightCommand',
  languageMode: 'site.language.mode',
  localeZhLabel: 'site.locale.zh.label',
  localeJaLabel: 'site.locale.ja.label',
  localeKoLabel: 'site.locale.ko.label',
  localeEnLabel: 'site.locale.en.label',
  localeZhCommand: 'site.locale.zh.command',
  localeJaCommand: 'site.locale.ja.command',
  localeKoCommand: 'site.locale.ko.command',
  localeEnCommand: 'site.locale.en.command',
  statusOpen: 'site.status.open',
  statusWip: 'site.status.wip',
  silence: 'site.menu.silence',
  oc: 'site.menu.oc',
  silenceAngel: 'silence.group.angel.title',
  silenceGlitch: 'silence.group.glitch.title',
  silenceCharacterProfile: 'silence.character.profile',
  silenceCharacterVisual: 'silence.character.visual',
  silenceCharacterArchive: 'silence.character.archive',
  silenceCharacterNotes: 'silence.character.notes',
  silenceCharacterNavigation: 'silence.character.navigation',
  silenceCharacterMissing: 'silence.character.missing',
  silenceCharacterSections: 'silence.character.sections',
  silenceCharacterBasicProfile: 'silence.character.basicProfile',
  silenceCharacterWorlds: 'silence.character.worlds',
  silenceCharacterGallery: 'silence.character.gallery',
  silenceCharacterRelationships: 'silence.character.relationships',
  silenceCharacterSpoiler: 'silence.character.spoiler',
  silenceCharacterPreview: 'silence.character.preview',
  silenceCharacterColor: 'silence.character.color',
  silenceCharacterDraftStatus: 'silence.character.draftStatus',
  ffxivWorkshop: 'ffxiv.workshop.title',
  ffxivWorkshopShort: 'ffxiv.workshop.short',
  glamourTitle: 'ffxiv.tool.glamour.title',
  plateTitle: 'ffxiv.tool.plate.title',
  armoireTitle: 'ffxiv.tool.armoire.title',
  nsarmoireImport: 'nsarmoire.panel.import',
  nsarmoireOverview: 'nsarmoire.panel.overview',
  nsarmoireDistribution: 'nsarmoire.panel.distribution',
  nsarmoireInsights: 'nsarmoire.panel.insights',
  nsarmoireCabinetProgress: 'nsarmoire.panel.cabinetProgress',
  nsarmoireGlamourSetProgress: 'nsarmoire.panel.glamourSetProgress',
  nsarmoireDyeRisk: 'nsarmoire.panel.dyeRisk',
  nsarmoireIdenticalModels: 'nsarmoire.panel.identicalModels',
  nsarmoireActionHints: 'nsarmoire.panel.actionHints',
  nsarmoireRecommendationCabinet: 'nsarmoire.recommendation.cabinet',
  nsarmoireRecommendationSets: 'nsarmoire.recommendation.sets',
  nsarmoireRecommendationDuplicateItems: 'nsarmoire.recommendation.duplicateItems',
  nsarmoireRecommendationDuplicates: 'nsarmoire.recommendation.duplicates',
  nsarmoireRecommendationDyes: 'nsarmoire.recommendation.dyes',
  nsarmoireSummaryInventory: 'nsarmoire.summary.inventory',
  nsarmoireSummaryStorage: 'nsarmoire.summary.storage',
  nsarmoireSummaryDyeWarning: 'nsarmoire.summary.dyeWarning',
  nsarmoireSummaryNoDyeWarning: 'nsarmoire.summary.noDyeWarning',
  nsarmoireHintCabinetSummary: 'nsarmoire.hint.cabinet.summary',
  nsarmoireHintCabinetNone: 'nsarmoire.hint.cabinet.none',
  nsarmoireHintSetsSummary: 'nsarmoire.hint.sets.summary',
  nsarmoireHintSetsNone: 'nsarmoire.hint.sets.none',
  nsarmoireHintDuplicateItemsSummary: 'nsarmoire.hint.duplicateItems.summary',
  nsarmoireHintDuplicateItemsNone: 'nsarmoire.hint.duplicateItems.none',
  nsarmoireHintDuplicatesSummary: 'nsarmoire.hint.duplicates.summary',
  nsarmoireHintDuplicatesNone: 'nsarmoire.hint.duplicates.none',
  nsarmoireHintDyesSummary: 'nsarmoire.hint.dyes.summary',
  nsarmoireHintAllClearTitle: 'nsarmoire.hint.allClear.title',
  nsarmoireHintAllClearMessage: 'nsarmoire.hint.allClear.message',
  nsarmoireHintCatalogPendingTitle: 'nsarmoire.hint.catalogPending.title',
  nsarmoireHintCatalogPendingMessage: 'nsarmoire.hint.catalogPending.message',
  nsarmoireHintMoreItems: 'nsarmoire.hint.moreItems',
  nsarmoireHintMissingPieces: 'nsarmoire.hint.missingPieces',
  nsarmoireHintOwnedEntries: 'nsarmoire.hint.ownedEntries',
  nsarmoireHintCurrentLocation: 'nsarmoire.hint.currentLocation',
  nsarmoireHintNamedLocations: 'nsarmoire.hint.namedLocations',
  nsarmoireExpandList: 'nsarmoire.action.expandList',
  nsarmoireCollapseList: 'nsarmoire.action.collapseList',
  nsarmoireLoadExampleSnapshot: 'nsarmoire.action.loadExampleSnapshot',
  nsarmoireImportSnapshot: 'nsarmoire.action.importSnapshot',
  nsarmoireClearSnapshot: 'nsarmoire.action.clearSnapshot',
  nsarmoireSnapshotInput: 'nsarmoire.input.snapshot',
  nsarmoireSnapshotReady: 'nsarmoire.status.snapshotReady',
  nsarmoireSnapshotEmpty: 'nsarmoire.status.snapshotEmpty',
  nsarmoireSnapshotError: 'nsarmoire.status.snapshotError',
  nsarmoireSnapshotFileTooLarge: 'nsarmoire.error.fileTooLarge',
  nsarmoireSnapshotInvalidJson: 'nsarmoire.error.invalidJson',
  nsarmoireSnapshotInvalidRoot: 'nsarmoire.error.invalidRoot',
  nsarmoireSnapshotInvalidSchema: 'nsarmoire.error.invalidSchema',
  nsarmoireSnapshotInvalidSource: 'nsarmoire.error.invalidSource',
  nsarmoireSnapshotInvalidGeneratedAt: 'nsarmoire.error.invalidGeneratedAt',
  nsarmoireSnapshotInvalidItems: 'nsarmoire.error.invalidItems',
  nsarmoireSnapshotTooManyItems: 'nsarmoire.error.tooManyItems',
  nsarmoireSnapshotInvalidItem: 'nsarmoire.error.invalidItem',
  nsarmoireSnapshotInvalidItemId: 'nsarmoire.error.invalidItemId',
  nsarmoireSnapshotInvalidContainer: 'nsarmoire.error.invalidContainer',
  nsarmoireSnapshotInvalidQuantity: 'nsarmoire.error.invalidQuantity',
  nsarmoireSnapshotInvalidDyes: 'nsarmoire.error.invalidDyes',
  nsarmoireCatalogStatus: 'nsarmoire.status.catalogStatus',
  nsarmoireCatalogPending: 'nsarmoire.status.catalogPending',
  nsarmoireCatalogLoading: 'nsarmoire.status.catalogLoading',
  nsarmoireCatalogReady: 'nsarmoire.status.catalogReady',
  nsarmoireCatalogEmpty: 'nsarmoire.status.catalogEmpty',
  nsarmoireCatalogError: 'nsarmoire.status.catalogError',
  nsarmoireCatalogErrorWithDetail: 'nsarmoire.status.catalogErrorWithDetail',
  nsarmoireNoDyeRisk: 'nsarmoire.status.noDyeRisk',
  nsarmoireReloadCatalog: 'nsarmoire.action.reloadCatalog',
  nsarmoireMetricEntries: 'nsarmoire.metric.entries',
  nsarmoireMetricUniqueItems: 'nsarmoire.metric.uniqueItems',
  nsarmoireMetricTotalQuantity: 'nsarmoire.metric.totalQuantity',
  nsarmoireMetricDyedEntries: 'nsarmoire.metric.dyedEntries',
  nsarmoireMetricGlamourDresser: 'nsarmoire.metric.glamourDresser',
  nsarmoireMetricArmoire: 'nsarmoire.metric.armoire',
  nsarmoireMetricStored: 'nsarmoire.metric.stored',
  nsarmoireMetricStorable: 'nsarmoire.metric.storable',
  nsarmoireMetricTransferable: 'nsarmoire.metric.transferable',
  nsarmoireMetricMissing: 'nsarmoire.metric.missing',
  nsarmoireMetricStoredSets: 'nsarmoire.metric.storedSets',
  nsarmoireMetricAvailableSets: 'nsarmoire.metric.availableSets',
  nsarmoireMetricIncompleteSets: 'nsarmoire.metric.incompleteSets',
  nsarmoireMetricHighRisk: 'nsarmoire.metric.highRisk',
  nsarmoireMetricDuplicateGroups: 'nsarmoire.metric.duplicateGroups',
  nsarmoireMetricCatalogItems: 'nsarmoire.metric.catalogItems',
  nsarmoireMetricCatalogCabinetItems: 'nsarmoire.metric.catalogCabinetItems',
  nsarmoireMetricCatalogSets: 'nsarmoire.metric.catalogSets',
  nsarmoireMetricCatalogModelGroups: 'nsarmoire.metric.catalogModelGroups',
  nsarmoireMetricCatalogDyes: 'nsarmoire.metric.catalogDyes',
  nsarmoireGeneratedAt: 'nsarmoire.field.generatedAt',
  nsarmoireSource: 'nsarmoire.field.source',
  nsarmoireCharacter: 'nsarmoire.field.character',
  nsarmoireItemId: 'nsarmoire.field.itemId',
  nsarmoireDyes: 'nsarmoire.field.dyes',
  nsarmoireContainerInventory: 'nsarmoire.container.inventory',
  nsarmoireContainerSaddlebag: 'nsarmoire.container.saddlebag',
  nsarmoireContainerRetainer: 'nsarmoire.container.retainer',
  nsarmoireContainerArmoury: 'nsarmoire.container.armoury',
  nsarmoireContainerGlamourDresser: 'nsarmoire.container.glamourDresser',
  nsarmoireContainerArmoire: 'nsarmoire.container.armoire',
  nsarmoireContainerManual: 'nsarmoire.container.manual',
  nsplatePortrait: 'nsplate.tab.portrait',
  nsplateNameplate: 'nsplate.tab.nameplate',
  nsplateInfo: 'nsplate.tab.info',
  nsplateConfig: 'nsplate.panel.config',
  nsplateAssets: 'nsplate.panel.assets',
  nsplatePresets: 'nsplate.panel.presets',
  nsplateCurrentCombination: 'nsplate.panel.currentCombination',
  nsplatePortraitAssets: 'nsplate.panel.portraitAssets',
  nsplateNameplateAssets: 'nsplate.panel.nameplateAssets',
  nsplateCustomPortrait: 'nsplate.panel.customPortrait',
  nsplateCustomPortraitUpload: 'nsplate.customPortrait.upload',
  nsplateCustomPortraitClear: 'nsplate.customPortrait.clear',
  nsplateCustomPortraitInput: 'nsplate.customPortrait.input',
  nsplateCustomPortraitError: 'nsplate.customPortrait.error',
  nsplateCustomPortraitCropTitle: 'nsplate.customPortrait.crop.title',
  nsplateCustomPortraitCropCanvas: 'nsplate.customPortrait.crop.canvas',
  nsplateCustomPortraitCropMode: 'nsplate.customPortrait.crop.mode',
  nsplateCustomPortraitCropModeStandard: 'nsplate.customPortrait.crop.mode.standard',
  nsplateCustomPortraitCropModePopout: 'nsplate.customPortrait.crop.mode.popout',
  nsplateCustomPortraitCropZoom: 'nsplate.customPortrait.crop.zoom',
  nsplateCustomPortraitCropSplit: 'nsplate.customPortrait.crop.split',
  nsplateCustomPortraitCropCancel: 'nsplate.customPortrait.crop.cancel',
  nsplateCustomPortraitCropApply: 'nsplate.customPortrait.crop.apply',
  nsplateClearAllSelections: 'nsplate.action.clearAllSelections',
  nsplateExportPng: 'nsplate.export.png',
  nsplateExportJpg: 'nsplate.export.jpg',
  nsplateExportLayeredZip: 'nsplate.export.layeredZip',
  nsplateExportScale2x: 'nsplate.export.scale2x',
  nsplateExportError: 'nsplate.export.error',
  nsplateExportNoLayers: 'nsplate.export.error.noLayers',
  nsplateExportLayeredZipError: 'nsplate.export.error.layeredZip',
  nsplateCanvasEditing: 'nsplate.canvas.editing',
  nsplateCanvasSelectedPreset: 'nsplate.canvas.selectedPreset',
  nsplateCanvasSelectedLayers: 'nsplate.canvas.selectedLayers',
  nsplateCanvasLayers: 'nsplate.canvas.layers',
  nsplateCanvasSelectionStatus: 'nsplate.canvas.selectionStatus',
  nsplateCanvasAria: 'nsplate.canvas.aria',
  nsplateResizeConfigPanel: 'nsplate.resize.configPanel',
  nsplateCategoryPortraitBackground: 'nsplate.category.portraitBackground',
  nsplateCategoryPortraitDecorFrame: 'nsplate.category.portraitDecorFrame',
  nsplateCategoryPortraitDecoration: 'nsplate.category.portraitDecoration',
  nsplateCategoryPortraitFrame: 'nsplate.category.portraitFrame',
  nsplateCategoryNameplateBase: 'nsplate.category.nameplateBase',
  nsplateCategoryNameplateColor: 'nsplate.category.nameplateColor',
  nsplateCategoryNameplatePattern: 'nsplate.category.nameplatePattern',
  nsplateCategoryNameplateFrame: 'nsplate.category.nameplateFrame',
  nsplateCategoryNameplateTopDecor: 'nsplate.category.nameplateTopDecor',
  nsplateCategoryNameplateBottomDecor: 'nsplate.category.nameplateBottomDecor',
  nsplateCategoryNameplateDecoration: 'nsplate.category.nameplateDecoration',
  nsplateCategoryNameplateDecorationAlt: 'nsplate.category.nameplateDecorationAlt',
  styleLabPixelTone: 'styleLab.pixelTone',
  styleLabFontMode: 'styleLab.fontMode',
  styleLabTitle: 'styleLab.title',
  styleLabSampleLead: 'styleLab.sampleLead',
  styleLabPrimary: 'styleLab.primary',
  styleLabAction: 'styleLab.action',
  styleLabDefault: 'styleLab.default',
  styleLabWindowSample: 'styleLab.windowSample',
  styleLabPalette: 'styleLab.palette',
  styleLabProgress: 'styleLab.progress',
  styleLabPopupMenuSample: 'styleLab.popupMenuSample',
  styleLabPopupWindowSample: 'styleLab.popupWindowSample',
  styleLabPopupNavigationSample: 'styleLab.popupNavigationSample',
  styleLabFfxivChildren: 'styleLab.ffxivChildren',
  styleLabOcChildren: 'styleLab.ocChildren',
  styleLabWorkbenchSample: 'styleLab.workbenchSample',
  styleLabWorkbenchToolbar: 'styleLab.workbenchToolbar',
  styleLabWorkbenchSidebar: 'styleLab.workbenchSidebar',
  styleLabWorkbenchCanvas: 'styleLab.workbenchCanvas',
  styleLabWorkbenchInspector: 'styleLab.workbenchInspector',
  styleLabWorkbenchMeters: 'styleLab.workbenchMeters',
  styleLabToolbarSample: 'styleLab.toolbarSample',
  styleLabCommonToolbarPreview: 'styleLab.commonToolbarPreview',
  styleLabCommonTabsPreview: 'styleLab.commonTabsPreview',
  styleLabFormalComponents: 'styleLab.formalComponents',
  styleLabFormalControls: 'styleLab.formalControls',
  styleLabFormalStates: 'styleLab.formalStates',
  styleLabToolCardSamples: 'styleLab.toolCardSamples',
  styleLabDecorativePixels: 'styleLab.decorativePixels',
  styleLabAllPixels: 'styleLab.allPixels',
  styleLabCurrentPixel: 'styleLab.currentPixel',
  styleLabLightPixel: 'styleLab.lightPixel',
  styleLabCyberNight: 'styleLab.cyberNight',
  styleLabTools: 'styleLab.tools',
  styleLabEquipmentPanel: 'styleLab.equipmentPanel',
  styleLabTemplate: 'styleLab.template',
  styleLabAssets: 'styleLab.assets',
  styleLabLayers: 'styleLab.layers',
  styleLabTitleField: 'styleLab.titleField',
  styleLabCharacter: 'styleLab.character',
  styleLabEquipment: 'styleLab.equipment',
  styleLabBackground: 'styleLab.background',
  styleLabInspector: 'styleLab.inspector',
  styleLabLanguage: 'styleLab.language',
  styleLabReady: 'styleLab.ready',
  styleLabName: 'styleLab.name',
  styleLabModule: 'styleLab.module',
  styleLabToolBadge: 'styleLab.toolBadge',
  styleLabStatusPanel: 'styleLab.statusPanel',
  styleLabAppField: 'styleLab.appField',
  styleLabAppToolbar: 'styleLab.appToolbar',
  styleLabAppStatus: 'styleLab.appStatus',
  styleLabSkinName: 'styleLab.skinName'
} as const

export const placeholderCopyKey = textKeys.placeholder

function defaultText(key: string): string {
  return uiMessages[key]?.['zh-CN'] ?? key
}

// Deprecated compatibility exports for stale Vite HMR modules from the pre-localization scaffold.
// New code must use textKeys + useLocale().t(key) instead of these static fallbacks.
export const placeholderCopy = defaultText(textKeys.placeholder)

export const siteLabels = {
  menu: defaultText(textKeys.menu),
  menuCommand: defaultText(textKeys.menuCommand),
  homeCommand: defaultText(textKeys.homeCommand),
  config: defaultText(textKeys.config),
  configCommand: defaultText(textKeys.configCommand),
  themeMode: defaultText(textKeys.themeMode),
  day: defaultText(textKeys.day),
  dayCommand: defaultText(textKeys.dayCommand),
  night: defaultText(textKeys.night),
  nightCommand: defaultText(textKeys.nightCommand),
  ffxivWorkshop: defaultText(textKeys.ffxivWorkshop),
  ffxivWorkshopShort: defaultText(textKeys.ffxivWorkshopShort),
  about: defaultText(textKeys.about),
  aboutCommand: defaultText(textKeys.aboutCommand),
  home: defaultText(textKeys.home)
} as const

export const siteMeta = {
  zhNameKey: textKeys.siteZhName,
  enNameKey: textKeys.siteEnName,
  titleKey: textKeys.siteTitle,
  descriptionKey: textKeys.siteDescription
} as const

export const siteRoutes = {
  home: '/',
  ffxiv: '/ffxiv',
  glamour: '/ffxiv/glamour',
  plate: '/ffxiv/plate',
  armoire: '/ffxiv/armoire',
  silence: '/silence',
  silenceAngel: '/silence/angel',
  silenceGlitch: '/silence/glitch',
  about: '/about'
} as const satisfies Record<string, RoutePath>

export const siteLocaleOptions: SiteLocaleOption[] = [
  { locale: 'zh-CN', labelKey: textKeys.localeZhLabel, commandKey: textKeys.localeZhCommand },
  { locale: 'ja', labelKey: textKeys.localeJaLabel, commandKey: textKeys.localeJaCommand },
  { locale: 'ko', labelKey: textKeys.localeKoLabel, commandKey: textKeys.localeKoCommand },
  { locale: 'en', labelKey: textKeys.localeEnLabel, commandKey: textKeys.localeEnCommand }
]

export const homeNavItems: NavItem[] = [
  {
    id: 'ffxiv',
    labelKey: textKeys.ffxivWorkshop,
    route: siteRoutes.ffxiv,
    variant: 'primary'
  },
  {
    id: 'silence',
    labelKey: textKeys.silence,
    commandKey: textKeys.silenceCommand,
    route: siteRoutes.silence
  },
  {
    id: 'about',
    labelKey: textKeys.about,
    commandKey: textKeys.aboutCommand,
    route: siteRoutes.about
  }
]

export const siteCategories: SiteCategory[] = [
  {
    id: 'ffxiv',
    titleKey: textKeys.ffxivWorkshop,
    shortTitleKey: textKeys.ffxivWorkshopShort,
    kickerKey: textKeys.placeholder,
    descriptionKey: textKeys.placeholder,
    route: siteRoutes.ffxiv
  },
  {
    id: 'silence',
    titleKey: textKeys.silence,
    shortTitleKey: textKeys.silence,
    kickerKey: textKeys.placeholder,
    descriptionKey: textKeys.placeholder,
    route: siteRoutes.silence
  }
]

export const silenceGroups: SilenceGroupEntry[] = [
  {
    id: 'angel',
    titleKey: textKeys.silenceAngel,
    route: siteRoutes.silenceAngel,
    summaryKey: textKeys.placeholder,
    statusLabelKey: textKeys.statusWip
  },
  {
    id: 'glitch',
    titleKey: textKeys.silenceGlitch,
    route: siteRoutes.silenceGlitch,
    summaryKey: textKeys.placeholder,
    statusLabelKey: textKeys.statusWip
  }
]

export const ffxivTools: ToolEntry[] = [
  {
    id: 'glamour',
    titleKey: textKeys.glamourTitle,
    projectName: 'NSGlamour',
    route: siteRoutes.glamour,
    summaryKey: textKeys.placeholder,
    sourcePath: '../NSGlamour',
    apiBase: '/api/glamour',
    devPort: 8765,
    statusLabelKey: textKeys.placeholder
  },
  {
    id: 'plate',
    titleKey: textKeys.plateTitle,
    projectName: 'NSPlate',
    route: siteRoutes.plate,
    summaryKey: textKeys.placeholder,
    sourcePath: '../NSPortable',
    apiBase: '/api/plate',
    devPort: 3456,
    statusLabelKey: textKeys.placeholder
  },
  {
    id: 'armoire',
    titleKey: textKeys.armoireTitle,
    projectName: 'NSArmoire',
    route: siteRoutes.armoire,
    summaryKey: textKeys.placeholder,
    sourcePath: 'docs/ARMOIRE_PLAN.md',
    statusLabelKey: textKeys.placeholder
  }
]

export function getCategory(id: string): SiteCategory | undefined {
  return siteCategories.find((category) => category.id === id)
}

export function getFfxivTool(id: string): ToolEntry | undefined {
  return ffxivTools.find((tool) => tool.id === id)
}

export function getRequiredFfxivTool(id: string): ToolEntry {
  const tool = getFfxivTool(id)

  if (!tool) {
    throw new Error(`Unknown FFXIV tool: ${id}`)
  }

  return tool
}

export function formatDocumentTitle(
  title: string | undefined,
  siteName: string,
  siteTitle: string
): string {
  if (!title || title === siteName) {
    return siteTitle
  }

  return `${title} - ${siteName}`
}
