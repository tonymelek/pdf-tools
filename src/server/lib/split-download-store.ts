import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import { createSessionDir, cleanupSessionDir } from '#/server/lib/temp'

type PendingDownload = {
  filePath: string
  sessionDir: string
  filename: string
  expiresAt: number
}

const TTL_MS = 15 * 60 * 1000
const downloads = new Map<string, PendingDownload>()

function purgeExpired() {
  const now = Date.now()
  for (const [token, entry] of downloads) {
    if (entry.expiresAt <= now) {
      downloads.delete(token)
      void cleanupSessionDir(entry.sessionDir)
    }
  }
}

export async function storeSplitZip(
  zip: Buffer,
  filename: string,
): Promise<string> {
  purgeExpired()
  const token = crypto.randomUUID()
  const sessionDir = await createSessionDir()
  const filePath = path.join(sessionDir, 'split.zip')
  await fsPromises.writeFile(filePath, zip)
  downloads.set(token, {
    filePath,
    sessionDir,
    filename,
    expiresAt: Date.now() + TTL_MS,
  })
  return token
}

export function takeSplitDownload(token: string): {
  stream: fs.ReadStream
  filename: string
  sessionDir: string
} | null {
  purgeExpired()
  const entry = downloads.get(token)
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) {
      downloads.delete(token)
      void cleanupSessionDir(entry.sessionDir)
    }
    return null
  }
  downloads.delete(token)
  return {
    stream: fs.createReadStream(entry.filePath),
    filename: entry.filename,
    sessionDir: entry.sessionDir,
  }
}
