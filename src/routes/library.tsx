import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/AppShell'
import { ToolLibraryPage } from '#/components/catalog/ToolLibraryPage'
import { getToolCatalog } from '#/server/adobe.functions'

export const Route = createFileRoute('/library')({
  loader: () => getToolCatalog(),
  component: LibraryPage,
})

function LibraryPage() {
  const { categories, adobeConfigured } = Route.useLoaderData()

  return (
    <AppShell active="library" width="wide">
      <ToolLibraryPage
        categories={categories}
        adobeConfigured={adobeConfigured}
      />
    </AppShell>
  )
}
