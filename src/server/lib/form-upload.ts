import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getMaxFileSizeBytes,
  getMaxFiles,
  isPdfFile,
} from './upload-limits.server'

export async function writePdfFiles(
  sessionDir: string,
  files: File[],
  { fieldLabel = 'PDF' }: { fieldLabel?: string } = {},
) {
  if (!files.length) {
    throw new Error(`No ${fieldLabel} files uploaded`)
  }

  const maxFiles = getMaxFiles()
  if (files.length > maxFiles) {
    throw new Error(`Maximum ${maxFiles} files allowed`)
  }

  const maxBytes = getMaxFileSizeBytes()
  const paths: string[] = []

  for (const file of files) {
    if (!isPdfFile(file)) {
      throw new Error('Only PDF files are allowed')
    }
    if (file.size > maxBytes) {
      throw new Error(
        `File size exceeds ${maxBytes / (1024 * 1024)}MB limit`,
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const dest = path.join(sessionDir, `${Date.now()}-${safeName}`)
    const bytes = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(dest, bytes)
    paths.push(dest)
  }

  return paths
}

export function filesFromFormData(formData: FormData, field: string) {
  return formData
    .getAll(field)
    .filter((value): value is File => value instanceof File && value.size > 0)
}
