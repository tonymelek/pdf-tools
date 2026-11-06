import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

export const TMP_ROOT = path.join(repoRoot, 'tmp')

async function ensureTmpRoot() {
  await fs.mkdir(TMP_ROOT, { recursive: true })
}

export async function createSessionDir() {
  await ensureTmpRoot()
  const dir = path.join(TMP_ROOT, crypto.randomUUID())
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function cleanupSessionDir(dir: string | undefined) {
  if (!dir) return
  await fs.rm(dir, { recursive: true, force: true })
}
