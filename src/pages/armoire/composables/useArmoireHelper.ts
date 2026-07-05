import { computed, ref, shallowRef } from 'vue'
import { textKeys } from '@/config/site'
import type { ArmoireSnapshot } from '@/lib/armoire/types'
import {
  ArmoireHelperApiError,
  ArmoireHelperSnapshotError,
  fetchArmoireHelperHealth,
  fetchArmoireHelperProcesses,
  fetchArmoireHelperSnapshot,
  getArmoireHelperDisplayUrl,
  refreshArmoireHelperSnapshot,
  selectArmoireHelperProcess,
  shutdownArmoireHelper,
  type ArmoireHelperHealth,
  type ArmoireHelperProcess
} from '@/pages/armoire/services/nsarmoireHelperApi'

export type ArmoireHelperStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'gameNotFound'
  | 'dresserNotLoaded'
  | 'multipleProcesses'
  | 'error'

type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'loading'

const statusTitleKey: Record<ArmoireHelperStatus, string> = {
  idle: textKeys.nsarmoireHelperIdle,
  connecting: textKeys.nsarmoireHelperConnecting,
  ready: textKeys.nsarmoireHelperReady,
  gameNotFound: textKeys.nsarmoireHelperGameNotFound,
  dresserNotLoaded: textKeys.nsarmoireHelperDresserNotLoaded,
  multipleProcesses: textKeys.nsarmoireHelperMultipleProcesses,
  error: textKeys.nsarmoireHelperError
}

const statusMessageKey: Record<ArmoireHelperStatus, string> = {
  idle: textKeys.nsarmoireHelperIdleMessage,
  connecting: textKeys.nsarmoireHelperConnectingMessage,
  ready: textKeys.nsarmoireHelperReadyMessage,
  gameNotFound: textKeys.nsarmoireHelperGameNotFoundMessage,
  dresserNotLoaded: textKeys.nsarmoireHelperDresserNotLoadedMessage,
  multipleProcesses: textKeys.nsarmoireHelperMultipleProcessesMessage,
  error: textKeys.nsarmoireHelperErrorMessage
}

const statusTone: Record<ArmoireHelperStatus, StatusTone> = {
  idle: 'info',
  connecting: 'loading',
  ready: 'success',
  gameNotFound: 'warning',
  dresserNotLoaded: 'warning',
  multipleProcesses: 'warning',
  error: 'danger'
}

export function useArmoireHelper(
  loadSnapshotPayload: (payload: unknown, importedFileName?: string | null) => ArmoireSnapshot | null
) {
  const status = ref<ArmoireHelperStatus>('idle')
  const busy = ref(false)
  const detail = ref<string | null>(null)
  const health = shallowRef<ArmoireHelperHealth | null>(null)
  const processes = shallowRef<ArmoireHelperProcess[]>([])
  const processPickerOpen = ref(false)
  const processBusy = ref(false)
  const processError = ref<string | null>(null)
  const endpoint = getArmoireHelperDisplayUrl()

  const titleKey = computed(() => statusTitleKey[status.value])
  const messageKey = computed(() => statusMessageKey[status.value])
  const tone = computed(() => statusTone[status.value])
  const canRefresh = computed(() => status.value === 'ready' || status.value === 'dresserNotLoaded')
  const canShutdown = computed(() => Boolean(health.value) && !busy.value)

  async function connectHelper() {
    await loadFromHelper(false)
  }

  async function refreshHelper() {
    await loadFromHelper(true)
  }

  async function shutdownHelper() {
    if (!health.value || busy.value) {
      return
    }

    busy.value = true
    detail.value = null

    try {
      await shutdownArmoireHelper()
      status.value = 'idle'
      health.value = null
      processes.value = []
      processPickerOpen.value = false
      processError.value = null
    } catch (error) {
      await mapHelperError(error)
    } finally {
      busy.value = false
    }
  }

  async function loadFromHelper(refresh: boolean) {
    busy.value = true
    status.value = 'connecting'
    detail.value = null

    try {
      health.value = await fetchArmoireHelperHealth()
      if (await mapHealthStatus(health.value)) {
        return
      }

      const snapshot = refresh ? await refreshArmoireHelperSnapshot() : await fetchArmoireHelperSnapshot()
      const imported = loadSnapshotPayload(snapshot, null)

      if (!imported) {
        status.value = 'error'
        detail.value = 'invalid helper snapshot'
        return
      }

      status.value = 'ready'
    } catch (error) {
      await mapHelperError(error)
    } finally {
      busy.value = false
    }
  }

  async function loadProcesses() {
    processBusy.value = true
    processError.value = null

    try {
      processes.value = await fetchArmoireHelperProcesses()
    } catch (error) {
      processError.value = error instanceof Error ? error.message : String(error)
    } finally {
      processBusy.value = false
    }
  }

  async function selectProcess(pid: number) {
    processBusy.value = true
    processError.value = null

    try {
      health.value = await selectArmoireHelperProcess(pid)
      processPickerOpen.value = false
      await loadFromHelper(false)
    } catch (error) {
      processError.value = error instanceof Error ? error.message : String(error)
      await mapHelperError(error)
    } finally {
      processBusy.value = false
    }
  }

  function closeProcessPicker() {
    processPickerOpen.value = false
  }

  async function mapHealthStatus(currentHealth: ArmoireHelperHealth): Promise<boolean> {
    detail.value = currentHealth.status

    if (currentHealth.status === 'game_process_not_found') {
      status.value = 'gameNotFound'
      return true
    }

    if (currentHealth.status === 'multiple_game_processes') {
      status.value = 'multipleProcesses'
      processPickerOpen.value = true
      await loadProcesses()
      return true
    }

    detail.value = null
    return false
  }

  async function mapHelperError(error: unknown) {
    if (error instanceof ArmoireHelperApiError) {
      detail.value = error.code

      if (error.code === 'game_process_not_found') {
        status.value = 'gameNotFound'
        return
      }

      if (error.code === 'dresser_not_loaded') {
        status.value = 'dresserNotLoaded'
        return
      }

      if (error.code === 'multiple_game_processes') {
        status.value = 'multipleProcesses'
        processPickerOpen.value = true
        await loadProcesses()
        return
      }

      status.value = 'error'
      return
    }

    if (error instanceof ArmoireHelperSnapshotError) {
      status.value = 'error'
      detail.value = error.code
      return
    }

    status.value = 'error'
    detail.value = error instanceof Error ? error.message : String(error)
  }

  return {
    status,
    busy,
    detail,
    health,
    endpoint,
    titleKey,
    messageKey,
    tone,
    canRefresh,
    canShutdown,
    connectHelper,
    refreshHelper,
    shutdownHelper,
    processes,
    processPickerOpen,
    processBusy,
    processError,
    loadProcesses,
    selectProcess,
    closeProcessPicker
  }
}
