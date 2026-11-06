export function acceptHint(accept: string) {
  const parts = accept
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const exts = parts
    .filter((p) => p.startsWith('.'))
    .map((p) => p.toUpperCase())
  if (exts.length) return exts.join(', ')
  return 'matching files'
}

export function fileMatchesAccept(file: File, accept: string) {
  const parts = accept.split(',').map((p) => p.trim().toLowerCase())
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return parts.some((part) => {
    if (part.startsWith('.')) return name.endsWith(part)
    if (part.endsWith('/*')) {
      const prefix = part.slice(0, -1)
      return type.startsWith(prefix)
    }
    return type === part
  })
}

export function syncInputFiles(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer()
  for (const file of files) {
    dt.items.add(file)
  }
  input.files = dt.files
}

export function mergeIncomingFiles(
  current: File[],
  incoming: FileList | File[],
  {
    accept,
    multiple,
    maxFiles,
    maxBytes,
    maxFileSizeMb,
  }: {
    accept: string
    multiple: boolean
    maxFiles: number
    maxBytes: number
    maxFileSizeMb: number
  },
):
  | { ok: true; files: File[] }
  | { ok: false; error: string } {
  let list = Array.from(incoming).filter((f) => fileMatchesAccept(f, accept))
  if (!list.length) {
    return { ok: false, error: `Please choose ${acceptHint(accept)} only.` }
  }

  if (!multiple) {
    list = [list[0]]
  } else {
    list = [...current, ...list].slice(0, maxFiles)
  }

  const tooLarge = list.find((f) => f.size > maxBytes)
  if (tooLarge) {
    return {
      ok: false,
      error: `"${tooLarge.name}" exceeds ${maxFileSizeMb}MB.`,
    }
  }

  return { ok: true, files: list }
}

export function validateFileSet(
  files: File[],
  {
    minFiles,
    maxFiles,
    maxFileSizeMb,
  }: { minFiles: number; maxFiles: number; maxFileSizeMb: number },
) {
  const maxBytes = maxFileSizeMb * 1024 * 1024
  if (files.length < minFiles) {
    return minFiles > 1
      ? `Add at least ${minFiles} files (${files.length} selected).`
      : 'Select a file.'
  }
  if (files.length > maxFiles) {
    return `Maximum ${maxFiles} files allowed.`
  }
  if (files.some((f) => f.size > maxBytes)) {
    return `Some files exceed the ${maxFileSizeMb}MB limit.`
  }
  return null
}

export function canSubmitFiles(
  files: File[],
  limits: { minFiles: number; maxFiles: number; maxFileSizeMb: number },
) {
  return validateFileSet(files, limits) === null && files.length >= limits.minFiles
}
