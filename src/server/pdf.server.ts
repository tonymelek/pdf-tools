import { combinePDFs } from '#/server/lib/combine'
import { filesFromFormData, writePdfFiles } from '#/server/lib/form-upload'
import { sanitizePdfFilename } from '#/server/lib/names'
import { runSplitJob, parseSplitFormData } from '#/server/split-job.server'
import { cleanupSessionDir, createSessionDir } from '#/server/lib/temp'
import {
  getMaxFiles,
  getMaxFileSizeMb,
} from '#/server/lib/upload-limits.server'
import { ensureServerEnv } from '#/server/env.server'

export async function getUploadLimitsImpl() {
  ensureServerEnv()
  return {
    maxFileSizeMb: getMaxFileSizeMb(),
    maxFiles: getMaxFiles(),
  }
}

export async function combinePdfsImpl(formData: FormData) {
  ensureServerEnv()
  let sessionDir: string | undefined

  try {
    sessionDir = await createSessionDir()
    const uploads = filesFromFormData(formData, 'pdfs')
    const filePaths = await writePdfFiles(sessionDir, uploads, {
      fieldLabel: 'PDF',
    })

    if (filePaths.length < 2) {
      throw new Error('Select at least 2 PDF files to combine')
    }

    const buffer = await combinePDFs(filePaths)
    const filename = sanitizePdfFilename(
      String(formData.get('filename') || 'combined'),
    )

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } finally {
    await cleanupSessionDir(sessionDir)
  }
}

export async function splitPdfImpl(formData: FormData) {
  parseSplitFormData(formData)
  const { zip, downloadName } = await runSplitJob(formData)

  return new Response(new Uint8Array(zip), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${downloadName}"`,
    },
  })
}
