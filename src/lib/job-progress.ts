export type JobProgressStage =
  | 'prepare'
  | 'page'
  | 'package'
  | 'done'
  | 'error'

export type JobProgressPayload = {
  type: 'progress'
  current: number
  total: number
  stage: JobProgressStage
  label: string
}

export type JobCompletePayload = {
  type: 'complete'
  downloadUrl: string
  filename: string
}

export type JobErrorPayload = {
  type: 'error'
  message: string
}

export type JobStreamEvent =
  | JobProgressPayload
  | JobCompletePayload
  | JobErrorPayload

export function progressPercent(current: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((current / total) * 100))
}
