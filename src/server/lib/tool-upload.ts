import fs from 'node:fs/promises'
import path from 'node:path'
import {
  getMaxFileSizeBytes,
  getMaxFiles,
} from '#/server/lib/upload-limits.server'

const EXTENSIONS: Record<string, string[]> = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  pptx: ['.pptx'],
  html: ['.html', '.htm'],
  archive: ['.zip'],
}

export type ToolFileSpec = {
  field: string
  label: string
  multiple?: boolean
  required?: boolean
}

export type AdobeToolLike = {
  files: ToolFileSpec[]
}

export type UploadedToolFile = {
  path: string
  originalname: string
  mimetype: string
  size: number
}

function allowedExtensions(tool: AdobeToolLike) {
  const allowed = new Set<string>()
  for (const fileSpec of tool.files) {
    const field = fileSpec.field
    if (field === 'pdfs') {
      EXTENSIONS.pdf.forEach((ext) => allowed.add(ext))
    } else if (EXTENSIONS[field]) {
      EXTENSIONS[field].forEach((ext) => allowed.add(ext))
    } else if (field === 'watermark') {
      EXTENSIONS.pdf.forEach((ext) => allowed.add(ext))
    }
  }
  return allowed
}

async function writeOneFile(
  sessionDir: string,
  file: File,
  allowed: Set<string>,
  maxBytes: number,
): Promise<UploadedToolFile> {
  const ext = path.extname(file.name).toLowerCase()
  if (!allowed.has(ext)) {
    throw new Error(`File type not allowed for this tool: ${ext || 'unknown'}`)
  }
  if (file.size > maxBytes) {
    throw new Error(`File size exceeds ${maxBytes / (1024 * 1024)}MB limit`)
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const dest = path.join(sessionDir, `${Date.now()}-${safeName}`)
  await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()))

  return {
    path: dest,
    originalname: file.name,
    mimetype: file.type,
    size: file.size,
  }
}

function validateRequiredFiles(
  tool: AdobeToolLike,
  files: Record<string, UploadedToolFile | UploadedToolFile[] | null>,
) {
  for (const spec of tool.files) {
    if (!spec.required) continue
    const value = files[spec.field]
    if (spec.multiple) {
      const list = value as UploadedToolFile[] | undefined
      if (!list?.length) {
        throw new Error(`Upload at least one ${spec.label.toLowerCase()}`)
      }
    } else if (!value) {
      throw new Error(`${spec.label} is required`)
    }
  }
}

export async function persistToolUploads(
  sessionDir: string,
  tool: AdobeToolLike,
  formData: FormData,
): Promise<Record<string, UploadedToolFile | UploadedToolFile[] | null>> {
  const allowed = allowedExtensions(tool)
  const maxBytes = getMaxFileSizeBytes()
  const maxFiles = getMaxFiles()
  const result: Record<string, UploadedToolFile | UploadedToolFile[] | null> =
    {}

  for (const spec of tool.files) {
    if (spec.multiple) {
      const incoming = formData
        .getAll(spec.field)
        .filter((v): v is File => v instanceof File && v.size > 0)
      if (incoming.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`)
      }
      const uploaded: UploadedToolFile[] = []
      for (const file of incoming) {
        uploaded.push(await writeOneFile(sessionDir, file, allowed, maxBytes))
      }
      result[spec.field] = uploaded
    } else {
      const file = formData.get(spec.field)
      result[spec.field] =
        file instanceof File && file.size > 0
          ? await writeOneFile(sessionDir, file, allowed, maxBytes)
          : null
    }
  }

  validateRequiredFiles(tool, result)
  return result
}

export function formFieldsFromFormData(
  formData: FormData,
  fieldNames: string[],
): Record<string, string> {
  const body: Record<string, string> = {}
  for (const name of fieldNames) {
    const value = formData.get(name)
    if (value != null && typeof value === 'string') {
      body[name] = value
    } else if (value != null) {
      body[name] = String(value)
    }
  }
  return body
}
