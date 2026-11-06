import fs from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'

export async function combinePDFs(filePaths: string[]) {
  if (!filePaths.length) {
    throw new Error('No PDF files provided')
  }

  const mergedPdf = await PDFDocument.create()

  for (const pdfPath of filePaths) {
    const pdfBytes = await fs.readFile(pdfPath)
    const pdf = await PDFDocument.load(pdfBytes)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  return Buffer.from(await mergedPdf.save())
}
