import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let loaded = false

/** Load repo `.env` / `.env.local` once per server process. Server-only. */
export function ensureServerEnv() {
  if (loaded) return

  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  )

  dotenv.config({ path: path.join(repoRoot, '.env') })
  dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true })
  loaded = true
}
