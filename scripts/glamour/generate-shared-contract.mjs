// 生成 src/lib/glamour/contract.generated.ts。
// 唯一事实源：server/glamour/contracts/shared-rules.json。
// 产物随构建走；改契约后必须重跑本脚本，并跑 check:nsglamour-contract 校验。

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const CONTRACT_PATH = resolve(ROOT, 'server/glamour/contracts/shared-rules.json')
const OUTPUT_PATH = resolve(ROOT, 'src/lib/glamour/contract.generated.ts')

function assertRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

function assertNumber(value, label) {
  if (!Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a finite number`)
  }
  return Number(value)
}

async function main() {
  const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'))
  const equipSlotCategory = assertRecord(contract.equipSlotCategory, 'equipSlotCategory')
  const slotByCategory = assertRecord(contract.slotByEquipSlotCategory, 'slotByEquipSlotCategory')
  const itemIcon = assertRecord(contract.itemIcon, 'itemIcon')
  const hdFolderExtra = Array.isArray(itemIcon.hdFolderExtra)
    ? itemIcon.hdFolderExtra.map((value) => assertNumber(value, 'itemIcon.hdFolderExtra'))
    : []

  const slotEntries = Object.entries(slotByCategory)
    .map(([category, slot]) => `  ${assertNumber(category, 'slotByEquipSlotCategory key')}: '${String(slot)}'`)
    .join(',\n')

  const output = `// 自动生成，勿手改。
// 唯一事实源：server/glamour/contracts/shared-rules.json
// 生成命令：npm run build:glamour-contract

export const GLAMOUR_CONTRACT_VERSION = ${assertNumber(contract.version, 'version')}

export const GLAMOUR_CONTRACT_MAIN_HAND_CATEGORY = ${assertNumber(
    equipSlotCategory.mainHandCategory,
    'equipSlotCategory.mainHandCategory'
  )}

export const GLAMOUR_CONTRACT_OFF_HAND_CATEGORY = ${assertNumber(
    equipSlotCategory.offHandCategory,
    'equipSlotCategory.offHandCategory'
  )}

export const GLAMOUR_CONTRACT_SLOT_BY_EQUIP_SLOT_CATEGORY: Record<number, string> = {
${slotEntries}
}

export const GLAMOUR_CONTRACT_HD_FOLDER_MIN = ${assertNumber(
    itemIcon.hdFolderMin,
    'itemIcon.hdFolderMin'
  )}

export const GLAMOUR_CONTRACT_HD_FOLDER_MAX_EXCLUSIVE = ${assertNumber(
    itemIcon.hdFolderMaxExclusive,
    'itemIcon.hdFolderMaxExclusive'
  )}

export const GLAMOUR_CONTRACT_HD_FOLDER_EXTRA = [${hdFolderExtra.join(', ')}]
`

  await writeFile(OUTPUT_PATH, output, 'utf8')
  console.log(`generated ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
