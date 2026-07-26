import { coreUiMessages } from '@/locales/modules/core'
import { ffxivUiMessages } from '@/locales/modules/ffxiv'
import { homeUiMessages } from '@/locales/modules/home'
import { plateUiMessages } from '@/locales/modules/plate'
import { glamourUiMessages } from '@/locales/modules/glamour'
import { armoireUiMessages } from '@/locales/modules/armoire'
import { silenceUiMessages } from '@/locales/modules/silence'
import { styleLabUiMessages } from '@/locales/modules/styleLab'
import type { UiMessageMap } from '@/locales/types'

export type { UiMessageMap } from '@/locales/types'

export const uiMessages: UiMessageMap = {
  ...coreUiMessages,
  ...ffxivUiMessages,
  ...homeUiMessages,
  ...plateUiMessages,
  ...glamourUiMessages,
  ...armoireUiMessages,
  ...silenceUiMessages,
  ...styleLabUiMessages
}
