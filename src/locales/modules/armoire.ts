import { draft, msg } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const armoireUiMessages: UiMessageMap = {
  'nsarmoire.action.downloadHelper': msg({
    zh: '下载管家',
    en: 'Download helper',
    ja: 'ヘルパーをダウンロード',
    ko: '헬퍼 다운로드'
  }),
  'nsarmoire.landing.guide': msg({
    zh: '使用方法',
    en: 'How to use',
    ja: '使い方',
    ko: '사용 방법'
  }),
  'nsarmoire.landing.summary': msg({
    zh: 'FF14衣柜清理助手',
    en: 'The complete NSArmoire workbench now runs in the local desktop application instead of the website.',
    ja: '衣柜管家の完全な機能はローカルデスクトップアプリへ移行し、Webサイトからは読み込まれません。',
    ko: '의상장 도우미의 전체 기능은 로컬 데스크톱 앱으로 이전되어 웹사이트에서 불러오지 않습니다.'
  }),
  'nsarmoire.status.helperIdle.message': msg({
    zh: draft('从 GitHub Release 下载衣柜管家。'),
    en: 'Download and start the NSArmoire local helper from GitHub Releases to read the glamour dresser snapshot directly.',
    ja: 'GitHub ReleasesからNSArmoireローカルヘルパーをダウンロードして起動すると、ミラージュドレッサーsnapshotを直接読み取れます。',
    ko: 'GitHub Releases에서 NSArmoire 로컬 헬퍼를 다운로드해 시작하면 투영대 snapshot을 직접 읽을 수 있습니다.'
  }),
  'nsarmoire.status.helperGameNotFound.message': msg({
    zh: draft('先启动游戏客户端，再启动NSArmoireButler.exe。'),
    en: 'Start the game client, then reconnect the local helper.',
    ja: '先にゲームクライアントを起動してから、ローカルヘルパーに再接続してください。',
    ko: '먼저 게임 클라이언트를 실행한 뒤 로컬 헬퍼에 다시 연결하세요.'
  }),
  'nsarmoire.status.helperDresserNotLoaded.message': msg({
    zh: draft('在游戏中分别打开陆行鸟鞍囊、收藏柜、投影台、雇员背包。'),
    en: 'Open or refresh the glamour dresser in game, then read local data again.',
    ja: 'ゲーム内でミラージュドレッサーを開くか更新してから、ローカルデータを再読み込みしてください。',
    ko: '게임에서 투영대를 열거나 새로고침한 뒤 로컬 데이터를 다시 읽으세요.'
  })
}
