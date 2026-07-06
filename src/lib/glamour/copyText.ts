import {
  GLAMOUR_ACCESSORY_SLOTS,
  getCandidateCopyDyeText,
  getCandidateDyeCount,
  getCopyDyeEntries,
  getDisplayDyeEntries,
  getDyeEntryName,
  getCandidateName,
  getNoDyeLabel,
  getSelectedCandidate,
  getSlotTitle
} from '@/lib/glamour/equipment'
import { getFilledGlamourDraftEntries } from '@/lib/glamour/draft'
import type { GlamourDraft, GlamourEquipmentEntry } from '@/lib/glamour/types'

export type GlamourCopyFormat = 'format1' | 'format2' | 'format3' | 'format4' | 'custom'

export const GLAMOUR_COPY_FORMATS: GlamourCopyFormat[] = [
  'format1',
  'format2',
  'format3',
  'format4',
  'custom'
]

export const DEFAULT_GLAMOUR_COPY_TEMPLATE =
  '{{#items}}{部位}：{装备}{换行}{{#染色文案}}｜{染色标签}{染色文案}{换行}{{/染色文案}}{{/items}}'

export interface GlamourCopyOptions {
  format?: GlamourCopyFormat
  customTemplate?: string
}

interface GlamourCopyEntryData {
  slotName: string
  itemName: string
  dyeText: string
  formatTwoDyeText: string
  slashDyeText: string
  spaceDyeText: string
  dyeLabel: string
}

function getCopyEntryData(draft: GlamourDraft, entry: GlamourEquipmentEntry): GlamourCopyEntryData {
  const candidate = getSelectedCandidate(entry)
  const slotName = getSlotTitle(entry, draft.locale, {
    slot_names: draft.slotNames,
    default_locale: draft.source.locale
  })
  const itemName = getCandidateName(candidate, draft.locale, draft.source.locale)
  const dyeText = getCandidateCopyDyeText(candidate, entry.slot, draft.locale, draft.noDyeLabels)
  const displayDyes = getDisplayDyeEntries(candidate, entry.slot, draft.noDyeLabels, draft.locale)
  const copyDyes = getCopyDyeEntries(displayDyes)
    .map((dye) => getDyeEntryName(dye, draft.noDyeLabels, draft.locale))
    .filter(Boolean)
  const dyeCount = getCandidateDyeCount(candidate, entry.slot)
  const dyeLabel = draft.dyeLabels[draft.locale] || draft.dyeLabels.zh || '染色：'
  const formatTwoDyeText =
    candidate && !GLAMOUR_ACCESSORY_SLOTS.has(entry.slot) && dyeCount <= 0
      ? getNoDyeLabel(draft.noDyeLabels, draft.locale)
      : displayDyes
          .slice(0, dyeCount)
          .map((dye) => getDyeEntryName(dye, draft.noDyeLabels, draft.locale))
          .filter(Boolean)
          .join(' | ')

  return {
    slotName,
    itemName,
    dyeText,
    formatTwoDyeText,
    slashDyeText: copyDyes.join('/'),
    spaceDyeText: copyDyes.join(' '),
    dyeLabel
  }
}

function renderFormatOne(entries: GlamourCopyEntryData[]): string {
  return entries
    .map((entry) => {
      if (!entry.slotName || !entry.itemName) {
        return ''
      }

      const dyeLine = entry.dyeText ? `｜${entry.dyeLabel}${entry.dyeText}` : ''
      return `${entry.slotName}：${entry.itemName}${dyeLine ? `\n${dyeLine}` : ''}`
    })
    .filter(Boolean)
    .join('\n')
}

function renderFormatTwo(entries: GlamourCopyEntryData[]): string {
  const names: string[] = []
  const dyes: string[] = []

  for (const entry of entries) {
    if (!entry.itemName) {
      continue
    }

    names.push(entry.itemName)

    if (entry.formatTwoDyeText) {
      dyes.push(entry.formatTwoDyeText)
    }
  }

  return [names.join('\n'), dyes.join('\n')].filter(Boolean).join('\n\n')
}

function renderFormatThree(entries: GlamourCopyEntryData[]): string {
  return entries
    .map((entry) => {
      if (!entry.slotName || !entry.itemName) {
        return ''
      }

      return entry.slashDyeText
        ? `${entry.slotName}：${entry.itemName}（${entry.slashDyeText}）`
        : `${entry.slotName}：${entry.itemName}`
    })
    .filter(Boolean)
    .join('\n')
}

function renderFormatFour(entries: GlamourCopyEntryData[]): string {
  const names = entries.map((entry) => entry.itemName).filter(Boolean)
  const dyes = entries.map((entry) => entry.spaceDyeText).filter(Boolean)
  return [names.join('/'), dyes.join('/')].filter(Boolean).join('\n')
}

function renderCustomTemplate(template: string, entries: GlamourCopyEntryData[]): string {
  const source = template || DEFAULT_GLAMOUR_COPY_TEMPLATE
  return source
    .replace(/\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g, (_match, block: string) =>
      entries.map((entry) => renderTemplateBlock(block, entry)).join('')
    )
    .replace(/\{换行\}/g, '\n')
    .trim()
}

function renderTemplateBlock(template: string, entry: GlamourCopyEntryData): string {
  return template
    .replace(/\{\{#染色文案\}\}([\s\S]*?)\{\{\/染色文案\}\}/g, (_match, block: string) =>
      entry.dyeText ? block : ''
    )
    .replace(/\{部位名?\}/g, entry.slotName)
    .replace(/\{装备名?\}/g, entry.itemName)
    .replace(/\{染色文案\}/g, entry.dyeText)
    .replace(/\{染色\}/g, entry.dyeText)
    .replace(/\{染色标签\}/g, entry.dyeLabel)
    .replace(/\{染色括号\}/g, entry.dyeText ? `（${entry.dyeText}）` : '')
    .replace(/\{换行\}/g, '\n')
}

export function normalizeGlamourCopyFormat(format: string | undefined): GlamourCopyFormat {
  return GLAMOUR_COPY_FORMATS.includes(format as GlamourCopyFormat)
    ? (format as GlamourCopyFormat)
    : 'format1'
}

export function buildGlamourCopyText(draft: GlamourDraft, options: GlamourCopyOptions = {}): string {
  const format = normalizeGlamourCopyFormat(options.format)
  const entries = getFilledGlamourDraftEntries(draft).map((entry) => getCopyEntryData(draft, entry))

  if (format === 'format2') {
    return renderFormatTwo(entries)
  }

  if (format === 'format3') {
    return renderFormatThree(entries)
  }

  if (format === 'format4') {
    return renderFormatFour(entries)
  }

  if (format === 'custom') {
    return renderCustomTemplate(options.customTemplate || DEFAULT_GLAMOUR_COPY_TEMPLATE, entries)
  }

  return renderFormatOne(entries)
}
