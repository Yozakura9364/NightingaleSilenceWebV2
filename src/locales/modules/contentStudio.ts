import { msg, same } from '@/locales/messageHelpers'
import type { UiMessageMap } from '@/locales/types'

export const contentStudioUiMessages: UiMessageMap = {
  // Toolbar
  'contentStudio.toolbar.bold': msg({ zh: '粗体', en: 'Bold', ja: '太字', ko: '굵게' }),
  'contentStudio.toolbar.italic': msg({ zh: '斜体', en: 'Italic', ja: '斜体', ko: '기울임' }),
  'contentStudio.toolbar.underline': msg({ zh: '下划线', en: 'Underline', ja: '下線', ko: '밑줄' }),
  'contentStudio.toolbar.strike': msg({
    zh: '删除线',
    en: 'Strikethrough',
    ja: '打ち消し線',
    ko: '취소선'
  }),
  'contentStudio.toolbar.heading2': msg({
    zh: '标题2',
    en: 'Heading 2',
    ja: '見出し2',
    ko: '제목2'
  }),
  'contentStudio.toolbar.heading3': msg({
    zh: '标题3',
    en: 'Heading 3',
    ja: '見出し3',
    ko: '제목3'
  }),
  'contentStudio.toolbar.heading4': msg({
    zh: '标题4',
    en: 'Heading 4',
    ja: '見出し4',
    ko: '제목4'
  }),
  'contentStudio.toolbar.bulletList': msg({
    zh: '无序列表',
    en: 'Bullet List',
    ja: '箇条書き',
    ko: '글머리 기호 목록'
  }),
  'contentStudio.toolbar.orderedList': msg({
    zh: '有序列表',
    en: 'Ordered List',
    ja: '番号付きリスト',
    ko: '번호 매기기 목록'
  }),
  'contentStudio.toolbar.blockquote': msg({
    zh: '引用',
    en: 'Blockquote',
    ja: '引用',
    ko: '인용구'
  }),
  'contentStudio.toolbar.codeBlock': msg({
    zh: '代码块',
    en: 'Code Block',
    ja: 'コードブロック',
    ko: '코드 블록'
  }),
  'contentStudio.toolbar.undo': msg({ zh: '撤销', en: 'Undo', ja: '元に戻す', ko: '실행 취소' }),
  'contentStudio.toolbar.redo': msg({ zh: '重做', en: 'Redo', ja: 'やり直し', ko: '다시 실행' }),
  'contentStudio.toolbar.alignLeft': msg({
    zh: '左对齐',
    en: 'Align Left',
    ja: '左揃え',
    ko: '왼쪽 정렬'
  }),
  'contentStudio.toolbar.alignCenter': msg({
    zh: '居中对齐',
    en: 'Align Center',
    ja: '中央揃え',
    ko: '가운데 정렬'
  }),
  'contentStudio.toolbar.alignRight': msg({
    zh: '右对齐',
    en: 'Align Right',
    ja: '右揃え',
    ko: '오른쪽 정렬'
  }),
  'contentStudio.toolbar.boldIcon': same('B'),
  'contentStudio.toolbar.italicIcon': same('I'),
  'contentStudio.toolbar.underlineIcon': same('U'),
  'contentStudio.toolbar.strikeIcon': same('S'),
  'contentStudio.toolbar.heading2Icon': same('H2'),
  'contentStudio.toolbar.heading3Icon': same('H3'),
  'contentStudio.toolbar.heading4Icon': same('H4'),
  'contentStudio.toolbar.codeBlockIcon': same('</>'),
  // Table toolbar
  'contentStudio.table.addColumnBefore': msg({
    zh: '左侧插入列',
    en: 'Add Column Before',
    ja: '左に列を追加',
    ko: '왼쪽에 열 추가'
  }),
  'contentStudio.table.addColumnAfter': msg({
    zh: '右侧插入列',
    en: 'Add Column After',
    ja: '右に列を追加',
    ko: '오른쪽에 열 추가'
  }),
  'contentStudio.table.deleteColumn': msg({
    zh: '删除列',
    en: 'Delete Column',
    ja: '列を削除',
    ko: '열 삭제'
  }),
  'contentStudio.table.addRowBefore': msg({
    zh: '上方插入行',
    en: 'Add Row Before',
    ja: '上に行を追加',
    ko: '위에 행 추가'
  }),
  'contentStudio.table.addRowAfter': msg({
    zh: '下方插入行',
    en: 'Add Row After',
    ja: '下に行を追加',
    ko: '아래에 행 추가'
  }),
  'contentStudio.table.deleteRow': msg({
    zh: '删除行',
    en: 'Delete Row',
    ja: '行を削除',
    ko: '행 삭제'
  }),
  'contentStudio.table.headerColumn': msg({
    zh: '切换列标题',
    en: 'Toggle Header Column',
    ja: '列ヘッダー切替',
    ko: '열 헤더 전환'
  }),
  'contentStudio.table.headerRow': msg({
    zh: '切换行标题',
    en: 'Toggle Header Row',
    ja: '行ヘッダー切替',
    ko: '행 헤더 전환'
  }),
  'contentStudio.table.mergeCells': msg({
    zh: '合并单元格',
    en: 'Merge Cells',
    ja: 'セル結合',
    ko: '셀 병합'
  }),
  'contentStudio.table.splitCell': msg({
    zh: '拆分单元格',
    en: 'Split Cell',
    ja: 'セル分割',
    ko: '셀 분할'
  }),
  'contentStudio.table.fixTable': msg({
    zh: '修复表格',
    en: 'Fix Table',
    ja: '表を修正',
    ko: '표 수정'
  }),
  // Draft page
  'contentStudio.createDraft': msg({
    zh: '新建文章',
    en: 'New Draft',
    ja: '新規作成',
    ko: '새 글'
  }),
  'contentStudio.editorLoading': msg({
    zh: '加载编辑器中…',
    en: 'Loading editor…',
    ja: 'エディターを読み込み中…',
    ko: '편집기 불러오는 중…'
  }),
  'contentStudio.saving': msg({ zh: '保存中…', en: 'Saving…', ja: '保存中…', ko: '저장 중…' }),
  'contentStudio.saved': msg({ zh: '已保存', en: 'Saved', ja: '保存済み', ko: '저장됨' }),
  'contentStudio.saveFailed': msg({
    zh: '保存失败',
    en: 'Save failed',
    ja: '保存失敗',
    ko: '저장 실패'
  }),
  'contentStudio.conflict': msg({
    zh: '冲突：请刷新恢复',
    en: 'Conflict: refresh to recover',
    ja: '競合：更新して回復',
    ko: '충돌: 새로고침으로 복구'
  }),
  'contentStudio.insertImage': msg({
    zh: '插入图片',
    en: 'Insert Image',
    ja: '画像を挿入',
    ko: '이미지 삽입'
  }),
  'contentStudio.uploadImage': msg({
    zh: '上传图片',
    en: 'Upload Image',
    ja: '画像をアップロード',
    ko: '이미지 업로드'
  }),

  'contentStudio.uploadedLabel': msg({
    zh: '已上传',
    en: 'Uploaded',
    ja: 'アップロード済み',
    ko: '업로드됨'
  }),
  'contentStudio.insertToEditor': msg({ zh: '插入到编辑器', en: 'Insert', ja: '挿入', ko: '삽입' }),
  'contentStudio.retry': msg({ zh: '重试', en: 'Retry', ja: '再試行', ko: '재시도' }),
  'contentStudio.cancel': msg({ zh: '取消', en: 'Cancel', ja: 'キャンセル', ko: '취소' }),
  'contentStudio.titlePlaceholder': msg({
    zh: '文章标题',
    en: 'Title',
    ja: 'タイトル',
    ko: '제목'
  }),
  'contentStudio.summaryPlaceholder': msg({
    zh: '摘要（可选）',
    en: 'Summary (optional)',
    ja: '概要（任意）',
    ko: '요약 (선택)'
  }),
  'contentStudio.tagsPlaceholder': msg({
    zh: '逗号分隔',
    en: 'Comma separated',
    ja: 'カンマ区切り',
    ko: '쉼표로 구분'
  }),
  'contentStudio.coverMediaId': msg({
    zh: '封面图片ID',
    en: 'Cover Media ID',
    ja: 'カバー画像ID',
    ko: '커버 이미지 ID'
  }),
  'contentStudio.coverPlaceholder': msg({
    zh: '媒体ID（可选）',
    en: 'Media ID (optional)',
    ja: 'メディアID（任意）',
    ko: '미디어 ID (선택)'
  }),
  'contentStudio.untitled': msg({ zh: '未命名文章', en: 'Untitled', ja: '無題', ko: '제목 없음' }),
  'contentStudio.gallery.empty': msg({
    zh: '暂无图片',
    en: 'No images',
    ja: '画像なし',
    ko: '이미지 없음'
  }),
  'contentStudio.gallery.remove': msg({ zh: '移除', en: 'Remove', ja: '削除', ko: '제거' }),
  'contentStudio.gallery.addImages': msg({
    zh: '添加图片',
    en: 'Add images',
    ja: '画像を追加',
    ko: '이미지 추가'
  }),
  'contentStudio.gallery.twoColumn': msg({ zh: '双列', en: 'Two-column', ja: '2列', ko: '2열' }),
  'contentStudio.gallery.threeColumn': msg({
    zh: '三列',
    en: 'Three-column',
    ja: '3列',
    ko: '3열'
  }),
  'contentStudio.gallery.grid': msg({ zh: '网格', en: 'Grid', ja: 'グリッド', ko: '격자' }),

  'contentStudio.imageAlt': msg({
    zh: '替代文本',
    en: 'Alt text',
    ja: '代替テキスト',
    ko: '대체 텍스트'
  }),
  'contentStudio.imageCaption': msg({ zh: '图注', en: 'Caption', ja: 'キャプション', ko: '캡션' }),
  'contentStudio.imageAlign': msg({ zh: '对齐', en: 'Align', ja: '配置', ko: '정렬' }),
  'contentStudio.imageWidth': msg({ zh: '宽度', en: 'Width', ja: '幅', ko: '너비' }),
  'contentStudio.addToGallery': msg({
    zh: '加入画廊',
    en: 'Add to gallery',
    ja: 'ギャラリーに追加',
    ko: '갤러리에 추가'
  }),
  'contentStudio.gallery.moveUp': msg({
    zh: '上移',
    en: 'Move up',
    ja: '上へ移動',
    ko: '위로 이동'
  }),
  'contentStudio.gallery.moveDown': msg({
    zh: '下移',
    en: 'Move down',
    ja: '下へ移動',
    ko: '아래로 이동'
  }),

  'contentStudio.uploading': msg({
    zh: '上传中…',
    en: 'Uploading…',
    ja: 'アップロード中…',
    ko: '업로드 중…'
  }),

  // Export (NGA BBCode)
  'contentStudio.export.title': msg({
    zh: '导出为 NGA BBCode',
    en: 'Export as NGA BBCode',
    ja: 'NGA BBCode に書き出す',
    ko: 'NGA BBCode로 내보내기'
  }),
  'contentStudio.export.copy': msg({ zh: '复制', en: 'Copy', ja: 'コピー', ko: '복사' }),
  'contentStudio.export.copied': msg({
    zh: '已复制 ✓',
    en: 'Copied ✓',
    ja: 'コピーしました ✓',
    ko: '복사됨 ✓'
  }),
  'contentStudio.export.download': msg({
    zh: '下载 .txt',
    en: 'Download .txt',
    ja: '.txt をダウンロード',
    ko: '.txt 다운로드'
  }),
  'contentStudio.export.previewAria': msg({
    zh: 'BBCode 预览',
    en: 'BBCode preview',
    ja: 'BBCode プレビュー',
    ko: 'BBCode 미리보기'
  }),
  'contentStudio.export.blockingNotice': msg({
    zh: '存在阻断性损失：导出内容不完整，请先修复后再使用。',
    en: 'Blocking losses present: the export is incomplete; fix them before use.',
    ja: 'ブロックレベルの損失があります：書き出しが不完全です。修正してから使用してください。',
    ko: '차단 손실이 있습니다: 내보낸 내용이 불완전합니다. 수정 후 사용하세요.'
  }),
  'contentStudio.export.lossHeading': msg({
    zh: '转换损失',
    en: 'Conversion losses',
    ja: '変換ロス',
    ko: '변환 손실'
  }),
  'contentStudio.export.lossNone': msg({
    zh: '无损失',
    en: 'No losses',
    ja: 'ロスなし',
    ko: '손실 없음'
  }),
  'contentStudio.export.loss.unknown-node': msg({
    zh: '未知节点已跳过',
    en: 'Unknown node skipped',
    ja: '未知のノードをスキップ',
    ko: '알 수 없는 노드 생략됨'
  }),
  'contentStudio.export.loss.heading-degraded': msg({
    zh: '标题已降级为粗体+字号',
    en: 'Heading degraded to bold + size',
    ja: '見出しは太字＋サイズに変換',
    ko: '제목이 굵게+크기로 변환됨'
  }),
  'contentStudio.export.loss.text-align-degraded': msg({
    zh: '对齐方式已忽略',
    en: 'Text alignment ignored',
    ja: '配置は無視されます',
    ko: '정렬 무시됨'
  }),
  'contentStudio.export.loss.caption-as-text': msg({
    zh: '图注转为文本',
    en: 'Caption converted to text',
    ja: 'キャプションはテキストに変換',
    ko: '캡션이 텍스트로 변환됨'
  }),
  'contentStudio.export.loss.gallery-flattened': msg({
    zh: '画廊按顺序展开为单图',
    en: 'Gallery flattened to single images',
    ja: 'ギャラリーは単一画像に展開',
    ko: '갤러리가 단일 이미지로 펼쳐짐'
  }),
  'contentStudio.export.loss.gallery-layout-degraded': msg({
    zh: '画廊布局已忽略（按 NGA 相册默认排列）',
    en: 'Gallery layout ignored (NGA album default)',
    ja: 'ギャラリーのレイアウトは無視（NGA アルバム既定）',
    ko: '갤러리 레이아웃 무시됨(NGA 앨범 기본)'
  }),
  'contentStudio.export.loss.table-header-degraded': msg({
    zh: '表头降级为加粗单元格',
    en: 'Table header degraded to bold cell',
    ja: '見出しセルは太字セルに変換',
    ko: '표 머리글이 굵은 셀로 변환됨'
  }),
  'contentStudio.export.loss.unstable-image-url': msg({
    zh: '图片 URL 不稳定或未授权，已阻断',
    en: 'Unstable or unauthorized image URL blocked',
    ja: '不安定・未承認の画像 URL をブロック',
    ko: '불안정하거나 승인되지 않은 이미지 URL 차단됨'
  }),
  'contentStudio.export.loss.unknown-mark': msg({
    zh: '未知样式标记已忽略（文字已保留）',
    en: 'Unknown mark ignored (text kept)',
    ja: '未知のマークは無視（文字は保持）',
    ko: '알 수 없는 마크 무시(텍스트 유지)'
  }),
  'contentStudio.editor.bubble.code': msg({
    zh: '行内代码',
    en: 'Inline code',
    ja: 'インラインコード',
    ko: '인라인 코드'
  }),
  'contentStudio.editor.bubble.link': msg({ zh: '链接', en: 'Link', ja: 'リンク', ko: '링크' }),
  'contentStudio.editor.bubble.color': msg({
    zh: '文字颜色',
    en: 'Text color',
    ja: '文字色',
    ko: '글자 색'
  }),
  'contentStudio.editor.bubble.size': msg({
    zh: '字号',
    en: 'Font size',
    ja: '文字サイズ',
    ko: '글자 크기'
  }),
  'contentStudio.editor.bubble.align': msg({ zh: '对齐', en: 'Align', ja: '配置', ko: '정렬' }),
  'contentStudio.editor.bubble.linkPlaceholder': msg({
    zh: '粘贴或输入链接',
    en: 'Paste or type a link',
    ja: 'リンクを貼り付け・入力',
    ko: '링크 붙여넣기 또는 입력'
  }),
  'contentStudio.draftTitle': msg({ zh: '标题', en: 'Title', ja: 'タイトル', ko: '제목' }),
  'contentStudio.draftSummary': msg({ zh: '摘要', en: 'Summary', ja: '概要', ko: '요약' }),
  'contentStudio.draftTags': msg({ zh: '标签', en: 'Tags', ja: 'タグ', ko: '태그' }),
  'contentStudio.publicIdLabel': msg({
    zh: '公开 ID',
    en: 'Public ID',
    ja: '公開 ID',
    ko: '공개 ID'
  }),
  'contentStudio.editor.slash.paragraph': msg({
    zh: '正文',
    en: 'Paragraph',
    ja: '段落',
    ko: '본문'
  }),
  'contentStudio.editor.slash.heading2': msg({
    zh: '二级标题',
    en: 'Heading 2',
    ja: '見出し2',
    ko: '제목 2'
  }),
  'contentStudio.editor.slash.heading3': msg({
    zh: '三级标题',
    en: 'Heading 3',
    ja: '見出し3',
    ko: '제목 3'
  }),
  'contentStudio.editor.slash.bulletList': msg({
    zh: '无序列表',
    en: 'Bullet list',
    ja: '箇条書き',
    ko: '글머리 목록'
  }),
  'contentStudio.editor.slash.orderedList': msg({
    zh: '有序列表',
    en: 'Numbered list',
    ja: '番号付きリスト',
    ko: '번호 목록'
  }),
  'contentStudio.editor.slash.blockquote': msg({ zh: '引用', en: 'Quote', ja: '引用', ko: '인용' }),
  'contentStudio.editor.slash.codeBlock': msg({
    zh: '代码块',
    en: 'Code block',
    ja: 'コードブロック',
    ko: '코드 블록'
  }),
  'contentStudio.editor.slash.horizontalRule': msg({
    zh: '分割线',
    en: 'Divider',
    ja: '区切り線',
    ko: '구분선'
  }),
  'contentStudio.editor.slash.table': msg({ zh: '表格', en: 'Table', ja: '表', ko: '표' }),
  'contentStudio.editor.slash.image': msg({ zh: '图片', en: 'Image', ja: '画像', ko: '이미지' }),
  'contentStudio.editor.slash.gallery': msg({
    zh: '画廊',
    en: 'Gallery',
    ja: 'ギャラリー',
    ko: '갤러리'
  }),
  'contentStudio.editor.slash.collapse': msg({
    zh: '折叠块',
    en: 'Collapse',
    ja: '折りたたみ',
    ko: '접기 블록'
  }),

  // Publication (T046)
  'contentStudio.publication.title': msg({ zh: '发布', en: 'Publication', ja: '公開', ko: '게시' }),
  'contentStudio.status.draft': msg({ zh: '草稿', en: 'Draft', ja: '下書き', ko: '초안' }),
  'contentStudio.status.published': msg({
    zh: '已发布',
    en: 'Published',
    ja: '公開済み',
    ko: '게시됨'
  }),
  'contentStudio.status.archived': msg({
    zh: '已归档',
    en: 'Archived',
    ja: 'アーカイブ済み',
    ko: '보관됨'
  }),
  'contentStudio.publication.preview': msg({
    zh: '预览',
    en: 'Preview',
    ja: 'プレビュー',
    ko: '미리보기'
  }),
  'contentStudio.publication.publish': msg({
    zh: '发布',
    en: 'Publish',
    ja: '公開する',
    ko: '게시'
  }),
  'contentStudio.publication.withdraw': msg({
    zh: '撤回',
    en: 'Withdraw',
    ja: '公開を取り消す',
    ko: '게시 취소'
  }),
  'contentStudio.publication.archive': msg({
    zh: '归档',
    en: 'Archive',
    ja: 'アーカイブ',
    ko: '보관'
  }),
  'contentStudio.publication.restore': msg({ zh: '恢复', en: 'Restore', ja: '復元', ko: '복원' }),
  'contentStudio.publication.viewPublic': msg({
    zh: '打开公开页面',
    en: 'View public page',
    ja: '公開ページを開く',
    ko: '공개 페이지 열기'
  }),
  'contentStudio.publication.publishedAt': msg({
    zh: '发布于',
    en: 'Published at',
    ja: '公開日時',
    ko: '게시일'
  }),
  'contentStudio.publication.publishConfirm': msg({
    zh: '确认发布？发布后公开访客即可读取当前版本。',
    en: 'Publish now? Visitors will be able to read the current version.',
    ja: '公開しますか？現在のバージョンが訪問者に表示されます。',
    ko: '게시할까요? 현재 버전이 방문자에게 공개됩니다.'
  }),
  'contentStudio.publication.withdrawConfirm': msg({
    zh: '确认撤回？公开页面将不再显示这篇文章。',
    en: 'Withdraw this publication? The public page will no longer show it.',
    ja: '公開を取り消しますか？公開ページから表示されなくなります。',
    ko: '게시를 취소할까요? 공개 페이지에 더 이상 표시되지 않습니다.'
  }),
  'contentStudio.publication.archiveConfirm': msg({
    zh: '确认归档？归档后文章移出博客列表，可随时恢复。',
    en: 'Archive this entry? It will be removed from the blog list and can be restored later.',
    ja: 'アーカイブしますか？ブログリストから外れますが、後で復元できます。',
    ko: '보관할까요? 블로그 목록에서 제거되며 나중에 복원할 수 있습니다.'
  }),
  'contentStudio.publication.restoreConfirm': msg({
    zh: '确认恢复为草稿？恢复后不会自动发布。',
    en: 'Restore to draft? It will not be published automatically.',
    ja: '下書きに戻しますか？自動的に公開されることはありません。',
    ko: '초안으로 복원할까요? 자동으로 게시되지 않습니다.'
  }),
  'contentStudio.publication.operationFailed': msg({
    zh: '操作失败',
    en: 'Operation failed',
    ja: '操作に失敗しました',
    ko: '작업 실패'
  }),
  'contentStudio.publication.saveFirst': msg({
    zh: '有未保存的修改，已先自动保存；保存失败，请稍后重试。',
    en: 'Unsaved changes were being saved automatically; the save failed, please retry.',
    ja: '未保存の変更を自動保存しています。保存に失敗したため、再試行してください。',
    ko: '저장되지 않은 변경 사항을 자동 저장하는 중입니다. 저장에 실패했으니 다시 시도하세요.'
  }),
  'contentStudio.publication.previewInvalid': msg({
    zh: '当前内容无法生成预览，请检查正文结构。',
    en: 'Cannot build a preview from the current content; check the document structure.',
    ja: '現在の内容でプレビューを生成できません。本文の構造を確認してください。',
    ko: '현재 내용으로 미리보기를 생성할 수 없습니다. 본문 구조를 확인하세요.'
  }),
  'contentStudio.publication.error.EMPTY_DOCUMENT': msg({
    zh: '正文为空，不能发布',
    en: 'Empty body cannot be published',
    ja: '本文が空のため公開できません',
    ko: '본문이 비어 있어 게시할 수 없음'
  }),
  'contentStudio.publication.error.METADATA_INVALID': msg({
    zh: '元数据不完整（标题必填，最多 120 字）',
    en: 'Invalid metadata (title required, max 120 chars)',
    ja: 'メタデータが無効です（タイトル必須、最大120字）',
    ko: '메타데이터가 잘못됨(제목 필수, 최대 120자)'
  }),
  'contentStudio.publication.error.DOCUMENT_INVALID': msg({
    zh: '正文结构无效',
    en: 'Invalid document structure',
    ja: '本文の構造が無効です',
    ko: '본문 구조가 잘못됨'
  }),
  'contentStudio.publication.error.MEDIA_NOT_FOUND': msg({
    zh: '引用的图片不存在',
    en: 'Referenced media not found',
    ja: '参照メディアが見つかりません',
    ko: '참조된 미디어를 찾을 수 없음'
  }),
  'contentStudio.publication.error.MEDIA_NOT_VERIFIED': msg({
    zh: '图片尚未通过远程校验，不能发布',
    en: 'Media has not passed the remote check',
    ja: 'メディアがリモート検証を通過していません',
    ko: '미디어가 원격 검증을 통과하지 못함'
  }),
  'contentStudio.publication.error.MEDIA_URL_UNSTABLE': msg({
    zh: '图片 URL 不稳定（需为受信主机上的永久 HTTPS 地址）',
    en: 'Unstable media URL (needs a permanent HTTPS URL on the trusted host)',
    ja: '不安定なメディア URL（信頼ホストの恒久 HTTPS URL が必要）',
    ko: '불안정한 미디어 URL(신뢰 호스트의 영구 HTTPS URL 필요)'
  }),
  'contentStudio.publication.error.MEDIA_NOT_PUBLIC': msg({
    zh: '图片不可公开读取',
    en: 'Media is not publicly readable',
    ja: 'メディアが公開読み取り可能ではありません',
    ko: '미디어를 공개적으로 읽을 수 없음'
  }),
  'contentStudio.publication.error.CONFLICT': msg({
    zh: '版本冲突：请重新打开草稿后再试',
    en: 'Revision conflict: reopen the draft and retry',
    ja: 'リビジョン競合：下書きを開き直して再試行してください',
    ko: '리비전 충돌: 초서를 다시 열고 재시도하세요'
  }),
  'contentStudio.publication.error.STATE_CONFLICT': msg({
    zh: '状态冲突：当前状态不允许此操作',
    en: 'State conflict: this operation is not allowed in the current state',
    ja: '状態競合：現在の状態ではこの操作はできません',
    ko: '상태 충돌: 현재 상태에서는 이 작업을 수행할 수 없음'
  }),
  'contentStudio.deleteDraft': msg({
    zh: '删除草稿',
    en: 'Delete draft',
    ja: '下書きを削除',
    ko: '초안 삭제'
  }),
  'contentStudio.deleteDraftConfirm': msg({
    zh: '确认删除这篇草稿？删除后不可恢复。',
    en: 'Delete this draft? This cannot be undone.',
    ja: 'この下書きを削除しますか？元に戻せません。',
    ko: '이 초안을 삭제할까요? 되돌릴 수 없습니다.'
  }),
  'contentStudio.preview.title': msg({
    zh: '发布预览',
    en: 'Publish preview',
    ja: '公開プレビュー',
    ko: '게시 미리보기'
  })
} as const
