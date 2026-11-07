import { createFileRoute } from '@tanstack/react-router'
import { splitJobFromRequest } from '#/server/split-job.server'

export const Route = createFileRoute('/api/split')({
  server: {
    handlers: {
      POST: ({ request }) => splitJobFromRequest(request),
    },
  },
})
