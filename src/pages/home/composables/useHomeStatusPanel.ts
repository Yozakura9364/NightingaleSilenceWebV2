import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/stores/theme'

type NightMetricTrend = 'rise' | 'fall'

interface NightStabilityMotion {
  base: number
  amplitude: number
  speed: number
  phase: number
}

export interface NightFragmentStabilityConfig {
  id: string
  nameKey: string
  avatar: string
  icon: string
  side: 'left' | 'right'
  dialoguePreviewKey?: string
  dialogueUnread?: boolean
  existence: NightStabilityMotion
  mental: NightStabilityMotion
}

interface MetricBase {
  id: string
  labelKey: string
  baseValue: number
  baseSize: number
  valueJitter: number
  sizeJitter: number
}

interface NightMetricLabelKeys {
  existenceStability: string
  mentalStability: string
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatHomeMetricValue(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US')
}

function formatNightVitalValue(id: string, value: number) {
  const formattedValue = formatHomeMetricValue(value)
  return id === 'heart-rate' ? `${formattedValue} BPM` : `${formattedValue}%`
}

export function useHomeStatusPanel(
  nightFragmentStabilityConfigs: readonly NightFragmentStabilityConfig[],
  nightMetricBases: readonly MetricBase[],
  labelKeys: NightMetricLabelKeys
) {
  const { current: themeMode } = useTheme()
  const nightMetricTick = ref(0)
  let nightMetricTimer = 0

  function randomHomeDelay(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min))
  }

  function shouldReduceHomeMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }

  function nightStabilitySize(motion: NightStabilityMotion) {
    const value = motion.base + Math.sin(nightMetricTick.value * motion.speed + motion.phase) * motion.amplitude
    return `${Math.round(clampNumber(value, 0, 100))}%`
  }

  const nightMetrics = computed(() =>
    nightMetricBases.map((metric, index) => {
      const pulse = nightMetricTick.value
      const wave = Math.sin(pulse * 0.86 + index * 1.75)
      const counterWave = Math.cos(pulse * 0.47 + index * 2.35)
      const valueOffset = Math.round(wave * metric.valueJitter + counterWave * metric.valueJitter * 0.36)
      const size = clampNumber(metric.baseSize + wave * metric.sizeJitter + counterWave * 4, 18, 92)
      const trend: NightMetricTrend = valueOffset >= 0 ? 'rise' : 'fall'
      return {
        id: metric.id,
        labelKey: metric.labelKey,
        value: formatNightVitalValue(metric.id, metric.baseValue + valueOffset),
        size: `${Math.round(size)}%`,
        trend
      }
    })
  )

  const nightFragmentRecords = computed(() =>
    nightFragmentStabilityConfigs.map((message) => ({
      ...message,
      meters: [
        { id: 'existence', labelKey: labelKeys.existenceStability, size: nightStabilitySize(message.existence) },
        { id: 'mental', labelKey: labelKeys.mentalStability, size: nightStabilitySize(message.mental) }
      ]
    }))
  )

  const nightWorldStabilityValue = computed(() => {
    const motion: NightStabilityMotion = { base: 73, amplitude: 10, speed: 0.42, phase: 0 }
    return nightStabilitySize(motion)
  })

  const nightWorldStability = computed(() => ({ size: nightWorldStabilityValue.value }))

  const nightDialogueMessages = computed(() =>
    nightFragmentStabilityConfigs.flatMap((message) =>
      message.dialoguePreviewKey
        ? [{ ...message, previewKey: message.dialoguePreviewKey, unread: message.dialogueUnread === true }]
        : []
    )
  )

  function clearNightMetricTimer() {
    if (nightMetricTimer) {
      window.clearTimeout(nightMetricTimer)
      nightMetricTimer = 0
    }
  }

  function scheduleNightMetricPulse() {
    clearNightMetricTimer()
    if (themeMode.value !== 'night' || shouldReduceHomeMotion()) return
    if (document.hidden) {
      nightMetricTimer = window.setTimeout(scheduleNightMetricPulse, 500)
      return
    }
    nightMetricTimer = window.setTimeout(() => {
      nightMetricTick.value += 1
      scheduleNightMetricPulse()
    }, randomHomeDelay(820, 1650))
  }

  onMounted(() => { scheduleNightMetricPulse() })
  watch(themeMode, () => { scheduleNightMetricPulse() })
  onBeforeUnmount(() => { clearNightMetricTimer() })

  return {
    nightMetrics,
    nightFragmentRecords,
    nightWorldStability,
    nightDialogueMessages,
  }
}
