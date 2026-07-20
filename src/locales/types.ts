export type Locale = 'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de'

export type UiMessage = Record<Locale, string>

export type UiMessageMap = Record<string, UiMessage>

export type UiMessageModuleName =
  | 'home'
  | 'about'
  | 'plate'
  | 'glamour'
  | 'armoire'
  | 'silence'
  | 'styleLab'
  | 'fashionCheck'
