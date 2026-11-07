import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import type { SplitPage, SplitProgressCallback } from '#/server/lib/split'

const require = createRequire(import.meta.url)

const RENDER_MAX_PX = 2048

let pdfJsReady: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null =
  null

async function loadPdfJs() {
  if (!pdfJsReady) {
    pdfJsReady = import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
      const workerPath = require.resolve(
        'pdfjs-dist/legacy/build/pdf.worker.mjs',
      )
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href
      return pdfjs
    })
  }
  return pdfJsReady
}

export async function splitPdfToJpegPages(
  pdfBytes: Buffer,
  {
    folderName = 'pages',
    jpegQuality = 85,
    onProgress,
  }: {
    folderName?: string
    jpegQuality?: number
    onProgress?: SplitProgressCallback
  } = {},
): Promise<SplitPage[]> {
  const [{ createCanvas }, sharp, { getDocument }] = await Promise.all([
    import('@napi-rs/canvas'),
    import('sharp').then((m) => m.default),
    loadPdfJs(),
  ])

  const quality = Math.min(95, Math.max(40, Math.round(jpegQuality)))
  const data = new Uint8Array(pdfBytes)
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise

  const pages: SplitPage[] = []
  const total = pdf.numPages
  onProgress?.(0, total, `Rendering ${total} page${total === 1 ? '' : 's'} to JPEG…`)

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const base = page.getViewport({ scale: 1 })
      const longest = Math.max(base.width, base.height)
      const scale = Math.min(3, Math.max(1, RENDER_MAX_PX / longest))
      const viewport = page.getViewport({ scale })

      const width = Math.ceil(viewport.width)
      const height = Math.ceil(viewport.height)
      const canvas = createCanvas(width, height)
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not create rendering context')
      }

      await page
        .render({
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
          intent: 'print',
        })
        .promise

      const rgba = canvas.toBuffer('image/png')
      const jpegBuffer = await sharp(rgba)
        .jpeg({
          quality,
          mozjpeg: true,
          chromaSubsampling: '4:2:0',
        })
        .toBuffer()

      pages.push({
        name: `${folderName}/page_${pageNum}.jpg`,
        buffer: jpegBuffer,
      })
      onProgress?.(pageNum, total, `Page ${pageNum} of ${total}`)

      page.cleanup()
    }
  } finally {
    await pdf.cleanup()
  }

  return pages
}
