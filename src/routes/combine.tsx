import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { AppShell } from '#/components/AppShell'
import {
  PdfDropZone,
  canSubmitPdfFiles,
} from '#/components/PdfDropZone'
import { StatusBanner } from '#/components/StatusBanner'
import { downloadResponseAsFile } from '#/lib/download'
import { combinePdfs, getUploadLimits } from '#/server/pdf.functions'

export const Route = createFileRoute('/combine')({
  loader: () => getUploadLimits(),
  component: CombinePage,
})

function CombinePage() {
  const limits = Route.useLoaderData()
  const runCombine = useServerFn(combinePdfs)

  const [files, setFiles] = useState<File[]>([])
  const [filename, setFilename] = useState('combined')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)

  const canSubmit = canSubmitPdfFiles(files, {
    minFiles: 2,
    maxFiles: limits.maxFiles,
    maxFileSizeMb: limits.maxFileSizeMb,
  })

  const resolveDownloadName = () => {
    let name = filename.trim() || 'combined'
    if (!name.toLowerCase().endsWith('.pdf')) name += '.pdf'
    return name.replace(/[/\\?%*:|"<>]/g, '_')
  }

  const onSubmit = async () => {
    if (!canSubmit) return

    const formData = new FormData()
    files.forEach((file) => formData.append('pdfs', file))
    formData.append('filename', filename.trim() || 'combined')

    setBusy(true)
    setStatus(null)

    try {
      const response = await runCombine({ data: formData })
      await downloadResponseAsFile(response, resolveDownloadName())
      setStatus({
        message: 'Download started! Your combined PDF is ready.',
        type: 'success',
      })
    } catch (err) {
      setStatus({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
        type: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell active="combine">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Combine PDFs</h1>
        <p className="text-ink-500">
          Select two or more PDF files. They will be merged in the order you
          pick.
        </p>
      </div>

      <div className="card">
        <PdfDropZone
          multiple
          files={files}
          onFilesChange={setFiles}
          maxFiles={limits.maxFiles}
          maxFileSizeMb={limits.maxFileSizeMb}
          minFiles={2}
        />

        <div className="mt-5">
          <label
            htmlFor="outputFilename"
            className="block text-sm font-medium text-ink-700 mb-1.5"
          >
            Output file name
          </label>
          <input
            type="text"
            id="outputFilename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="combined"
            className="input-field"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            `.pdf` is added automatically if omitted.
          </p>
        </div>

        {status && (
          <StatusBanner message={status.message} type={status.type} />
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={onSubmit}
            className="btn btn-primary"
          >
            {busy ? 'Combining…' : 'Combine & Download'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
