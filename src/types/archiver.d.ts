declare module 'archiver' {
  import type { Readable, Writable } from 'node:stream'

  export class ZipArchive {
    constructor(options?: { zlib?: { level?: number } })
    pipe(destination: Writable): void
    append(
      source: Buffer | Readable | string,
      data: { name?: string },
    ): this
    finalize(): Promise<void>
    on(event: 'error', listener: (err: Error) => void): this
  }
}
