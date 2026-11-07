import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { ensureServerEnv } from '#/server/env.server'
import { cleanupSessionDir, createSessionDir } from '#/server/lib/temp'
import {
  formFieldsFromFormData,
  persistToolUploads,
} from '#/server/lib/tool-upload'
import {
  getMaxFileSizeMb,
  getMaxFiles,
} from '#/server/lib/upload-limits.server'
import type { CatalogTool } from '#/lib/tool-definition'

const serverDir = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(serverDir)

const ADOBE_BRIDGE_PATH = `${serverDir}/adobe-bridge.cjs`
const ADOBE_MODULE_PATHS = [
  ADOBE_BRIDGE_PATH,
  `${serverDir}/lib/adobe/catalog.cjs`,
  `${serverDir}/lib/adobe/operations.cjs`,
  `${serverDir}/lib/adobe/client.cjs`,
  `${serverDir}/lib/adobe/pageRanges.cjs`,
]

type AdobeBridge = {
  getTool: (id: string) => CatalogTool | null
  getToolsByCategory: () => { category: string; tools: CatalogTool[] }[]
  isAdobeConfigured: () => boolean
  formatAdobeError: (err: unknown) => string
  runOperation: (
    id: string,
    ctx: { files: unknown; body: Record<string, string> },
  ) => Promise<{ buffer?: Buffer; json?: unknown }>
  OPERATIONS: Record<string, unknown>
}

let bridge: AdobeBridge | null = null

const isDevServer =
  import.meta.env.DEV || process.env.NODE_ENV !== 'production'

function reloadAdobeBridgeInDev() {
  if (!isDevServer) return
  for (const modulePath of ADOBE_MODULE_PATHS) {
    delete require.cache[modulePath]
  }
}

function adobe(): AdobeBridge {
  reloadAdobeBridgeInDev()
  if (isDevServer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./adobe-bridge.cjs') as AdobeBridge
  }
  if (!bridge) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    bridge = require('./adobe-bridge.cjs') as AdobeBridge
  }
  return bridge
}

export async function getToolCatalogImpl() {
  ensureServerEnv()
  const { getToolsByCategory, isAdobeConfigured } = adobe()
  return {
    categories: getToolsByCategory(),
    adobeConfigured: isAdobeConfigured(),
    maxFileSizeMb: getMaxFileSizeMb(),
    maxFiles: getMaxFiles(),
  }
}

export async function getToolDetailsImpl(id: string) {
  ensureServerEnv()
  const { getTool, isAdobeConfigured, OPERATIONS } = adobe()
  const tool = getTool(id)
  if (!tool) {
    return null
  }

  return {
    tool,
    adobeConfigured: isAdobeConfigured(),
    canRun:
      tool.implemented &&
      !!OPERATIONS[tool.id] &&
      isAdobeConfigured(),
    maxFileSizeMb: getMaxFileSizeMb(),
    maxFiles: getMaxFiles(),
  }
}

export async function runAdobeToolImpl(formData: FormData, toolId: string) {
  ensureServerEnv()
  const {
    getTool,
    isAdobeConfigured,
    formatAdobeError,
    runOperation,
    OPERATIONS,
  } = adobe()

  const tool = getTool(toolId)
  if (!tool || tool.provider !== 'adobe') {
    throw new Error('Tool not found')
  }
  if (!tool.implemented || !OPERATIONS[tool.id]) {
    throw new Error(tool.note || 'This tool is not available yet')
  }
  if (!isAdobeConfigured()) {
    throw new Error('Adobe PDF Services credentials not configured')
  }

  let sessionDir: string | undefined

  try {
    sessionDir = await createSessionDir()
    const files = await persistToolUploads(sessionDir, tool, formData)
    const fieldNames = (tool.fields || []).map((f) => f.name)
    const body = formFieldsFromFormData(formData, fieldNames)

    const result = await runOperation(tool.id, { files, body })

    if (result.json) {
      return new Response(JSON.stringify(result.json, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${tool.output.downloadName}"`,
        },
      })
    }

    let downloadName = tool.output.downloadName
    let contentType: string =
      tool.output.contentType ?? 'application/octet-stream'
    if (
      tool.id === 'autotag-pdf-with-options' &&
      body.generateReport === 'true'
    ) {
      downloadName = 'autotag.zip'
      contentType = 'application/zip'
    }

    if (result.buffer === undefined) {
      throw new Error('Adobe operation returned no file buffer')
    }

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? formatAdobeError(error) : 'Request failed'
    throw new Error(message)
  } finally {
    await cleanupSessionDir(sessionDir)
  }
}
