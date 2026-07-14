export function formatGlamourText(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => String(values[key] ?? match))
}
