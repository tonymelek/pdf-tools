import { ensureServerEnv } from '#/server/env.server'

function readEnv() {
  ensureServerEnv()
}

export function getMaxFileSizeMb() {
  readEnv()
  return parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10)
}

export function getMaxFiles() {
  readEnv()
  return parseInt(process.env.MAX_FILES || '20', 10)
}

export function getMaxFileSizeBytes() {
  return getMaxFileSizeMb() * 1024 * 1024
}

export function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  )
}
