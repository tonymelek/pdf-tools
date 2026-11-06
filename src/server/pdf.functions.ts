import { createServerFn } from '@tanstack/react-start'

export const getUploadLimits = createServerFn({ method: 'GET' }).handler(
  async () => (await import('#/server/pdf.server')).getUploadLimitsImpl(),
)

export const combinePdfs = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }
    return data
  })
  .handler(async ({ data }) =>
    (await import('#/server/pdf.server')).combinePdfsImpl(data),
  )

export const splitPdf = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }
    return data
  })
  .handler(async ({ data }) =>
    (await import('#/server/pdf.server')).splitPdfImpl(data),
  )
