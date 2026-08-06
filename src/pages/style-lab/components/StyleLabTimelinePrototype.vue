<template>
  <section class="style-timeline-lab" :aria-label="t(textKeys.styleLabTimelineTitle)">
    <AppPixelWindow :title="t(textKeys.styleLabTimelineTitle)" :closable="false">
      <div class="style-timeline-lab__toolbar">
        <span class="style-timeline-lab__range">{{ visibleRangeLabel }}</span>
      </div>

      <div
        ref="timelineHost"
        class="style-timeline-lab__timeline"
        tabindex="0"
        role="region"
        :aria-label="t(textKeys.styleLabTimelineAria)"
      ></div>

      <div class="style-timeline-lab__footer">
        <span>{{ t(textKeys.styleLabTimelineSource) }}</span>
      </div>
    </AppPixelWindow>
  </section>
</template>

<script setup lang="ts">
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Timeline } from 'vis-timeline/standalone'
import type { DataGroup, DataItem, TimelineAnimationOptions, TimelineOptions } from 'vis-timeline'
import AppPixelWindow from '@/components/AppPixelWindow.vue'
import { allTextKeys as textKeys } from '@/locales/keys/all'
import { useLocale } from '@/stores/locale'
import demoBannerCommonA from '@/assets/ffxiv/frontline-fields-of-glory.webp'
import demoBannerCommonB from '@/assets/ffxiv/housing-banner.webp'
import demoBannerCnA from '@/assets/ffxiv/frontline-seal-rock.webp'
import demoBannerCnB from '@/assets/ffxiv/frontline-onsal-hakair.webp'
import demoBannerGlobalA from '@/assets/ffxiv/frontline-borderland-ruins.webp'
import demoBannerGlobalB from '@/assets/ffxiv/frontline-worqor-chirteh.webp'

const DEMO_BANNERS: Record<string, string> = {
  'common-a': demoBannerCommonA,
  'common-b': demoBannerCommonB,
  'cn-a': demoBannerCnA,
  'cn-b': demoBannerCnB,
  'global-a': demoBannerGlobalA,
  'global-b': demoBannerGlobalB
}

const DAY_MS = 24 * 60 * 60 * 1000
const DESKTOP_WINDOW_MONTHS = 2
const MOBILE_WINDOW_MONTHS = 1
const DESKTOP_VISIBLE_DAYS = 35
const WINDOW_ANIMATION = {
  animation: { duration: 280, easingFunction: 'easeInOutQuad' }
} satisfies TimelineAnimationOptions

const { current: locale, t } = useLocale()
const timelineHost = ref<HTMLElement | null>(null)
const visibleRangeLabel = ref('')
const anchorDate = new Date()

let timeline: Timeline | null = null
let resizeObserver: ResizeObserver | null = null
let compactTimeline = false

type TimelinePrototypeItem = DataItem
type TimelineLane = 'common' | 'cn' | 'global'

const TIMELINE_LANES: TimelineLane[] = ['common', 'cn', 'global']

function monthStart(offset = 0) {
  return new Date(anchorDate.getFullYear(), anchorDate.getMonth() + offset, 1)
}

function dateAt(monthOffset: number, day: number) {
  return new Date(anchorDate.getFullYear(), anchorDate.getMonth() + monthOffset, day)
}

function createGroups(): DataGroup[] {
  return [
    {
      id: 'common',
      content: t(textKeys.styleLabTimelineGroupCommon),
      className: 'timeline-group--common'
    },
    {
      id: 'cn',
      content: t(textKeys.styleLabTimelineGroupCn),
      className: 'timeline-group--cn'
    },
    {
      id: 'global',
      content: t(textKeys.styleLabTimelineGroupGlobal),
      className: 'timeline-group--global'
    }
  ]
}

function createItems(): TimelinePrototypeItem[] {
  return [
    createRangeItem('common-a', 'common', 0, 2, 0, 22, textKeys.styleLabTimelineSampleCommonA),
    createRangeItem('common-b', 'common', 0, 18, 1, 15, textKeys.styleLabTimelineSampleCommonB),
    createRangeItem('cn-a', 'cn', 0, 7, 0, 20, textKeys.styleLabTimelineSampleCnA),
    createRangeItem('cn-b', 'cn', 0, 14, 0, 15, textKeys.styleLabTimelineSampleCnB),
    createRangeItem('global-a', 'global', 0, 12, 1, 3, textKeys.styleLabTimelineSampleGlobalA),
    createRangeItem('global-b', 'global', 1, 17, 2, 1, textKeys.styleLabTimelineSampleGlobalB)
  ]
}

function createRangeItem(
  id: string,
  lane: TimelineLane,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
  labelKey: string
): TimelinePrototypeItem {
  const content = t(labelKey)
  const startAt = dateAt(startMonth, startDay)
  const endAt = dateAt(endMonth, endDay)
  const isCompact = endAt.getTime() - startAt.getTime() <= DAY_MS
  const compactSide = startAt.getTime() > defaultWindowMidpoint() ? 'left' : 'right'
  const endLabel = formatEventEnd(endAt)

  return {
    id,
    group: lane,
    content,
    title: `${content}\n~ ${endLabel}`,
    start: startAt,
    end: endAt,
    type: 'range',
    subgroup: isCompact ? 'compact' : 'range',
    className: [
      `timeline-item--${id}`,
      isCompact ? 'timeline-item--compact' : '',
      isCompact ? `timeline-item--compact-${compactSide}` : ''
    ]
      .filter(Boolean)
      .join(' '),
    selectable: false
  }
}

function formatEventEnd(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    year: 'numeric',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`
}

function renderTimelineItem(item: TimelinePrototypeItem) {
  const copy = document.createElement('span')
  const text = document.createElement('span')
  const title = document.createElement('strong')
  const end = document.createElement('time')
  const endAt = item.end instanceof Date ? item.end : new Date(item.end as string | number)
  const banner = DEMO_BANNERS[String(item.id)]

  copy.className = 'timeline-event-copy'
  if (banner) {
    const thumb = document.createElement('img')
    thumb.className = 'timeline-event-copy__thumb'
    thumb.src = banner
    thumb.alt = ''
    thumb.draggable = false
    copy.append(thumb)
  }
  text.className = 'timeline-event-copy__text'
  title.className = 'timeline-event-copy__title'
  title.textContent = item.content
  end.className = 'timeline-event-copy__end'
  end.dateTime = endAt.toISOString()
  end.textContent = `~ ${formatEventEnd(endAt)}`
  text.append(title, end)
  copy.append(text)

  return copy
}

function createOptions(): TimelineOptions {
  return {
    start: monthStart(),
    end: defaultWindowEnd(),
    min: monthStart(),
    max: monthStart(DESKTOP_WINDOW_MONTHS),
    align: 'center',
    autoResize: true,
    editable: false,
    groupOrder: (a, b) =>
      TIMELINE_LANES.indexOf(a.id as TimelineLane) - TIMELINE_LANES.indexOf(b.id as TimelineLane),
    horizontalScroll: true,
    margin: {
      axis: compactTimeline ? 14 : 18,
      item: {
        horizontal: 8,
        vertical: compactTimeline ? 12 : 18
      }
    },
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
    stack: true,
    stackSubgroups: true,
    timeAxis: {
      scale: 'day',
      step: compactTimeline ? 3 : 1
    },
    template: (item) => renderTimelineItem(item as TimelinePrototypeItem),
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

function defaultWindowEnd() {
  if (compactTimeline) return monthStart(MOBILE_WINDOW_MONTHS)

  return dateAt(0, DESKTOP_VISIBLE_DAYS + 1)
}

function defaultWindowMidpoint() {
  return (monthStart().getTime() + defaultWindowEnd().getTime()) / 2
}

function formatMinorLabel(date: Date, scale: string) {
  const value = new Date(date)

  if (value >= monthStart(DESKTOP_WINDOW_MONTHS)) return ''
  if (scale === 'month') return String(value.getMonth() + 1)
  if (scale === 'year') return String(value.getFullYear())
  return String(value.getDate())
}

function formatMajorLabel(date: Date, scale: string) {
  const value = new Date(date)

  if (value >= monthStart(DESKTOP_WINDOW_MONTHS)) return ''
  if (scale === 'month' || scale === 'year') return String(value.getFullYear())
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function refreshLocalizedData() {
  timeline?.setData({
    groups: createGroups(),
    items: createItems()
  })
}

function updateVisibleRangeLabel() {
  if (!timeline) return

  const { start, end } = timeline.getWindow()
  const formatter = new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  const inclusiveEnd = new Date(end.getTime() - DAY_MS)

  visibleRangeLabel.value = `${formatter.format(start)} - ${formatter.format(inclusiveEnd)}`
}

function resetWindow() {
  timeline?.setWindow(monthStart(), defaultWindowEnd(), WINDOW_ANIMATION)
}

onMounted(() => {
  if (!timelineHost.value) return

  compactTimeline = timelineHost.value.clientWidth < 640
  timeline = new Timeline(timelineHost.value, createItems(), createGroups(), createOptions())
  timeline.on('rangechanged', updateVisibleRangeLabel)
  updateVisibleRangeLabel()

  resizeObserver = new ResizeObserver(([entry]) => {
    const nextCompactTimeline = entry.contentRect.width < 640

    if (nextCompactTimeline === compactTimeline) return

    compactTimeline = nextCompactTimeline
    timeline?.setOptions({
      margin: {
        axis: compactTimeline ? 14 : 18,
        item: {
          horizontal: 8,
          vertical: compactTimeline ? 12 : 18
        }
      },
      timeAxis: {
        scale: 'day',
        step: compactTimeline ? 3 : 1
      }
    })
    resetWindow()
  })
  resizeObserver.observe(timelineHost.value)
})

watch(locale, () => {
  refreshLocalizedData()
  updateVisibleRangeLabel()
  timeline?.redraw()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  timeline?.destroy()
  timeline = null
})
</script>

<style scoped>
.style-timeline-lab {
  width: min(100% - 2rem, var(--ns-content-width));
  margin: 1.25rem auto 0;
}

.style-timeline-lab__toolbar {
  display: flex;
  align-items: center;
  margin-bottom: var(--ns-space-3);
}

.style-timeline-lab__range {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: 0 var(--ns-space-2);
  border: 1px solid var(--ns-color-border);
  background: var(--ns-color-surface-solid);
}

.style-timeline-lab__range {
  color: var(--ns-color-text);
  font-family: var(--ns-font-data);
  font-variant-numeric: tabular-nums;
}

.style-timeline-lab__timeline {
  min-width: 0;
  outline: none;
}

.style-timeline-lab__timeline:focus-visible {
  box-shadow: var(--ns-focus-ring);
}

.style-timeline-lab__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--ns-space-2);
  color: var(--ns-color-text-muted);
  font: 600 0.68rem/1.2 var(--ns-font-data);
}

.style-timeline-lab :deep(.vis-timeline) {
  border: 2px solid var(--ns-color-border-strong);
  background: var(--ns-color-surface-solid);
  color: var(--ns-color-text);
  font-family: var(--ns-font-ui);
  box-shadow: 3px 3px 0 var(--ns-pixel-soft-shadow);
}

.style-timeline-lab :deep(.vis-panel) {
  border-color: var(--ns-color-border);
}

.style-timeline-lab :deep(.vis-panel.vis-left) {
  border-color: color-mix(in srgb, var(--ns-color-border) 45%, transparent);
  background: color-mix(in srgb, var(--ns-color-surface-muted) 58%, transparent);
}

.style-timeline-lab :deep(.vis-labelset .vis-label) {
  border-color: color-mix(in srgb, var(--ns-color-border) 42%, transparent);
  color: color-mix(in srgb, var(--ns-color-text-muted) 68%, transparent);
}

.style-timeline-lab :deep(.vis-labelset .vis-label .vis-inner) {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 7.5rem;
  height: 100%;
  padding: var(--ns-space-2);
  font: 500 0.72rem/1.35 var(--ns-font-ui);
  text-align: center;
  white-space: normal;
}

.style-timeline-lab :deep(.vis-panel.vis-center),
.style-timeline-lab :deep(.vis-panel.vis-background),
.style-timeline-lab :deep(.vis-panel.vis-top) {
  background: var(--ns-color-surface-solid);
}

.style-timeline-lab :deep(.vis-group) {
  border-color: color-mix(in srgb, var(--ns-color-border) 42%, transparent);
}

.style-timeline-lab :deep(.vis-grid.vis-minor) {
  border-color: color-mix(in srgb, var(--ns-color-border) 65%, transparent);
}

.style-timeline-lab :deep(.vis-grid.vis-major) {
  border-color: var(--ns-color-border-strong);
}

.style-timeline-lab :deep(.vis-time-axis .vis-text) {
  color: var(--ns-color-text-muted);
  font: 600 0.75rem/1 var(--ns-font-data);
  font-variant-numeric: tabular-nums;
}

.style-timeline-lab :deep(.vis-time-axis .vis-text.vis-major) {
  color: var(--ns-color-text);
  font-family: var(--ns-font-pixel);
  font-size: 0.82rem;
}

.style-timeline-lab :deep(.vis-item) {
  min-height: 3.2rem;
  border-width: 2px;
  border-radius: 0;
  color: var(--ns-color-text);
  box-shadow: 2px 2px 0 var(--ns-pixel-soft-shadow);
  font: 700 0.98rem/1.2 var(--ns-font-ui);
}

.style-timeline-lab :deep(.vis-item .vis-item-content) {
  position: static !important;
  transform: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0;
  text-align: center;
}

.style-timeline-lab :deep(.timeline-event-copy) {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  gap: var(--ns-space-2);
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: var(--ns-space-1) var(--ns-space-2);
}

.style-timeline-lab :deep(.timeline-event-copy__thumb) {
  flex: none;
  width: 2.6rem;
  height: 2.6rem;
  border: 2px solid var(--ns-pixel-border);
  border-radius: 0;
  object-fit: cover;
  image-rendering: auto;
  background: var(--ns-color-surface-solid);
}

.style-timeline-lab :deep(.timeline-event-copy__text) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.style-timeline-lab :deep(.timeline-event-copy__title) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  font: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-timeline-lab :deep(.timeline-event-copy__end) {
  display: block;
  margin-top: 0.16rem;
  color: color-mix(in srgb, var(--ns-color-text-muted) 82%, transparent);
  font: 600 0.7rem/1.15 var(--ns-font-data);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact .vis-item-overflow) {
  justify-content: flex-start;
  overflow: visible;
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact .vis-item-content) {
  width: max-content;
  min-width: 11rem;
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact .timeline-event-copy) {
  width: max-content;
  min-width: 11rem;
  background: color-mix(in srgb, var(--ns-color-surface-solid) 94%, transparent);
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact .timeline-event-copy__thumb) {
  width: 2.2rem;
  height: 2.2rem;
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact-right .vis-item-content) {
  margin-left: calc(100% + var(--ns-space-1));
}

.style-timeline-lab :deep(.vis-item.timeline-item--compact-left .vis-item-content) {
  margin-left: calc(-1 * var(--ns-space-1));
  transform: translateX(-100%) !important;
}

.style-timeline-lab :deep(.vis-item .vis-item-overflow) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-timeline-lab :deep(.vis-item.timeline-item--common-a),
.style-timeline-lab :deep(.vis-item.timeline-item--common-b) {
  border-color: var(--ns-color-accent-strong);
  background: var(--ns-color-accent-soft);
}

.style-timeline-lab :deep(.vis-item.timeline-item--cn-a),
.style-timeline-lab :deep(.vis-item.timeline-item--cn-b) {
  border-color: var(--ns-color-warning);
  background: var(--ns-pixel-warm-surface);
}

.style-timeline-lab :deep(.vis-item.timeline-item--global-a),
.style-timeline-lab :deep(.vis-item.timeline-item--global-b) {
  border-color: var(--ns-color-cyan);
  background: var(--ns-color-cyan-soft);
}

/* 宣传图背景淡入 demo：仅长条（非 compact）在右端淡入活动宣传图 */
.style-timeline-lab :deep(.vis-item.timeline-item--common-b:not(.timeline-item--compact)) {
  background:
    linear-gradient(to right, var(--ns-color-accent-soft) 42%, transparent 82%),
    url('../../../assets/ffxiv/housing-banner.webp') right center / auto 100% no-repeat,
    var(--ns-color-accent-soft);
}

.style-timeline-lab :deep(.vis-item.timeline-item--cn-a:not(.timeline-item--compact)) {
  background:
    linear-gradient(to right, var(--ns-pixel-warm-surface) 42%, transparent 82%),
    url('../../../assets/ffxiv/frontline-seal-rock.webp') right center / auto 100% no-repeat,
    var(--ns-pixel-warm-surface);
}

.style-timeline-lab :deep(.vis-item.timeline-item--global-b:not(.timeline-item--compact)) {
  background:
    linear-gradient(to right, var(--ns-color-cyan-soft) 42%, transparent 82%),
    url('../../../assets/ffxiv/frontline-worqor-chirteh.webp') right center / auto 100% no-repeat,
    var(--ns-color-cyan-soft);
}

.style-timeline-lab :deep(.vis-item.vis-selected) {
  border-color: var(--ns-color-border-strong);
  box-shadow: 2px 2px 0 var(--ns-color-border-strong);
}

.style-timeline-lab :deep(.vis-current-time) {
  z-index: 5;
  width: 2px;
  background-color: var(--ns-color-danger);
}

.style-timeline-lab :deep(.vis-current-time::before) {
  position: absolute;
  top: 0;
  left: -4px;
  width: 10px;
  height: 7px;
  background: var(--ns-color-danger);
  content: '';
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

@media (max-width: 720px) {
  .style-timeline-lab {
    width: min(100% - 1rem, var(--ns-content-width));
  }

  .style-timeline-lab :deep(.vis-item) {
    min-height: 3rem;
    font-size: 0.88rem;
  }

  .style-timeline-lab :deep(.vis-item.timeline-item--compact .vis-item-content),
  .style-timeline-lab :deep(.vis-item.timeline-item--compact .timeline-event-copy) {
    min-width: 9rem;
  }

  .style-timeline-lab :deep(.timeline-event-copy__thumb) {
    width: 2rem;
    height: 2rem;
  }

  .style-timeline-lab :deep(.vis-labelset .vis-label .vis-inner) {
    width: 4.75rem;
    padding: var(--ns-space-1);
    font-size: 0.68rem;
  }
}
</style>
