export function createLruCache<K, V>(maxSize = 50): Map<K, V> {
  const cache = new Map<K, V>()

  return new Proxy(cache, {
    get(target, prop) {
      const value = Reflect.get(target, prop)
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = value.apply(target, args)

          if (prop === 'set' && target.size > maxSize) {
            const oldest = target.keys().next()
            if (!oldest.done) {
              target.delete(oldest.value)
            }
          }

          return result
        }
      }
      return value
    }
  })
}
