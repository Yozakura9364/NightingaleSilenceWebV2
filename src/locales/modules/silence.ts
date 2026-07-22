import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const silenceUiMessages: UiMessageMap = {
  'silence.group.angel.title': same('不语·silence'),
  'silence.group.glitch.title': same('幽灵·silence'),
  'silence.character.profile': msg({
    zh: '档案',
    en: 'Profile',
    ja: 'プロフィール',
    ko: '프로필'
  }),
  'silence.character.visual': msg({
    zh: '视觉',
    en: 'Visual',
    ja: 'ビジュアル',
    ko: '비주얼'
  }),
  'silence.character.archive': msg({
    zh: '资料',
    en: 'Archive',
    ja: '資料',
    ko: '자료'
  }),
  'silence.character.notes': msg({
    zh: '笔记',
    en: 'Notes',
    ja: 'ノート',
    ko: '노트'
  }),
  'silence.character.navigation': msg({
    zh: '角色导航',
    en: 'Character navigation',
    ja: 'キャラクターナビゲーション',
    ko: '캐릭터 탐색'
  }),
  'silence.character.missing': msg({
    zh: '角色未找到',
    en: 'Character not found',
    ja: 'キャラクターが見つかりません',
    ko: '캐릭터를 찾을 수 없음'
  }),
  'silence.character.sections': msg({
    zh: '档案分区',
    en: 'Profile sections',
    ja: 'プロフィール区分',
    ko: '프로필 섹션'
  }),
  'silence.character.basicProfile': msg({
    zh: '基础档案',
    en: 'Basic profile',
    ja: '基本プロフィール',
    ko: '기본 프로필'
  }),
  'silence.character.worlds': msg({
    zh: '世界线',
    en: 'World lines',
    ja: '世界線',
    ko: '세계선'
  }),
  'silence.character.gallery': msg({
    zh: '图像资料',
    en: 'Visual archive',
    ja: '画像資料',
    ko: '이미지 자료'
  }),
  'silence.character.relationships': msg({
    zh: '关系网',
    en: 'Relationships',
    ja: '関係',
    ko: '관계'
  }),
  'silence.character.spoiler': msg({
    zh: '剧透区',
    en: 'Spoilers',
    ja: 'ネタバレ',
    ko: '스포일러'
  }),
  'silence.character.preview': msg({
    zh: '预览',
    en: 'Preview',
    ja: 'プレビュー',
    ko: '미리보기'
  }),
  'silence.character.color': msg({
    zh: '代表色',
    en: 'Signature color',
    ja: '代表色',
    ko: '대표색'
  }),
  'silence.character.draftStatus': msg({
    zh: '资料状态',
    en: 'Archive status',
    ja: '資料ステータス',
    ko: '자료 상태'
  }),
  'silence.character.forms': msg({
    zh: '形态切换',
    en: 'Form switcher',
    ja: '形態切替',
    ko: '형태 전환'
  }),
  'silence.group.empty': msg({
    zh: '该群组暂无角色',
    en: 'No characters in this group',
    ja: 'このグループにキャラクターはいません',
    ko: '이 그룹에 캐릭터가 없습니다'
  })
}

export default silenceUiMessages
