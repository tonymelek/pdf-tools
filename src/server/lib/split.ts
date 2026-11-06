import { PDFDocument } from 'pdf-lib'

export type SplitPage = { name: string; buffer: Buffer }

export async function splitPDF(
  pdfBytes: Buffer,
  { folderName = 'pages' }: { folderName?: string } = {},
): Promise<SplitPage[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const numPages = pdfDoc.getPageCount()
  const pages: SplitPage[] = []

  for (let i = 0; i < numPages; i++) {
    const newPdfDoc = await PDFDocument.create()
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i])
    newPdfDoc.addPage(copiedPage)

    pages.push({
      name: `${folderName}/page_${i + 1}.pdf`,
      buffer: Buffer.from(await newPdfDoc.save()),
    })
  }

  return pages
}
