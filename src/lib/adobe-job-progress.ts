/**
 * Client-only heuristic: Adobe jobs are one HTTP round-trip with no real progress.
 * We map elapsed time + upload size to a 0–99% display that eases past the
 * expected duration so long jobs still feel responsive.
 */
export function estimateAdobeJobProgressPercent(
  elapsedMs: number,
  totalUploadBytes: number,
): number {
  const totalMb = Math.max(0, totalUploadBytes / (1024 * 1024))
  const expectedMs = Math.min(
    180_000,
    Math.max(12_000, 6_000 + totalMb * 3_000),
  )

  if (elapsedMs <= expectedMs) {
    const t = elapsedMs / expectedMs
    return Math.min(96, Math.floor(6 + t * 90))
  }

  const over = elapsedMs - expectedMs
  const creep = Math.min(3, Math.floor(over / 20_000))
  return Math.min(99, 96 + creep)
}

export function progressPhaseLabel(percent: number): string {
  if (percent < 18) return 'Uploading…'
  if (percent < 55) return 'Processing on Adobe…'
  if (percent < 88) return 'Working on your document…'
  return 'Finishing up…'
}

export function totalBytesFromFormData(formData: FormData): number {
  let n = 0
  for (const [, value] of formData.entries()) {
    if (value instanceof File) {
      n += value.size
    }
  }
  return n
}
