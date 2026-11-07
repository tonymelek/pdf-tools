import type {
  JobCompletePayload,
  JobErrorPayload,
  JobStreamEvent,
} from '#/lib/job-progress'

function parseSseDataLine(line: string): JobStreamEvent | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null
  const json = trimmed.slice(5).trim()
  if (!json) return null
  try {
    return JSON.parse(json) as JobStreamEvent
  } catch {
    return null
  }
}

/** POST + `text/event-stream` body; invokes `onEvent` until complete or error. */
export async function consumeJobSse(
  url: string,
  init: RequestInit,
  onEvent: (event: JobStreamEvent) => void,
): Promise<JobCompletePayload | JobErrorPayload> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'text/event-stream',
      ...init.headers,
    },
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      const text = await response.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }

  const body = response.body
  if (!body) {
    throw new Error('No response body')
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let lastEvent: JobCompletePayload | JobErrorPayload | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''
    for (const line of parts) {
      const evt = parseSseDataLine(line)
      if (!evt) continue
      onEvent(evt)
      if (evt.type === 'complete' || evt.type === 'error') {
        lastEvent = evt
        await reader.cancel()
        return evt
      }
    }
  }

  if (lastEvent) {
    return lastEvent
  }

  throw new Error('Job stream ended without a result')
}
