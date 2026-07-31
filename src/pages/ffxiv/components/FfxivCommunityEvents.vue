<template>
  <section class="ffxiv-calendar-section" :aria-labelledby="sectionTitleId">
    <header class="ffxiv-calendar-section__header">
      <h2 :id="sectionTitleId" class="ffxiv-calendar-section__title ns-heading-bloom">
        {{ t(textKeys.clocksCommunity) }}
      </h2>

      <time class="ffxiv-calendar-section__range">
        {{ visibleRangeLabel }}
      </time>
    </header>

    <AppStatus v-if="dataError" compact tone="warning" :message="t(textKeys.communityDataError)" />
    <AppStatus v-else-if="loading" compact tone="loading" :message="t(textKeys.communityLoading)" />
    <AppStatus v-else-if="!hasVisibleEvents" compact :message="t(textKeys.communityEmpty)" />

    <div
      ref="timelineHost"
      class="ffxiv-calendar-timeline"
      tabindex="0"
      role="region"
      :aria-label="t(textKeys.clocksCommunity)"
    ></div>
  </section>
</template>

<script setup lang="ts">
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Timeline } from 'vis-timeline/standalone'
import type { DataGroup, DataItem, TimelineAnimationOptions, TimelineOptions } from 'vis-timeline'
import AppStatus from '@/components/AppStatus.vue'
import { useFetch } from '@/composables/useFetch'
import {
  getCommunityEventStatuses,
  parseCommunityEventsDocument,
  type CommunityEventRegion,
  type CommunityEventStatus,
  type CommunityEventsDocument
} from '@/lib/ffxiv/time/communityEvents'
import { ffxivTextKeys as textKeys } from '@/locales/keys/ffxiv'
import { useLocale } from '@/stores/locale'

const props = defineProps<{
  now: number
}>()

interface CommunityTimelineItem extends DataItem {
  event: CommunityEventStatus
  displayEndsAtMs: number
}

const STATIC_EVENTS_URL = '/data/ffxiv/community-events.json'
const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DESKTOP_VISIBLE_DAYS = 35
const sectionTitleId = 'ffxiv-community-clocks-title'
const WINDOW_ANIMATION = {
  animation: { duration: 280, easingFunction: 'easeInOutQuad' }
} satisfies TimelineAnimationOptions
const regionOptions: ReadonlyArray<{
  region: CommunityEventRegion
  labelKey: string
}> = [
  { region: 'common', labelKey: textKeys.communityRegionCommon },
  { region: 'cn', labelKey: textKeys.communityRegionCn },
  { region: 'global', labelKey: textKeys.communityRegionGlobal }
]
const regionOrder = regionOptions.map(({ region }) => region)

const { api } = useFetch()
const { current: locale, t } = useLocale()
const eventsDocument = ref<CommunityEventsDocument | null>(null)
const timelineHost = ref<HTMLElement | null>(null)
const visibleRangeLabel = ref('')
const visibleWindow = ref({ startAt: 0, endAt: 0 })
const loading = ref(true)
const dataError = ref(false)

let timeline: Timeline | null = null
let resizeObserver: ResizeObserver | null = null
let refreshTimer = 0
let compactTimeline = false
let contentPositionFrame = 0

const events = computed(() =>
  eventsDocument.value
    ? getCommunityEventStatuses(eventsDocument.value, props.now, { includeEnded: true })
    : []
)
const hasVisibleEvents = computed(() => {
  const { startAt, endAt } = visibleWindow.value

  if (endAt <= startAt) return events.value.length > 0

  return events.value.some(
    (event) => getEventDisplayEndAt(event) > startAt && event.startsAtMs < endAt
  )
})

function getEventDisplayEndAt(event: CommunityEventStatus) {
  return event.endsAtMs ?? event.startsAtMs + DAY_MS
}

function getSourceUrls(): string[] {
  const runtimeUrl = import.meta.env.VITE_FFXIV_COMMUNITY_EVENTS_URL?.trim()
  return [...new Set([runtimeUrl, STATIC_EVENTS_URL].filter((url): url is string => Boolean(url)))]
}

async function loadEvents() {
  for (const url of getSourceUrls()) {
    try {
      eventsDocument.value = parseCommunityEventsDocument(
        await api<unknown>(url, { cache: 'no-store' })
      )
      dataError.value = false
      loading.value = false
      return
    } catch {
      // Try the checked-in fallback before exposing an error state.
    }
  }

  dataError.value = true
  loading.value = false
}

function createGroups(): DataGroup[] {
  return regionOptions.map(({ region, labelKey }) => ({
    id: region,
    content: t(labelKey),
    className: `timeline-group--${region}`
  }))
}

function createItems(): CommunityTimelineItem[] {
  return events.value.map((event) => {
    const displayEndsAtMs = getEventDisplayEndAt(event)
    const isCompact = displayEndsAtMs - event.startsAtMs <= DAY_MS
    const region = event.region ?? 'cn'

    return {
      id: event.id,
      group: region,
      subgroup: event.id,
      content: event.title,
      title: formatEventTooltip(event, displayEndsAtMs),
      start: new Date(event.startsAtMs),
      end: new Date(displayEndsAtMs),
      type: 'range',
      className: [
        `timeline-item--${region}`,
        `timeline-item--${event.state}`,
        isCompact ? 'timeline-item--compact' : ''
      ]
        .filter(Boolean)
        .join(' '),
      selectable: false,
      event,
      displayEndsAtMs
    }
  })
}

function renderTimelineItem(item: CommunityTimelineItem) {
  const link = document.createElement('a')
  const title = document.createElement('strong')
  const end = document.createElement('time')
  const tooltip = formatEventTooltip(item.event, item.displayEndsAtMs)

  link.className = 'timeline-event-copy'
  link.href = item.event.url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.ariaLabel = `${t(textKeys.communityOpenLink)} ${tooltip}`
  link.draggable = false
  title.className = 'timeline-event-copy__title'
  title.textContent = item.event.title
  end.className = 'timeline-event-copy__end'
  end.dateTime = new Date(item.displayEndsAtMs).toISOString()
  end.textContent = `~ ${formatEventTimestamp(item.displayEndsAtMs)}`
  link.append(title, end)

  return link
}

function createOptions(): TimelineOptions {
  return {
    start: windowStart(),
    end: defaultWindowEnd(),
    align: 'center',
    autoResize: true,
    editable: false,
    groupOrder: (left, right) =>
      regionOrder.indexOf(left.id as CommunityEventRegion) -
      regionOrder.indexOf(right.id as CommunityEventRegion),
    horizontalScroll: true,
    margin: responsiveMargin(),
    moveable: true,
    multiselect: false,
    orientation: {
      axis: 'top',
      item: 'top'
    },
    selectable: false,
    showCurrentTime: true,
    showMajorLabels: true,
    showMinorLabels: true,
    showTooltips: true,
    stack: false,
    stackSubgroups: true,
    template: (item) => renderTimelineItem(item as CommunityTimelineItem),
    timeAxis: responsiveTimeAxis(),
    format: {
      minorLabels: formatMinorLabel,
      majorLabels: formatMajorLabel
    },
    zoomable: true,
    zoomKey: 'ctrlKey',
    zoomMin: 14 * DAY_MS,
    zoomMax: 62 * DAY_MS
  }
}

function responsiveMargin(): TimelineOptions['margin'] {
  return {
    axis: compactTimeline ? 14 : 18,
    item: {
      horizontal: 8,
      vertical: compactTimeline ? 12 : 18
    }
  }
}

function responsiveTimeAxis(): TimelineOptions['timeAxis'] {
  return {
    scale: 'day',
    step: compactTimeline ? 3 : 1
  }
}

function windowStart() {
  const date = new Date(props.now)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dateAfterWindowStart(days: number) {
  const start = windowStart()
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + days)
}

function defaultWindowEnd() {
  if (compactTimeline) {
    const start = windowStart()
    return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate())
  }

  return dateAfterWindowStart(DESKTOP_VISIBLE_DAYS)
}

function formatMinorLabel(date: Date, scale: string) {
  const value = new Date(date)
  if (scale === 'month') return String(value.getMonth() + 1)
  if (scale === 'year') return String(value.getFullYear())
  return String(value.getDate())
}

function formatMajorLabel(date: Date, scale: string) {
  const value = new Date(date)
  if (scale === 'month' || scale === 'year') return String(value.getFullYear())
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function formatEventTimestamp(timestamp: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(timestamp)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`
}

function formatEventTooltip(event: CommunityEventStatus, displayEndsAtMs: number) {
  return `${event.title}\n~ ${formatEventTimestamp(displayEndsAtMs)}`
}

function formatRangeDate(timestamp: number) {
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(timestamp)
}

function updateVisibleRangeLabel() {
  if (!timeline) return
  const { start, end } = timeline.getWindow()
  visibleWindow.value = { startAt: start.getTime(), endAt: end.getTime() }
  visibleRangeLabel.value = `${formatRangeDate(start.getTime())} - ${formatRangeDate(
    end.getTime() - 1
  )}`
}

function positionVisibleItemContent() {
  contentPositionFrame = 0
  const host = timelineHost.value
  const center = host?.querySelector<HTMLElement>('.vis-panel.vis-center')
  if (!host || !center) return

  const centerRect = center.getBoundingClientRect()
  const compactCopyWidth = compactTimeline ? 144 : 176
  const compactGap = 4

  for (const item of host.querySelectorAll<HTMLElement>('.vis-item.vis-range')) {
    const itemRect = item.getBoundingClientRect()
    const itemStyle = window.getComputedStyle(item)
    const contentOrigin = itemRect.left + Number.parseFloat(itemStyle.borderLeftWidth || '0')
    const contentEnd = itemRect.right - Number.parseFloat(itemStyle.borderRightWidth || '0')
    const visibleLeft = Math.max(contentOrigin, centerRect.left)
    const visibleRight = Math.min(contentEnd, centerRect.right)

    if (visibleRight <= visibleLeft) continue

    if (item.classList.contains('timeline-item--compact')) {
      const rightOffset = itemRect.right + compactGap - contentOrigin
      const leftOffset = itemRect.left - compactGap - compactCopyWidth - contentOrigin
      const canFitRight = itemRect.right + compactGap + compactCopyWidth <= centerRect.right
      const canFitLeft = itemRect.left - compactGap - compactCopyWidth >= centerRect.left
      const clampedOffset = Math.min(
        centerRect.right - contentOrigin - compactCopyWidth,
        Math.max(centerRect.left - contentOrigin, rightOffset)
      )
      const offset = canFitRight ? rightOffset : canFitLeft ? leftOffset : clampedOffset

      item.style.setProperty('--timeline-copy-offset', `${offset}px`)
      item.style.setProperty('--timeline-copy-width', `${compactCopyWidth}px`)
      continue
    }

    item.style.setProperty('--timeline-copy-offset', `${visibleLeft - contentOrigin}px`)
    item.style.setProperty('--timeline-copy-width', `${visibleRight - visibleLeft}px`)
  }
}

function scheduleVisibleItemContent() {
  if (contentPositionFrame) window.cancelAnimationFrame(contentPositionFrame)
  contentPositionFrame = window.requestAnimationFrame(positionVisibleItemContent)
}

function handleRangeChanged() {
  updateVisibleRangeLabel()
  scheduleVisibleItemContent()
}

function refreshTimelineData() {
  timeline?.setData({
    groups: createGroups(),
    items: createItems()
  })
  timeline?.redraw()
  scheduleVisibleItemContent()
}

function resetWindow() {
  timeline?.setWindow(windowStart(), defaultWindowEnd(), WINDOW_ANIMATION)
}

function refreshWhenVisible() {
  if (document.visibilityState === 'visible') {
    void loadEvents()
  }
}

onMounted(() => {
  if (!timelineHost.value) return

  compactTimeline = timelineHost.value.clientWidth < 640
  timeline = new Timeline(timelineHost.value, createItems(), createGroups(), createOptions())
  timeline.on('rangechange', scheduleVisibleItemContent)
  timeline.on('rangechanged', handleRangeChanged)
  updateVisibleRangeLabel()
  scheduleVisibleItemContent()

  resizeObserver = new ResizeObserver(([entry]) => {
    const nextCompactTimeline = entry.contentRect.width < 640
    if (nextCompactTimeline === compactTimeline) return

    compactTimeline = nextCompactTimeline
    timeline?.setOptions({
      margin: responsiveMargin(),
      timeAxis: responsiveTimeAxis()
    })
    refreshTimelineData()
    resetWindow()
  })
  resizeObserver.observe(timelineHost.value)

  void loadEvents()
  refreshTimer = window.setInterval(() => void loadEvents(), REFRESH_INTERVAL_MS)
  document.addEventListener('visibilitychange', refreshWhenVisible)
})

watch(eventsDocument, refreshTimelineData)
watch(locale, () => {
  refreshTimelineData()
  updateVisibleRangeLabel()
})

onBeforeUnmount(() => {
  window.clearInterval(refreshTimer)
  window.cancelAnimationFrame(contentPositionFrame)
  contentPositionFrame = 0
  document.removeEventListener('visibilitychange', refreshWhenVisible)
  resizeObserver?.disconnect()
  resizeObserver = null
  timeline?.destroy()
  timeline = null
})
</script>

<style scoped>
.ffxiv-calendar-section {
  display: grid;
  gap: 14px;
}

.ffxiv-calendar-section__header {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.ffxiv-calendar-section__title {
  margin: 0;
  font-family: var(--ns-font-pixel);
  font-size: 22px;
  font-weight: 950;
  line-height: 1.2;
}

.ffxiv-calendar-section__range {
  color: var(--ns-color-text-muted);
  font-family: var(--ns-font-data);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  white-space: nowrap;
}

.ffxiv-calendar-timeline {
  min-width: 0;
  outline: none;
}

.ffxiv-calendar-timeline:focus-visible {
  box-shadow: var(--ns-focus-ring);
}

.ffxiv-calendar-section :deep(.vis-timeline) {
  border: 2px solid var(--ns-pixel-border);
  border-radius: var(--ns-large-panel-border-radius);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  box-shadow: none;
}

.ffxiv-calendar-section :deep(.vis-loading-screen) {
  pointer-events: none;
}

.ffxiv-calendar-section :deep(.vis-panel.vis-background) {
  pointer-events: none;
}

.ffxiv-calendar-section :deep(.vis-panel) {
  border-color: var(--ns-pixel-border-soft);
}

.ffxiv-calendar-section :deep(.vis-panel.vis-left) {
  border-color: color-mix(in srgb, var(--ns-pixel-border-soft) 55%, transparent);
  background: color-mix(in srgb, var(--ns-color-surface-muted) 58%, transparent);
}

.ffxiv-calendar-section :deep(.vis-labelset .vis-label) {
  min-height: 3.4rem;
  border-color: color-mix(in srgb, var(--ns-pixel-border-soft) 55%, transparent);
  color: color-mix(in srgb, var(--ns-color-text-muted) 72%, transparent);
}

.ffxiv-calendar-section :deep(.vis-labelset .vis-label .vis-inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 7.5rem;
  height: 100%;
  padding: var(--ns-space-2);
  font: 600 0.72rem/1.35 var(--ns-font-ui);
  text-align: center;
  white-space: normal;
}

.ffxiv-calendar-section :deep(.vis-panel.vis-center),
.ffxiv-calendar-section :deep(.vis-panel.vis-background),
.ffxiv-calendar-section :deep(.vis-panel.vis-top) {
  background: var(--ns-color-surface-solid);
}

.ffxiv-calendar-section :deep(.vis-group) {
  min-height: 3.4rem;
  border-color: color-mix(in srgb, var(--ns-pixel-border-soft) 55%, transparent);
}

.ffxiv-calendar-section :deep(.vis-grid.vis-minor) {
  border-color: color-mix(in srgb, var(--ns-pixel-border-soft) 75%, transparent);
}

.ffxiv-calendar-section :deep(.vis-grid.vis-major) {
  border-color: var(--ns-pixel-border);
}

.ffxiv-calendar-section :deep(.vis-time-axis .vis-text) {
  color: var(--ns-color-text-muted);
  font: 600 0.75rem/1 var(--ns-font-data);
  font-variant-numeric: tabular-nums;
}

.ffxiv-calendar-section :deep(.vis-time-axis .vis-text.vis-major) {
  color: var(--ns-color-text);
  font-family: var(--ns-font-pixel);
  font-size: 0.82rem;
}

.ffxiv-calendar-section :deep(.vis-item) {
  z-index: 2;
  min-height: 3.2rem;
  border-width: 2px;
  border-radius: 0;
  color: var(--ns-color-text);
  box-shadow: none;
  font: 800 0.98rem/1.2 var(--ns-font-ui);
}

.ffxiv-calendar-section :deep(.vis-item .vis-item-content) {
  position: static !important;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  width: var(--timeline-copy-width, 100%);
  height: 100%;
  padding: 0;
  text-align: left;
  transform: translateX(var(--timeline-copy-offset, 0)) !important;
}

.ffxiv-calendar-section :deep(.vis-item .vis-item-overflow) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ffxiv-calendar-section :deep(.timeline-event-copy) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: var(--ns-space-1) var(--ns-space-2);
  color: inherit;
  text-align: left;
  text-decoration: none;
}

.ffxiv-calendar-section :deep(.timeline-event-copy__title) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ffxiv-calendar-section :deep(.timeline-event-copy__end) {
  display: block;
  margin-top: 0.16rem;
  color: color-mix(in srgb, var(--ns-color-text-muted) 86%, transparent);
  font: 600 0.7rem/1.15 var(--ns-font-data);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ffxiv-calendar-section :deep(.timeline-event-copy:hover .timeline-event-copy__title) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ffxiv-calendar-section :deep(.timeline-event-copy:focus-visible) {
  outline: 2px solid var(--ns-color-cyan);
  outline-offset: -4px;
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--compact .vis-item-overflow) {
  justify-content: flex-start;
  overflow: visible;
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--compact .vis-item-content) {
  width: var(--timeline-copy-width, 11rem);
  min-width: 11rem;
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--compact .timeline-event-copy) {
  width: max-content;
  min-width: 11rem;
  background: color-mix(in srgb, var(--ns-color-surface-solid) 94%, transparent);
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--common) {
  border-color: var(--ns-color-accent-strong);
  background: var(--ns-color-accent-soft);
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--cn) {
  border-color: var(--ns-color-warning);
  background: var(--ns-pixel-warm-surface);
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--global) {
  border-color: var(--ns-color-cyan);
  background: var(--ns-color-cyan-soft);
}

.ffxiv-calendar-section :deep(.vis-item.timeline-item--ended) {
  opacity: 0.68;
}

.ffxiv-calendar-section :deep(.vis-current-time) {
  z-index: 1;
  width: 2px;
  background-color: var(--ns-color-danger);
}

.ffxiv-calendar-section :deep(.vis-current-time::before) {
  position: absolute;
  top: 0;
  left: -4px;
  width: 10px;
  height: 7px;
  background: var(--ns-color-danger);
  content: '';
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

@media (max-width: 680px) {
  .ffxiv-calendar-section__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .ffxiv-calendar-section :deep(.vis-item) {
    min-height: 3rem;
    font-size: 0.88rem;
  }

  .ffxiv-calendar-section :deep(.vis-labelset .vis-label .vis-inner) {
    width: 5.25rem;
    padding: var(--ns-space-1);
    font-size: 0.68rem;
  }

  .ffxiv-calendar-section :deep(.vis-item.timeline-item--compact .vis-item-content),
  .ffxiv-calendar-section :deep(.vis-item.timeline-item--compact .timeline-event-copy) {
    min-width: 9rem;
  }
}
</style>
