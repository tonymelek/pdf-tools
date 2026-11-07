import { Readable } from 'node:stream'
import { createFileRoute } from '@tanstack/react-router'
import { cleanupSessionDir } from '#/server/lib/temp'
import { takeSplitDownload } from '#/server/lib/split-download-store'

export const Route = createFileRoute('/api/split/download')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const token = new URL(request.url).searchParams.get('token')
        if (!token) {
          return new Response('Missing token', { status: 400 })
        }

        const entry = takeSplitDownload(token)
        if (!entry) {
          return new Response('Download expired or not found', { status: 404 })
        }

        const sessionDir = entry.sessionDir
        entry.stream.on('end', () => {
          void cleanupSessionDir(sessionDir)
        })
        entry.stream.on('error', () => {
          void cleanupSessionDir(sessionDir)
        })

        const body = Readable.toWeb(entry.stream) as ReadableStream

        return new Response(body, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${entry.filename}"`,
          },
        })
      },
    },
  },
})
