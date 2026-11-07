import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AppShell } from '#/components/AppShell'
import {
  PdfDropZone,
  canSubmitPdfFiles,
} from '#/components/PdfDropZone'
import { StatusBanner } from '#/components/StatusBanner'
import { SegmentedToggle } from '#/components/SegmentedToggle'
import { JobProgress } from '#/components/JobProgress'
import { consumeJobSse } from '#/lib/consume-job-sse'
import { downloadResponseAsFile } from '#/lib/download'
import type { SplitOutputFormat } from '#/lib/split-output'
import { getUploadLimits } from '#/server/pdf.functions'

export const Route = createFileRoute('/split')({
  loader: () => getUploadLimits(),
  component: SplitPage,
})

function SplitPage() {
  const limits = Route.useLoaderData()

  const [files, setFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState('pages')
  const [outputFormat, setOutputFormat] = useState<SplitOutputFormat>('pdf')
  const [jpegQuality, setJpegQuality] = useState(85)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    label: '',
  })
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
    formData.append('outputFormat', outputFormat)
    formData.append('jpegQuality', String(jpegQuality))

    setBusy(true)
    setStatus(null)
    setProgress({ current: 0, total: 0, label: 'Starting…' })

    try {
      const result = await consumeJobSse(
        '/api/split',
        { method: 'POST', body: formData },
        (event) => {
          if (event.type === 'progress') {
            setProgress({
              current: event.current,
              total: event.total,
              label: event.label,
            })
          }
        },
      )

      if (result.type === 'error') {
        throw new Error(result.message)
      }
      const download = await fetch(result.downloadUrl)
      await downloadResponseAsFile(download, result.filename)
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
          Upload one PDF. Each page becomes its own file inside a ZIP — either
          single-page PDFs or JPEG images (local rendering, no Adobe).
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

        <div className="mt-5 space-y-5">
          <SegmentedToggle
            label="Output per page"
            value={outputFormat}
            onChange={setOutputFormat}
            disabled={busy}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'jpeg', label: 'JPEG' },
            ]}
          />

          {outputFormat === 'jpeg' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label htmlFor="jpegQuality" className="text-sm font-medium text-ink-700">
                  JPEG quality
                </label>
                <span className="text-sm tabular-nums text-ink-500">{jpegQuality}%</span>
              </div>
              <input
                id="jpegQuality"
                type="range"
                min={50}
                max={95}
                step={1}
                value={jpegQuality}
                disabled={busy}
                onChange={(e) => setJpegQuality(Number(e.target.value))}
                className="w-full accent-sea-500"
              />
              <p className="mt-1.5 text-xs text-ink-500">
                Higher quality means larger files. Uses mozjpeg compression on the
                server.
              </p>
            </div>
          )}

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

        {busy && (
          <div className="mt-5">
            <JobProgress
              active={busy}
              current={progress.current}
              total={progress.total}
              label={progress.label}
            />
          </div>
        )}

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
            {busy
              ? 'Splitting…'
              : outputFormat === 'jpeg'
                ? 'Split to JPEG ZIP'
                : 'Split to PDF ZIP'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
