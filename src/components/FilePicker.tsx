import { useCallback, useId, useRef, useState } from 'react'
import {
  acceptHint,
  mergeIncomingFiles,
  syncInputFiles,
  validateFileSet,
} from '#/lib/file-picker'

export type FilePickerProps = {
  /** MIME types / extensions, e.g. `.pdf,application/pdf` */
  accept: string
  multiple?: boolean
  maxFileSizeMb: number
  maxFiles?: number
  minFiles?: number
  label?: string
  required?: boolean
  /** Form field name — syncs selection into a hidden input for FormData submit */
  name?: string
  /** Controlled mode (combine/split server fn flows) */
  files?: File[]
  onFilesChange?: (files: File[]) => void
  /** Show 1, 2, 3… instead of file-type badge in the list */
  showIndex?: boolean
  listAriaLabel?: string
}

export function FilePicker({
  accept,
  multiple = false,
  maxFileSizeMb,
  maxFiles = 20,
  minFiles = 1,
  label,
  required = false,
  name,
  files: controlledFiles,
  onFilesChange,
  showIndex = false,
  listAriaLabel = 'Selected files',
}: FilePickerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalFiles, setInternalFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [flash, setFlash] = useState<{ text: string; type: 'error' | 'info' } | null>(
    null,
  )

  const isControlled = controlledFiles !== undefined && onFilesChange !== undefined
  const files = isControlled ? controlledFiles : internalFiles

  const maxBytes = maxFileSizeMb * 1024 * 1024
  const typesLabel = acceptHint(accept)

  const setFiles = useCallback(
    (next: File[]) => {
      if (isControlled) {
        onFilesChange(next)
      } else {
        setInternalFiles(next)
      }
      if (name && inputRef.current) {
        syncInputFiles(inputRef.current, next)
      }
    },
    [isControlled, name, onFilesChange],
  )

  const applyIncoming = useCallback(
    (incoming: FileList | File[]): File[] | null => {
      const result = mergeIncomingFiles(files, incoming, {
        accept,
        multiple,
        maxFiles,
        maxBytes,
        maxFileSizeMb,
      })
      if (!result.ok) {
        setFlash({ type: 'error', text: result.error })
        return null
      }
      setFiles(result.files)
      setFlash(
        result.files.length
          ? {
              type: 'info',
              text: `${result.files.length} file${result.files.length === 1 ? '' : 's'} selected.`,
            }
          : null,
      )
      return result.files
    },
    [accept, files, maxBytes, maxFileSizeMb, maxFiles, multiple, setFiles],
  )

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    setFiles(next)
    setFlash(
      next.length
        ? {
            type: 'info',
            text: `${next.length} file${next.length === 1 ? '' : 's'} selected.`,
          }
        : null,
    )
  }

  const openPicker = () => inputRef.current?.click()

  const canAddMore = multiple && files.length < maxFiles
  const showFullZone = files.length === 0
  const showCompact = files.length > 0 && (canAddMore || !multiple)

  const issueMessage =
    files.length > 0
      ? validateFileSet(files, { minFiles, maxFiles, maxFileSizeMb })
      : null

  const zoneClass = (compact: boolean) =>
    [
      'block w-full rounded-xl border-2 border-dashed transition-all cursor-pointer',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea-500',
      compact ? 'px-4 py-4' : 'px-6 py-8 sm:py-10',
      compact ? 'text-left' : 'text-center',
      dragOver
        ? 'border-sea-500 bg-sea-100/60 scale-[1.01]'
        : 'border-ink-300 hover:border-sea-500/50 hover:bg-ink-100/70',
    ].join(' ')

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(true)
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length) applyIncoming(e.dataTransfer.files)
    },
  }

  const activateProps = {
    role: 'button' as const,
    tabIndex: 0,
    onClick: openPicker,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openPicker()
      }
    },
  }

  return (
    <div className="space-y-3">
      {label && (
        <span className="block text-sm font-medium text-ink-700">
          {label}
          {required && (
            <span className="text-danger ml-1" aria-hidden>
              *
            </span>
          )}
        </span>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        required={required && files.length === 0}
        className="sr-only"
        onChange={(e) => {
          const input = e.target
          let forSubmit = files
          if (input.files?.length) {
            const next = applyIncoming(input.files)
            if (next) forSubmit = next
          } else if (!isControlled) {
            setFiles([])
            forSubmit = []
          }
          // Reset so the same file can be picked again; restore FileList for FormData.
          input.value = ''
          if (name) {
            syncInputFiles(input, forSubmit)
          }
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-2" aria-label={listAriaLabel}>
          {files.map((file, index) => {
            const tooLarge = file.size > maxBytes
            const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className={`flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 text-sm shadow-sm ${
                  tooLarge ? 'border-red-300' : 'border-ink-200'
                }`}
              >
                {showIndex ? (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-700"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                ) : (
                  <FileTypeIcon accept={accept} />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate font-medium ${tooLarge ? 'text-danger' : 'text-ink-900'}`}
                  >
                    {file.name}
                  </span>
                  <span className="text-xs text-ink-500">{sizeMb} MB</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100 hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showFullZone && (
        <div
          {...activateProps}
          {...dropHandlers}
          className={zoneClass(false)}
          aria-describedby={`${inputId}-hint`}
        >
          <ZoneContent
            compact={false}
            hintId={`${inputId}-hint`}
            title={`Drag & drop or choose file${multiple ? 's' : ''}`}
            typesLabel={typesLabel}
            maxFileSizeMb={maxFileSizeMb}
            maxFiles={maxFiles}
            multiple={multiple}
          />
        </div>
      )}

      {showCompact && (
        <div {...activateProps} {...dropHandlers} className={zoneClass(true)}>
          <div className="flex items-center justify-between gap-3 pointer-events-none">
            <div>
              <p className="text-sm font-medium text-ink-900">
                {!multiple
                  ? 'Replace file'
                  : canAddMore
                    ? 'Add more files'
                    : 'Maximum files selected'}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                {typesLabel} · {maxFileSizeMb}MB
                {multiple && canAddMore
                  ? ` · ${files.length} of ${maxFiles}`
                  : ''}
              </p>
            </div>
            {canAddMore && (
              <span className="btn btn-primary text-xs py-2 px-4 shrink-0">
                Browse…
              </span>
            )}
          </div>
        </div>
      )}

      {multiple && files.length >= maxFiles && (
        <p className="text-xs text-ink-500">
          Maximum {maxFiles} files reached. Remove one to add another.
        </p>
      )}

      {flash && !issueMessage && (
        <p
          className={`text-sm ${flash.type === 'error' ? 'text-danger' : 'text-sea-600'}`}
          role={flash.type === 'error' ? 'alert' : 'status'}
        >
          {flash.text}
        </p>
      )}

      {issueMessage && (
        <p className="text-sm text-danger" role="alert">
          {issueMessage}
        </p>
      )}
    </div>
  )
}

function ZoneContent({
  compact,
  hintId,
  title,
  typesLabel,
  maxFileSizeMb,
  maxFiles,
  multiple,
}: {
  compact: boolean
  hintId: string
  title: string
  typesLabel: string
  maxFileSizeMb: number
  maxFiles: number
  multiple: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'pointer-events-none'
          : 'flex flex-col items-center gap-3 pointer-events-none'
      }
    >
      {!compact && (
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sea-100 to-primary-100 flex items-center justify-center text-sea-600 shadow-inner">
          <UploadIcon />
        </div>
      )}
      <div>
        <p className="text-ink-900 font-medium">{title}</p>
        <p id={hintId} className="text-ink-500 text-sm mt-1">
          {typesLabel} · max {maxFileSizeMb}MB
          {multiple ? ` · up to ${maxFiles} files` : ''}
        </p>
      </div>
      {!compact && (
        <span className="btn btn-primary text-xs py-2 px-4 mt-1">Browse…</span>
      )}
    </div>
  )
}

function FileTypeIcon({ accept }: { accept: string }) {
  const a = accept.toLowerCase()
  let label = 'FILE'
  let className = 'bg-ink-100 text-ink-700'
  if (a.includes('pdf')) {
    label = 'PDF'
    className = 'bg-red-50 text-red-700'
  } else if (a.includes('docx')) {
    label = 'DOC'
    className = 'bg-primary-100 text-primary-700'
  } else if (a.includes('pptx')) {
    label = 'PPT'
    className = 'bg-secondary-500/15 text-secondary-600'
  } else if (a.includes('html')) {
    label = 'HTML'
    className = 'bg-sea-100 text-sea-600'
  }

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${className}`}
      aria-hidden
    >
      {label}
    </span>
  )
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  )
}
