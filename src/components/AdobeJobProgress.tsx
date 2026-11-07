import { useEffect, useRef, useState } from 'react'
import { JobProgress } from '#/components/JobProgress'
import {
  estimateAdobeJobProgressPercent,
  progressPhaseLabel,
} from '#/lib/adobe-job-progress'

type AdobeJobProgressProps = {
  active: boolean
  /** Total size of files being sent (bytes). */
  totalUploadBytes: number
}

export function AdobeJobProgress({
  active,
  totalUploadBytes,
}: AdobeJobProgressProps) {
  const startRef = useRef<number | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!active) {
      startRef.current = null
      return
    }
    startRef.current = Date.now()
    const id = window.setInterval(() => setTick((n) => n + 1), 200)
    return () => window.clearInterval(id)
  }, [active])

  if (!active) return null

  const elapsed =
    startRef.current === null ? 0 : Date.now() - startRef.current
  const percent = estimateAdobeJobProgressPercent(elapsed, totalUploadBytes)
  const label =
    startRef.current === null ? 'Starting…' : progressPhaseLabel(percent)

  return (
    <JobProgress
      active
      current={percent}
      total={100}
      label={label}
      estimated
    />
  )
}
