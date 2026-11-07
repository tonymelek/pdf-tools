/** Packages with `.node` binaries — must stay external to Rolldown/Nitro. */
export function isNativeServerDep(id: string): boolean {
  return (
    id === 'sharp' ||
    id.startsWith('sharp/') ||
    id === 'pdfjs-dist' ||
    id.startsWith('pdfjs-dist/') ||
    id === '@napi-rs/canvas' ||
    id.startsWith('@napi-rs/canvas')
  )
}

/** Vite `ssr.external` accepts package names only (no RegExp). */
export const nativeServerDepExternals = [
  '@napi-rs/canvas',
  'sharp',
  'pdfjs-dist',
] as const
