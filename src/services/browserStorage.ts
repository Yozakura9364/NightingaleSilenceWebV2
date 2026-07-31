export function safeSetStorageItem(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeSetLocalItem(key: string, value: string): boolean {
  return safeSetStorageItem(localStorage, key, value)
}

export function safeSetSessionItem(key: string, value: string): boolean {
  return safeSetStorageItem(sessionStorage, key, value)
}

export function safeSetJsonLocalItem(key: string, value: unknown): boolean {
  try {
    return safeSetLocalItem(key, JSON.stringify(value))
  } catch {
    return false
  }
}
