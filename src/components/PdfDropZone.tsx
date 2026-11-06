import { FilePicker } from '#/components/FilePicker'
import { canSubmitFiles } from '#/lib/file-picker'

type PdfDropZoneProps = {
  multiple?: boolean
  maxFiles: number
  maxFileSizeMb: number
  minFiles?: number
  onFilesChange: (files: File[]) => void
  files: File[]
}

/** PDF combine/split — controlled wrapper around {@link FilePicker}. */
export function PdfDropZone({
  multiple = false,
  maxFiles,
  maxFileSizeMb,
  minFiles = 1,
  onFilesChange,
  files,
}: PdfDropZoneProps) {
  return (
    <FilePicker
      accept=".pdf,application/pdf"
      multiple={multiple}
      maxFiles={maxFiles}
      minFiles={minFiles}
      maxFileSizeMb={maxFileSizeMb}
      files={files}
      onFilesChange={onFilesChange}
      showIndex={multiple}
      listAriaLabel="Selected PDF files"
    />
  )
}

export function canSubmitPdfFiles(
  files: File[],
  limits: { minFiles: number; maxFiles: number; maxFileSizeMb: number },
) {
  return canSubmitFiles(files, limits)
}
