// check 脚本共用工具：断言与参数解析。
// 引入本模块前确保存在至少两个真实复用点；行为必须保持逐字等价。

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
