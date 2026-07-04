import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import {
  getSilenceTurnNeighbors,
  getSilenceTurnNodeLabel
} from '@/data/silence/navigation'
import { useLocale } from '@/stores/locale'

export function useSilenceTurnNavigation(path: MaybeRefOrGetter<string>) {
  const { t } = useLocale()
  const turnNeighbors = computed(() => getSilenceTurnNeighbors(toValue(path)))
  const leftTurnLabel = computed(() => getSilenceTurnNodeLabel(turnNeighbors.value.left, t))
  const rightTurnLabel = computed(() => getSilenceTurnNodeLabel(turnNeighbors.value.right, t))

  return {
    turnNeighbors,
    leftTurnLabel,
    rightTurnLabel
  }
}
