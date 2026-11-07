import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { FilePicker } from '#/components/FilePicker'
import { runAdobeTool } from '#/server/adobe.functions'
import { StatusBanner } from '#/components/StatusBanner'
import { AdobeJobProgress } from '#/components/AdobeJobProgress'
import { downloadResponseAsFile } from '#/lib/download'
import { totalBytesFromFormData } from '#/lib/adobe-job-progress'
import type { ToolDefinition } from '#/lib/tool-definition'

export type { ToolDefinition } from '#/lib/tool-definition'

export function ToolForm({
  tool,
  canRun,
  maxFileSizeMb,
}: {
  tool: ToolDefinition
  canRun: boolean
  maxFileSizeMb: number
}) {
  const runTool = useServerFn(runAdobeTool)
  const [busy, setBusy] = useState(false)
  const [uploadBytes, setUploadBytes] = useState(0)
  const [status, setStatus] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canRun) return

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('toolId', tool.id)

    setUploadBytes(totalBytesFromFormData(formData))
    setBusy(true)
    setStatus(null)

    try {
      const response = await runTool({ data: formData })
      await downloadResponseAsFile(response, tool.output.downloadName)
      setStatus({
        message: 'Download started.',
        type: 'success',
      })
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

  const outputHint =
    tool.output.zip || tool.output.contentType?.includes('zip')
      ? `Downloads as ${tool.output.downloadName} (ZIP archive).`
      : `Downloads as ${tool.output.downloadName}.`

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <p className="text-sm text-ink-500 -mt-1 pb-1 border-b border-ink-100">
        {outputHint}
      </p>

      {tool.files.map((fileSpec) => (
        <FilePicker
          key={fileSpec.field}
          name={fileSpec.field}
          label={fileSpec.label}
          accept={fileSpec.accept}
          multiple={fileSpec.multiple}
          required={fileSpec.required}
          maxFileSizeMb={maxFileSizeMb}
          minFiles={fileSpec.required ? 1 : 0}
        />
      ))}

      {tool.fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={`field-${field.name}`}
            className="block text-sm font-medium text-ink-700 mb-1.5"
          >
            {field.label}
          </label>
          {field.type === 'select' && field.options ? (
            <select
              id={`field-${field.name}`}
              name={field.name}
              defaultValue={field.defaultValue}
              className="input-field"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={`field-${field.name}`}
              name={field.name}
              rows={3}
              placeholder={field.placeholder}
              className="input-field"
            />
          ) : (
            <input
              id={`field-${field.name}`}
              name={field.name}
              type={
                field.type === 'password'
                  ? 'password'
                  : field.type === 'number'
                    ? 'number'
                    : 'text'
              }
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              className="input-field"
            />
          )}
          {field.help && (
            <p className="mt-1 text-xs text-ink-500">{field.help}</p>
          )}
        </div>
      ))}

      {busy && (
        <AdobeJobProgress active={busy} totalUploadBytes={uploadBytes} />
      )}

      {status && <StatusBanner message={status.message} type={status.type} />}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={!canRun || busy} className="btn btn-primary">
          {busy ? 'Running…' : 'Run & Download'}
        </button>
      </div>
    </form>
  )
}

export function AdobeCredentialsBanner() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p>
        Set{' '}
        <code className="text-amber-900">PDF_SERVICES_CLIENT_ID</code> and{' '}
        <code className="text-amber-900">PDF_SERVICES_CLIENT_SECRET</code> in
        your <code className="text-amber-900">.env</code> to run Adobe-powered
        tools.
      </p>
    </div>
  )
}
