/** Client-side validation for Adobe-style page range strings (1-based). */

export function validatePageRangeLine(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed === '*' || trimmed.toLowerCase() === 'all') {
    return null
  }

  for (const part of trimmed.split(',')) {
    const segment = part.trim()
    if (!segment) continue

    if (segment.includes('-')) {
      const [startRaw, endRaw] = segment.split('-')
      const start = Number.parseInt(startRaw, 10)
      const end = Number.parseInt(endRaw, 10)
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 1 ||
        end < start
      ) {
        return `Invalid range: ${segment}`
      }
    } else {
      const page = Number.parseInt(segment, 10)
      if (!Number.isFinite(page) || page < 1) {
        return `Invalid page: ${segment}`
      }
    }
  }

  return null
}

export function validatePageRangesForFiles(
  ranges: string[],
  fileCount: number,
): string | null {
  if (ranges.length !== fileCount) {
    return 'Set page ranges for each selected PDF.'
  }
  for (let i = 0; i < ranges.length; i += 1) {
    const err = validatePageRangeLine(ranges[i] ?? '')
    if (err) {
      return `File ${i + 1}: ${err}`
    }
  }
  return null
}
