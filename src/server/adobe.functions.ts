import { createServerFn } from '@tanstack/react-start'

export const getToolCatalog = createServerFn({ method: 'GET' }).handler(
  async () => (await import('#/server/adobe.server')).getToolCatalogImpl(),
)

export const getToolDetails = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) =>
    (await import('#/server/adobe.server')).getToolDetailsImpl(data.id),
  )

export const runAdobeTool = createServerFn({ method: 'POST' })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }
    const toolId = data.get('toolId')?.toString()
    if (!toolId) {
      throw new Error('Missing toolId')
    }
    return { formData: data, toolId }
  })
  .handler(async ({ data: { formData, toolId } }) =>
    (await import('#/server/adobe.server')).runAdobeToolImpl(formData, toolId),
  )
