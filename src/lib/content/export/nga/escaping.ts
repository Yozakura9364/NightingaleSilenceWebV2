// NGA BBCode escaping — URL-position encoding only.
// NGA has NO backslash escape syntax: text is emitted raw (NGA itself renders
// unknown tag-like text literally). The only context that still needs encoding
// is the [url=…] attribute position, where ] or whitespace would break the
// tag boundary — there we use real percent-encoding.

/** Escaping inside [url=…] and [img]…[/img] attribute/URL positions. */
export function escapeNgaUrl(url: string): string {
  // URLs may not contain ] or whitespace; keep the raw value but strip
  // characters that would break the tag boundary.
  return url.replace(/[\]]/g, '%5D').replace(/\s/g, '%20')
}
