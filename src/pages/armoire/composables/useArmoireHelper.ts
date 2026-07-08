import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { textKeys } from '@/config/site'
import type { ArmoireSnapshot } from '@/lib/armoire/types'
import type {
  ArmoireHelperHealth,
  ArmoireHelperProbe,
  ArmoireHelperProcess
} from '@/pages/armoire/services/nsarmoireHelperApi'
import { NSARMOIRE_BUTLER_PROTOCOL_URL } from '@/pages/armoire/services/nsarmoireHelperApi'

export type ArmoireHelperStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'gameNotFound'
  | 'dresserNotLoaded'
  | 'multipleProcesses'
  | 'error'

type StatusTone = 'info' | 'success' | 'warning' | 'danger' | 'loading'
type ArmoireHelperApiModule = typeof import('@/pages/armoire/services/nsarmoireHelperApi')

const NSARMOIRE_HELPER_DISPLAY_URL = 'http://127.0.0.1:8015'
const PROBE_VISIBLE_INTERVAL_MS = 2000
const PROBE_HIDDEN_INTERVAL_MS = 10000
const AUTO_REFRESH_AFTER_PROBE_MS = 1400
const BUTLER_LAUNCH_RETRY_DELAYS_MS = [700, 1200, 1800, 2500]
let helperApiPromise: Promise<ArmoireHelperApiModule> | null = null

function loadHelperApi(): Promise<ArmoireHelperApiModule> {
  helperApiPromise ??= import('@/pages/armoire/services/nsarmoireHelperApi')
  return helperApiPromise
}

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
  const probe = shallowRef<ArmoireHelperProbe | null>(null)
  const processes = shallowRef<ArmoireHelperProcess[]>([])
  const processPickerOpen = ref(false)
  const processBusy = ref(false)
  const processError = ref<string | null>(null)
  const endpoint = NSARMOIRE_HELPER_DISPLAY_URL
  let probeTimer = 0
  let autoRefreshTimer = 0
  let probeBusy = false
  let autoRefreshBusy = false
  const handleVisibilityChange = () => {
    if (health.value && probeTimer !== 0) {
      stopProbePolling()
      startProbePolling()
    }
  }

  const titleKey = computed(() => statusTitleKey[status.value])
  const messageKey = computed(() => statusMessageKey[status.value])
  const tone = computed(() => statusTone[status.value])
  const canRefresh = computed(() => status.value === 'ready' || status.value === 'dresserNotLoaded')
  const canShutdown = computed(() => Boolean(health.value) && !busy.value)
  const canSelectProcess = computed(() => Boolean(health.value) && !busy.value)
  const canClearRetainerCache = computed(
    () => Boolean(health.value) && !busy.value && cachedRetainers.value.length > 0
  )
  const cachedRetainers = computed(() => probe.value?.retainerCaches ?? [])

  async function connectHelper() {
    await loadFromHelper(false, { launchIfUnavailable: true })
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
      const helperApi = await loadHelperApi()
      await helperApi.shutdownArmoireHelper()
      status.value = 'idle'
      health.value = null
      probe.value = null
      processes.value = []
      processPickerOpen.value = false
      processError.value = null
      stopProbePolling()
    } catch (error) {
      await mapHelperError(error)
    } finally {
      busy.value = false
    }
  }

  async function loadFromHelper(
    refresh: boolean,
    options: { launchIfUnavailable?: boolean } = {}
  ) {
    busy.value = true
    status.value = 'connecting'
    detail.value = null

    try {
      const loaded = await tryLoadFromHelper(refresh)
      if (loaded) {
        return
      }
    } catch (error) {
      if (options.launchIfUnavailable === true && isHelperUnavailableError(error)) {
        const launched = launchButlerProtocol()
        if (launched) {
          const loadedAfterLaunch = await retryLoadFromHelper(refresh)
          if (loadedAfterLaunch) {
            return
          }
        }
      }

      await mapHelperError(error)
      if (health.value && String(status.value) === 'dresserNotLoaded') {
        startProbePolling()
      }
    } finally {
      busy.value = false
    }
  }

  async function tryLoadFromHelper(refresh: boolean): Promise<boolean> {
    const helperApi = await loadHelperApi()
    health.value = await helperApi.fetchArmoireHelperHealth()
    if (await mapHealthStatus(health.value)) {
      return true
    }

    const snapshot = refresh
      ? await helperApi.refreshArmoireHelperSnapshot()
      : await helperApi.fetchArmoireHelperSnapshot()
    const imported = loadSnapshotPayload(snapshot, null)

    if (!imported) {
      status.value = 'error'
      detail.value = 'invalid helper snapshot'
      return true
    }

    status.value = 'ready'
    startProbePolling()
    return true
  }

  async function retryLoadFromHelper(refresh: boolean): Promise<boolean> {
    for (const delayMs of BUTLER_LAUNCH_RETRY_DELAYS_MS) {
      await wait(delayMs)

      try {
        return await tryLoadFromHelper(refresh)
      } catch (error) {
        if (!isHelperUnavailableError(error)) {
          await mapHelperError(error)
          return true
        }
      }
    }

    return false
  }

  function launchButlerProtocol(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false
    }

    const launcher = document.createElement('a')
    launcher.href = NSARMOIRE_BUTLER_PROTOCOL_URL
    launcher.rel = 'noreferrer'
    launcher.style.display = 'none'
    document.body.appendChild(launcher)
    launcher.click()
    window.setTimeout(() => launcher.remove(), 1000)

    detail.value = 'waiting_for_nsarmoire_butler'
    return true
  }

  function isHelperUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    return /failed to fetch|networkerror|load failed|fetch/i.test(error.message)
  }

  function wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, delayMs))
  }

  async function loadProcesses() {
    processBusy.value = true
    processError.value = null

    try {
      const helperApi = await loadHelperApi()
      processes.value = await helperApi.fetchArmoireHelperProcesses()
    } catch (error) {
      processError.value = error instanceof Error ? error.message : String(error)
    } finally {
      processBusy.value = false
    }
  }

  async function openProcessPicker() {
    processPickerOpen.value = true
    await loadProcesses()
  }

  async function selectProcess(pid: number) {
    processBusy.value = true
    processError.value = null

    try {
      const helperApi = await loadHelperApi()
      health.value = await helperApi.selectArmoireHelperProcess(pid)
      probe.value = null
      processPickerOpen.value = false
      await loadFromHelper(false)
    } catch (error) {
      processError.value = error instanceof Error ? error.message : String(error)
      await mapHelperError(error)
    } finally {
      processBusy.value = false
    }
  }

  async function clearRetainerCache() {
    if (!health.value || busy.value) {
      return
    }

    busy.value = true
    detail.value = null
    cancelAutoRefresh()

    try {
      const helperApi = await loadHelperApi()
      health.value = await helperApi.clearArmoireHelperRetainerCache()
      probe.value = null
      await refreshSnapshotSilently({ ignoreBusy: true })
      startProbePolling()
    } catch (error) {
      await mapHelperError(error)
    } finally {
      busy.value = false
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
    const helperApi = await loadHelperApi()

    if (error instanceof helperApi.ArmoireHelperApiError) {
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

    if (error instanceof helperApi.ArmoireHelperSnapshotError) {
      status.value = 'error'
      detail.value = error.code
      return
    }

    status.value = 'error'
    detail.value = error instanceof Error ? error.message : String(error)
  }

  function getProbeIntervalMs(): number {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden'
      ? PROBE_HIDDEN_INTERVAL_MS
      : PROBE_VISIBLE_INTERVAL_MS
  }

  function startProbePolling() {
    if (!health.value || typeof window === 'undefined') {
      return
    }

    stopProbePolling()
    void pollHelperProbe()
  }

  function stopProbePolling() {
    if (typeof window !== 'undefined' && probeTimer !== 0) {
      window.clearTimeout(probeTimer)
    }

    probeTimer = 0
    cancelAutoRefresh()
  }

  function scheduleProbePolling() {
    if (!health.value || typeof window === 'undefined') {
      return
    }

    probeTimer = window.setTimeout(() => {
      probeTimer = 0
      void pollHelperProbe()
    }, getProbeIntervalMs())
  }

  async function pollHelperProbe() {
    if (!health.value) {
      return
    }

    if (probeBusy || busy.value) {
      scheduleProbePolling()
      return
    }

    probeBusy = true

    try {
      const helperApi = await loadHelperApi()
      const nextProbe = await helperApi.fetchArmoireHelperProbe()

      probe.value = nextProbe
      scheduleAutoRefresh()
    } catch (error) {
      await mapHelperError(error)
    } finally {
      probeBusy = false
      scheduleProbePolling()
    }
  }

  function scheduleAutoRefresh() {
    if (typeof window === 'undefined') {
      void refreshSnapshotSilently()
      return
    }

    cancelAutoRefresh()
    autoRefreshTimer = window.setTimeout(() => {
      autoRefreshTimer = 0
      void refreshSnapshotSilently()
    }, AUTO_REFRESH_AFTER_PROBE_MS)
  }

  function cancelAutoRefresh() {
    if (typeof window !== 'undefined' && autoRefreshTimer !== 0) {
      window.clearTimeout(autoRefreshTimer)
    }

    autoRefreshTimer = 0
  }

  async function refreshSnapshotSilently(options: { ignoreBusy?: boolean } = {}) {
    if (!health.value || autoRefreshBusy || (busy.value && options.ignoreBusy !== true)) {
      return
    }

    autoRefreshBusy = true

    try {
      const helperApi = await loadHelperApi()
      const snapshot = await helperApi.refreshArmoireHelperSnapshot()
      const imported = loadSnapshotPayload(snapshot, null)

      if (imported) {
        status.value = 'ready'
        detail.value = null
      }
    } catch (error) {
      await mapHelperError(error)
    } finally {
      autoRefreshBusy = false
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  onBeforeUnmount(() => {
    stopProbePolling()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return {
    status,
    busy,
    detail,
    health,
    probe,
    endpoint,
    titleKey,
    messageKey,
    tone,
    canRefresh,
    canShutdown,
    canSelectProcess,
    canClearRetainerCache,
    cachedRetainers,
    connectHelper,
    refreshHelper,
    clearRetainerCache,
    shutdownHelper,
    processes,
    processPickerOpen,
    processBusy,
    processError,
    openProcessPicker,
    loadProcesses,
    selectProcess,
    closeProcessPicker
  }
}
