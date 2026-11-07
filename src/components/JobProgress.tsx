import { progressPercent } from '#/lib/job-progress'

type JobProgressProps = {
  active: boolean
  current: number
  total: number
  label: string
  /** When false, the bar reflects server-reported progress (not an estimate). */
  estimated?: boolean
}

export function JobProgress({
  active,
  current,
  total,
  label,
  estimated = false,
}: JobProgressProps) {
  if (!active) return null

  const percent = progressPercent(current, total)
  const prefix = estimated ? '~' : ''

  return (
    <div
      className="rounded-xl border border-ink-200 bg-ink-100/80 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 text-sm text-ink-700">
        <span className="font-medium text-ink-900">{label}</span>
        <span className="tabular-nums text-ink-500">
          {total > 0 ? (
            <>
              {prefix}
              {percent}%
              <span className="text-ink-400 font-normal">
                {' '}
                ({current}/{total})
              </span>
            </>
          ) : (
            '…'
          )}
        </span>
      </div>
      <div
        className="mt-3.5 h-2 overflow-hidden rounded-full bg-ink-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={estimated ? 'Estimated job progress' : 'Job progress'}
      >
        <div
          className="h-full rounded-full bg-sea-500 transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {estimated && (
        <p className="mt-2 text-xs text-ink-500 leading-relaxed">
          Estimated progress — download starts when the job completes.
        </p>
      )}
    </div>
  )
}
