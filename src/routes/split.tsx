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
import { getUploadLimits, splitPdf } from '#/server/pdf.functions'

export const Route = createFileRoute('/split')({
  loader: () => getUploadLimits(),
  component: SplitPage,
})

function SplitPage() {
  const limits = Route.useLoaderData()
  const runSplit = useServerFn(splitPdf)

  const [files, setFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState('pages')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)

  const canSubmit = canSubmitPdfFiles(files, {
    minFiles: 1,
    maxFiles: 1,
    maxFileSizeMb: limits.maxFileSizeMb,
  })

  const onSubmit = async () => {
    if (!canSubmit || !files[0]) return

    const formData = new FormData()
    formData.append('pdf', files[0])
    formData.append('folderName', folderName.trim() || 'pages')

    setBusy(true)
    setStatus(null)

    try {
      const response = await runSplit({ data: formData })
      const safeFolder = (folderName.trim() || 'pages').replace(
        /[/\\?%*:|"<>]/g,
        '_',
      )
      await downloadResponseAsFile(response, `${safeFolder}.zip`)
      setStatus({
        message: 'Download started! Your ZIP archive is ready.',
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
    <AppShell active="split">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Split PDF</h1>
        <p className="text-ink-500">
          Upload one PDF. Each page becomes its own file inside a ZIP archive.
        </p>
      </div>

      <div className="card">
        <PdfDropZone
          files={files}
          onFilesChange={setFiles}
          maxFiles={1}
          maxFileSizeMb={limits.maxFileSizeMb}
          minFiles={1}
        />

        <div className="mt-5">
          <label
            htmlFor="folderName"
            className="block text-sm font-medium text-ink-700 mb-1.5"
          >
            Folder name inside ZIP
          </label>
          <input
            type="text"
            id="folderName"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="pages"
            className="input-field"
          />
        </div>

        {status && (
          <StatusBanner message={status.message} type={status.type} />
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={onSubmit}
            className="btn btn-sea"
          >
            {busy ? 'Splitting…' : 'Split & Download ZIP'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
