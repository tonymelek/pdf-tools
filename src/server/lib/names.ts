function sanitizeSegment(name: string, fallback: string) {
  const sanitized = String(name || fallback)
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\.+/, '')
    .slice(0, 100)

  return sanitized || fallback
}

export function sanitizePdfFilename(name: string, fallback = 'combined') {
  let base = sanitizeSegment(name, fallback)
  base = base.replace(/\.pdf$/i, '')
  return `${base}.pdf`
}

export function sanitizeFolderName(name: string, fallback = 'pages') {
  return sanitizeSegment(name, fallback)
}
