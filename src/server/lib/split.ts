import { PDFDocument } from 'pdf-lib'
import type { SplitOutputFormat } from '#/lib/split-output'

export type { SplitOutputFormat } from '#/lib/split-output'

export type SplitPage = { name: string; buffer: Buffer }

export type SplitProgressCallback = (
  current: number,
  total: number,
  label: string,
) => void

export type SplitOptions = {
  folderName?: string
  outputFormat?: SplitOutputFormat
  jpegQuality?: number
  onProgress?: SplitProgressCallback
}

export async function splitPDF(
  pdfBytes: Buffer,
  {
    folderName = 'pages',
    outputFormat = 'pdf',
    jpegQuality = 85,
    onProgress,
  }: SplitOptions = {},
): Promise<SplitPage[]> {
  if (outputFormat === 'jpeg') {
    const { splitPdfToJpegPages } = await import('#/server/lib/split-jpeg')
    return splitPdfToJpegPages(pdfBytes, {
      folderName,
      jpegQuality,
      onProgress,
    })
  }

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const numPages = pdfDoc.getPageCount()
  onProgress?.(0, numPages, `Splitting ${numPages} page${numPages === 1 ? '' : 's'}…`)
  const pages: SplitPage[] = []

  for (let i = 0; i < numPages; i++) {
    const newPdfDoc = await PDFDocument.create()
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i])
    newPdfDoc.addPage(copiedPage)

    pages.push({
      name: `${folderName}/page_${i + 1}.pdf`,
      buffer: Buffer.from(await newPdfDoc.save()),
    })
    onProgress?.(
      i + 1,
      numPages,
      `Page ${i + 1} of ${numPages}`,
    )
  }

  return pages
}
