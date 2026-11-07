import fs from 'node:fs/promises'
import type { JobStreamEvent } from '#/lib/job-progress'
import type { SplitOutputFormat } from '#/lib/split-output'
import { ensureServerEnv } from '#/server/env.server'
import { filesFromFormData, writePdfFiles } from '#/server/lib/form-upload'
import { sanitizeFolderName } from '#/server/lib/names'
import { splitPDF, type SplitProgressCallback } from '#/server/lib/split'
import { storeSplitZip } from '#/server/lib/split-download-store'
import { cleanupSessionDir, createSessionDir } from '#/server/lib/temp'
import { entriesToZipBuffer } from '#/server/lib/zip'

export function parseSplitFormData(formData: FormData) {
  const folderName = sanitizeFolderName(
    String(formData.get('folderName') || 'pages'),
  )
  const rawFormat = String(formData.get('outputFormat') || 'pdf').toLowerCase()
  if (rawFormat !== 'pdf' && rawFormat !== 'jpeg') {
    throw new Error('Invalid output format. Choose PDF or JPEG.')
  }
  const outputFormat = rawFormat as SplitOutputFormat
  const jpegQuality = Math.min(
    95,
    Math.max(
      40,
      Number.parseInt(String(formData.get('jpegQuality') || '85'), 10) || 85,
    ),
  )
  return { folderName, outputFormat, jpegQuality }
}

export async function runSplitJob(
  formData: FormData,
  onProgress?: SplitProgressCallback,
) {
  ensureServerEnv()
  let sessionDir: string | undefined

  try {
    onProgress?.(0, 1, 'Reading PDF…')
    sessionDir = await createSessionDir()
    const uploads = filesFromFormData(formData, 'pdf')
    const [filePath] = await writePdfFiles(sessionDir, uploads.slice(0, 1), {
      fieldLabel: 'PDF',
    })

    const pdfBytes = await fs.readFile(filePath)
    const { folderName, outputFormat, jpegQuality } =
      parseSplitFormData(formData)

    const pages = await splitPDF(pdfBytes, {
      folderName,
      outputFormat,
      jpegQuality,
      onProgress,
    })

    onProgress?.(pages.length, Math.max(pages.length, 1), 'Building ZIP…')
    const zipBuffer = await entriesToZipBuffer(pages)
    const downloadName = `${folderName}.zip`
    return { zip: zipBuffer, downloadName }
  } finally {
    await cleanupSessionDir(sessionDir)
  }
}

export function splitJobSseResponse(
  run: (
    send: (event: JobStreamEvent) => void,
  ) => Promise<{ zip: Buffer; downloadName: string }>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: JobStreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        )
      }
      try {
        const { zip, downloadName } = await run(send)
        const token = await storeSplitZip(zip, downloadName)
        send({
          type: 'complete',
          downloadUrl: `/api/split/download?token=${encodeURIComponent(token)}`,
          filename: downloadName,
        })
      } catch (error) {
        send({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Split failed',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

export async function splitJobFromRequest(request: Request): Promise<Response> {
  const formData = await request.formData()
  return splitJobSseResponse(async (send) => {
    const toStreamProgress: SplitProgressCallback = (current, total, label) => {
      send({
        type: 'progress',
        current,
        total,
        stage: label.startsWith('Building') ? 'package' : 'page',
        label,
      })
    }
    return runSplitJob(formData, toStreamProgress)
  })
}
