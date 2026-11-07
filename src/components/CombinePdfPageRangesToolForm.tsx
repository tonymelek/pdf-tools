import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'
import { FilePicker } from '#/components/FilePicker'
import { StatusBanner } from '#/components/StatusBanner'
import { canSubmitFiles } from '#/lib/file-picker'
import {
  validatePageRangeLine,
  validatePageRangesForFiles,
} from '#/lib/page-ranges'
import { AdobeJobProgress } from '#/components/AdobeJobProgress'
import { downloadResponseAsFile } from '#/lib/download'
import { totalBytesFromFormData } from '#/lib/adobe-job-progress'
import { runAdobeTool } from '#/server/adobe.functions'
import type { ToolDefinition } from '#/lib/tool-definition'

const MIN_PDFS = 2

export function CombinePdfPageRangesToolForm({
  tool,
  canRun,
  maxFileSizeMb,
  maxFiles,
}: {
  tool: ToolDefinition
  canRun: boolean
  maxFileSizeMb: number
  maxFiles: number
}) {
  const runTool = useServerFn(runAdobeTool)
  const [files, setFiles] = useState<File[]>([])
  const [ranges, setRanges] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [uploadBytes, setUploadBytes] = useState(0)
  const [status, setStatus] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)

  useEffect(() => {
    setRanges((prev) => {
      const next = prev.slice(0, files.length)
      while (next.length < files.length) {
        next.push('')
      }
      return next
    })
  }, [files.length])

  const fileLimits = useMemo(
    () => ({
      minFiles: MIN_PDFS,
      maxFiles,
      maxFileSizeMb,
    }),
    [maxFiles, maxFileSizeMb],
  )

  const filesOk = canSubmitFiles(files, fileLimits)
  const rangeError =
    files.length >= MIN_PDFS
      ? validatePageRangesForFiles(ranges, files.length)
      : null
  const canSubmit = canRun && filesOk && !rangeError

  const setRangeAt = (index: number, value: string) => {
    setRanges((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const formData = new FormData()
    formData.set('toolId', tool.id)
    files.forEach((file) => formData.append('pdfs', file))
    formData.set('pageRangesPerFile', ranges.join('\n'))

    setUploadBytes(totalBytesFromFormData(formData))
    setBusy(true)
    setStatus(null)

    try {
      const response = await runTool({ data: formData })
      await downloadResponseAsFile(response, tool.output.downloadName)
      setStatus({ message: 'Download started.', type: 'success' })
    } catch (err) {
      setStatus({
        message:
          err instanceof Error ? err.message : 'Something went wrong.',
        type: 'error',
      })
    } finally {
      setBusy(false)
      setUploadBytes(0)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <p className="text-sm text-ink-500 -mt-1 pb-1 border-b border-ink-100">
        Downloads as {tool.output.downloadName}. Pick at least two PDFs, then
        choose which pages from each file go into the merged PDF (merge order
        matches the list below).
      </p>

      <FilePicker
        accept=".pdf,application/pdf"
        multiple
        maxFiles={maxFiles}
        minFiles={MIN_PDFS}
        maxFileSizeMb={maxFileSizeMb}
        files={files}
        onFilesChange={setFiles}
        showIndex
        label="PDF files"
        listAriaLabel="PDFs to combine"
      />

      {files.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink-700">
            Page ranges per file
          </legend>
          <p className="text-xs text-ink-500 -mt-1">
            Comma-separated pages or ranges (1-based). Leave blank or use{' '}
            <code className="text-ink-700">all</code> to include every page from
            that PDF.
          </p>
          <ul className="space-y-3">
            {files.map((file, index) => {
              const lineError = validatePageRangeLine(ranges[index] ?? '')
              return (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="rounded-xl border border-ink-200 bg-surface px-3 py-3 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-700"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          {file.name}
                        </span>
                      </span>
                    </div>
                    <label className="sr-only" htmlFor={`page-range-${index}`}>
                      Page ranges for {file.name}
                    </label>
                    <input
                      id={`page-range-${index}`}
                      type="text"
                      value={ranges[index] ?? ''}
                      onChange={(e) => setRangeAt(index, e.target.value)}
                      placeholder="e.g. 1-3, 5 or all"
                      className={`input-field sm:max-w-xs ${lineError ? 'border-red-400' : ''}`}
                      autoComplete="off"
                    />
                  </div>
                  {lineError && (
                    <p className="mt-2 text-xs text-danger" role="alert">
                      {lineError}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}

      {files.length > 0 && files.length < MIN_PDFS && (
        <p className="text-sm text-ink-500">
          Add at least {MIN_PDFS} PDFs to combine.
        </p>
      )}

      {rangeError && files.length >= MIN_PDFS && (
        <p className="text-sm text-danger" role="alert">
          {rangeError}
        </p>
      )}

      {busy && (
        <AdobeJobProgress active={busy} totalUploadBytes={uploadBytes} />
      )}

      {status && <StatusBanner message={status.message} type={status.type} />}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={!canSubmit || busy} className="btn btn-primary">
          {busy ? 'Running…' : 'Run & Download'}
        </button>
      </div>
    </form>
  )
}
