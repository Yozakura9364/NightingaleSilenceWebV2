#!/usr/bin/env node
// Check: toolbar components use project i18n (useLocale), not local const objects.

import { readFileSync } from 'fs'

const FILES = [
  'src/pages/content-studio/components/ContentToolbar.vue',
  'src/pages/content-studio/components/TableToolbar.vue',
]

let failed = false

for (const f of FILES) {
  const text = readFileSync(f, 'utf-8')

  // 1. No local i18n/messages const object
  if (/\bconst\s+(i18n|labels|messages|texts)\b/.test(text)) {
    console.error(`[FAIL] ${f}: local i18n object defined`)
    failed = true
  }

  // 2. Must import useLocale
  if (!text.includes("from '@/stores/locale'")) {
    console.error(`[FAIL] ${f}: missing import { useLocale }`)
    failed = true
  }

  // 3. Must import contentStudioKeys
  if (!text.includes("from '@/locales/keys/content'")) {
    console.error(`[FAIL] ${f}: missing contentStudioKeys import`)
    failed = true
  }

  // 4. All aria-label/title must use t(keys.xxx) pattern
  const attrLines = text.split('\n').filter(l => /\b(?:aria-label|title)=/.test(l))
  for (const line of attrLines) {
    // Allow :aria-label="t(keys.xxx)" or :aria-label="t(...)"
    if (!/:(aria-label|title)="t\(keys\./.test(line) && !/:(aria-label|title)="t\(/.test(line)) {
      console.error(`[FAIL] ${f}: aria-label/title not using t(): ${line.trim()}`)
      failed = true
    }
  }
}

if (failed) {
  console.error('\nToolbar components must use useLocale + contentStudioKeys with t() calls.')
  process.exit(1)
}

console.log('[PASS] toolbar i18n uses project locale store')
