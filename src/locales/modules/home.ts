import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const homeUiMessages: UiMessageMap = {
  'home.desktop': msg({
    zh: '桌面主页',
    en: 'Desktop home',
    ja: 'デスクトップホーム',
    ko: '데스크톱 홈'
  }),
  'home.desktop.dream': msg({ zh: '入梦', en: 'Dream', ja: '入夢', ko: '입몽' }),
  'home.desktop.angel': msg({ zh: '不语', en: 'Buyu', ja: '不語', ko: '불어' }),
  'home.desktop.glitch': msg({ zh: '幽灵', en: 'Ghost', ja: '幽霊', ko: '유령' }),
  'home.desktop.networkNeighbor': msg({
    zh: '网上邻居',
    en: 'Network',
    ja: 'ネットワーク',
    ko: '네트워크'
  }),
  'home.desktop.command': same('NIGHTINGALE.EXE'),
  'home.desktop.links': msg({ zh: '站外链接', en: 'Links', ja: '外部リンク', ko: '외부 링크' }),
  'home.desktop.clock': msg({ zh: '白昼 / 夜色', en: 'Day / Night', ja: '昼 / 夜', ko: '낮 / 밤' }),
  'home.icpRecord': same('鄂ICP备2026019415号'),
  'home.timeCommand': same('TIME'),
  'home.avatar.yoine': same('yoine'),
  'home.avatar.yoin': same('yoin'),
  'home.archive.window': msg({ zh: '状态', en: 'Status', ja: '状態', ko: '상태' }),
  'home.archive.stable': msg({ zh: '稳定', en: 'Stable', ja: '安定', ko: '안정' }),
  'home.archive.corrupt': msg({ zh: '损坏', en: 'Corrupt', ja: '破損', ko: '손상' }),
  'home.night.statusWindow': msg({
    zh: '生命体征',
    en: 'Vitals',
    ja: 'バイタル',
    ko: '활력 징후'
  }),
  'home.night.dialogueWindow': msg({
    zh: '对话记录',
    en: 'Conversation history',
    ja: '会話履歴',
    ko: '대화 기록'
  }),
  'home.night.dialoguePlaceholder': msg({
    zh: '占位用，待编辑',
    en: 'Draft placeholder',
    ja: '仮置き',
    ko: '임시 문구'
  }),
  'home.night.dialogue.geliya': msg({
    zh: '早点休息，晚安。',
    en: 'Get some rest. Good night.',
    ja: '早めに休んで。おやすみ。',
    ko: '일찍 쉬어. 잘 자.'
  }),
  'home.night.dialogue.naiyi': msg({
    zh: '外面雨好大……',
    en: "It's raining so hard outside...",
    ja: '外、雨がすごい……',
    ko: '밖에 비가 너무 많이 와……'
  }),
  'home.night.dialogue.shalewan': msg({
    zh: '你是谁？',
    en: 'Who are you?',
    ja: 'あなたは誰？',
    ko: '너는 누구야?'
  }),
  'home.night.dialogue.unread': msg({ zh: '未读', en: 'Unread', ja: '未読', ko: '읽지 않음' }),
  'home.night.chatWindow': msg({
    zh: '残片记录',
    en: 'Fragment log',
    ja: '断片ログ',
    ko: '파편 기록'
  }),
  'home.night.assetsWindow': msg({
    zh: '损坏相册',
    en: 'Damaged album',
    ja: '破損アルバム',
    ko: '손상 앨범'
  }),
  'home.night.controlWindow': msg({
    zh: '音乐播放器',
    en: 'Music player',
    ja: '音楽プレイヤー',
    ko: '음악 플레이어'
  }),
  'home.night.player.device': same('MP3'),
  'home.night.track.title': msg({
    zh: '夜间回声',
    en: 'Night Echo',
    ja: '夜の反響',
    ko: '밤의 메아리'
  }),
  'home.night.track.artist': msg({
    zh: 'Nightingale Silence',
    en: 'Nightingale Silence',
    ja: 'Nightingale Silence',
    ko: 'Nightingale Silence'
  }),
  'home.night.heartRate': msg({ zh: '心率', en: 'Heart rate', ja: '心拍数', ko: '심박수' }),
  'home.night.oxygenSaturation': msg({ zh: '血氧', en: 'SpO2', ja: '血中酸素', ko: '혈중 산소' }),
  'home.night.neuralActivity': msg({ zh: '脑电活动', en: 'Neural activity', ja: '脳波活動', ko: '뇌파 활동' }),
  'home.night.start': msg({ zh: '扫描', en: 'Scan', ja: 'スキャン', ko: '스캔' }),
  'home.night.pause': msg({ zh: '暂停', en: 'Pause', ja: '一時停止', ko: '일시정지' }),
  'home.night.end': msg({ zh: '封存', en: 'Seal', ja: '封印', ko: '봉인' }),
  'home.night.mute': msg({ zh: '静默', en: 'Mute', ja: '沈黙', ko: '정지' }),
  'home.night.screenshot': msg({ zh: '快照', en: 'Snapshot', ja: 'スナップ', ko: '스냅샷' }),
  'home.night.switchScene': msg({ zh: '切层', en: 'Shift', ja: '切層', ko: '전환' }),
  'home.night.existenceStability': msg({ zh: '存在稳定度', en: 'Existence stability', ja: '存在安定度', ko: '존재 안정도' }),
  'home.night.mentalStability': msg({ zh: '精神稳定度', en: 'Mental stability', ja: '精神安定度', ko: '정신 안정도' }),
  'home.night.worldStability': msg({ zh: '世界稳定度', en: 'World stability', ja: '世界安定度', ko: '세계 안정도' }),
  'home.night.fragment.qianzao': msg({ zh: '千早', en: 'Chihaya', ja: 'チハヤ', ko: '치하야' }),
  'home.night.fragment.nightingale': msg({
    zh: '南丁格尔',
    en: 'Nightingale',
    ja: 'ナイチンゲール',
    ko: '나이팅게일'
  }),
  'home.night.fragment.naiyi': msg({ zh: '奈伊', en: 'Ney', ja: 'ネイ', ko: '네이' }),
  'home.night.fragment.gelin': msg({ zh: '歌林', en: 'Glakja', ja: 'グラクッヤー', ko: '글라크야' }),
  'home.night.fragment.geliya': msg({ zh: '歌莉亚', en: 'Gurakina', ja: 'グラキーナー', ko: '구라키나' }),
  'home.night.fragment.shalewan': msg({
    zh: '沙乐万',
    en: 'Salvance',
    ja: 'サラヴァンス',
    ko: '살반스'
  }),
  'home.social.title': msg({
    zh: '站外链接',
    en: 'Links',
    ja: '外部リンク',
    ko: '외부 링크'
  }),
  'home.social.huiji': same('灰机wiki'),
  'home.social.nga': same('NGA'),
  'home.social.xiaohongshu': same('小红书'),
  'home.social.weibo': same('微博'),
  'home.social.douyin': same('抖音')
}

export default homeUiMessages
