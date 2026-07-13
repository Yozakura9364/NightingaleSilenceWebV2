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
  'home.desktop.memo': msg({ zh: '备忘录', en: 'Memo', ja: 'メモ', ko: '메모' }),
  'home.desktop.ready': msg({ zh: '运行中', en: 'Running', ja: '実行中', ko: '실행 중' }),
  'home.desktop.clock': msg({ zh: '白昼 / 夜色', en: 'Day / Night', ja: '昼 / 夜', ko: '낮 / 밤' }),
  'home.roster.window': msg({ zh: '状态', en: 'Status', ja: '状態', ko: '상태' }),
  'home.avatar.yoine': same('yoine'),
  'home.avatar.yoin': same('yoin'),
  'home.roster.online': msg({ zh: '在线', en: 'Online', ja: 'オンライン', ko: '온라인' }),
  'home.roster.sleep': msg({ zh: '休眠中', en: 'Sleeping', ja: '休眠中', ko: '휴면 중' }),
  'home.archive.window': msg({ zh: '状态', en: 'Status', ja: '状態', ko: '상태' }),
  'home.archive.stable': msg({ zh: '稳定', en: 'Stable', ja: '安定', ko: '안정' }),
  'home.archive.corrupt': msg({ zh: '损坏', en: 'Corrupt', ja: '破損', ko: '손상' }),
  'home.night.liveWindow': msg({ zh: '梦境日志', en: 'Dream log', ja: '夢ログ', ko: '꿈 로그' }),
  'home.night.statusWindow': msg({
    zh: '异常状态',
    en: 'Anomaly status',
    ja: '異常ステータス',
    ko: '이상 상태'
  }),
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
  'home.night.alertWindow': msg({
    zh: '梦境警告',
    en: 'Dream warning',
    ja: '夢の警告',
    ko: '꿈 경고'
  }),
  'home.night.liveBadge': same('DREAM'),
  'home.night.streamTime': same('00:29:18'),
  'home.night.viewers': msg({ zh: '梦压', en: 'Dream load', ja: '夢圧', ko: '꿈 압력' }),
  'home.night.likes': msg({ zh: '残响', en: 'Echoes', ja: '残響', ko: '잔향' }),
  'home.night.comments': msg({ zh: '裂隙', en: 'Rifts', ja: '裂け目', ko: '균열' }),
  'home.night.mic': msg({ zh: '低语', en: 'Whisper', ja: '囁き', ko: '속삭임' }),
  'home.night.bgm': msg({ zh: '噪点', en: 'Noise', ja: 'ノイズ', ko: '노이즈' }),
  'home.night.alert': msg({ zh: '警告', en: 'Alert', ja: '警告', ko: '경고' }),
  'home.night.scene': msg({ zh: '梦层', en: 'Layer', ja: '夢層', ko: '꿈 층' }),
  'home.night.source': msg({ zh: '残片', en: 'Fragment', ja: '断片', ko: '파편' }),
  'home.night.mixer': msg({ zh: '污染', en: 'Noise', ja: '汚染', ko: '오염' }),
  'home.night.start': msg({ zh: '扫描', en: 'Scan', ja: 'スキャン', ko: '스캔' }),
  'home.night.pause': msg({ zh: '暂停', en: 'Pause', ja: '一時停止', ko: '일시정지' }),
  'home.night.end': msg({ zh: '封存', en: 'Seal', ja: '封印', ko: '봉인' }),
  'home.night.mute': msg({ zh: '静默', en: 'Mute', ja: '沈黙', ko: '정지' }),
  'home.night.screenshot': msg({ zh: '快照', en: 'Snapshot', ja: 'スナップ', ko: '스냅샷' }),
  'home.night.switchScene': msg({ zh: '切层', en: 'Shift', ja: '切層', ko: '전환' }),
  'home.night.superchat': msg({
    zh: '占位用，待编辑',
    en: 'Draft placeholder',
    ja: '仮置き',
    ko: '임시 문구'
  }),
  'home.night.goal': msg({ zh: '目标进度', en: 'Goal progress', ja: '目標進捗', ko: '목표 진행' }),
  'home.night.commentA': msg({
    zh: '占位用，待编辑',
    en: 'Draft placeholder',
    ja: '仮置き',
    ko: '임시 문구'
  }),
  'home.night.commentB': msg({
    zh: '占位用，待编辑',
    en: 'Draft placeholder',
    ja: '仮置き',
    ko: '임시 문구'
  }),
  'home.night.commentC': msg({
    zh: '占位用，待编辑',
    en: 'Draft placeholder',
    ja: '仮置き',
    ko: '임시 문구'
  }),
  'home.night.send': same('SEND'),
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
