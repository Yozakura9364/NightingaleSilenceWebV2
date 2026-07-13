import { coreTextKeys } from '@/locales/keys/core'
import { homeTextKeys } from '@/locales/keys/home'
import { plateTextKeys } from '@/locales/keys/plate'
import { glamourTextKeys } from '@/locales/keys/glamour'
import { armoireTextKeys } from '@/locales/keys/armoire'
import { silenceTextKeys } from '@/locales/keys/silence'
import { styleLabTextKeys } from '@/locales/keys/styleLab'

export const allTextKeys = {
  ...coreTextKeys,
  ...homeTextKeys,
  ...plateTextKeys,
  ...glamourTextKeys,
  ...armoireTextKeys,
  ...silenceTextKeys,
  ...styleLabTextKeys
} as const
