import { Link, createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { AppShell } from '#/components/AppShell'
import { CombinePdfPageRangesToolForm } from '#/components/CombinePdfPageRangesToolForm'
import {
  AdobeCredentialsBanner,
  ToolForm,
} from '#/components/ToolForm'
import { getToolDetails } from '#/server/adobe.functions'

export const Route = createFileRoute('/tools/$id')({
  loader: async ({ params }) => {
    const data = await getToolDetails({ data: { id: params.id } })
    if (!data) {
      throw notFound()
    }
    if (data.tool.provider === 'local') {
      throw redirect({ to: data.tool.route })
    }
    return data
  },
  component: ToolPage,
})

function ToolPage() {
  const { tool, adobeConfigured, canRun, maxFileSizeMb, maxFiles } =
    Route.useLoaderData()

  return (
    <AppShell active="library">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-ink-500 mb-3">
          <Link to="/library" className="hover:text-sea-600 transition-colors">
            Tool library
          </Link>
          <span>/</span>
          <span>{tool.category}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{tool.name}</h1>
        <p className="text-ink-500">{tool.description}</p>
        {tool.sample && (
          <p className="mt-2 text-xs text-ink-500">
            Based on Adobe sample{' '}
            <span className="text-ink-700">{tool.sample}</span>
          </p>
        )}
      </div>

      {!adobeConfigured && <AdobeCredentialsBanner />}

      {!tool.implemented ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Not available in the web UI yet</h2>
          <p className="text-ink-500 text-sm leading-relaxed">
            {tool.note ||
              'This Adobe sample needs extra setup beyond a simple upload form.'}
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-sea-500 hover:text-sea-600"
          >
            ← Back to library
          </Link>
        </div>
      ) : tool.id === 'combine-pdf-with-page-ranges' ? (
        <CombinePdfPageRangesToolForm
          tool={tool}
          canRun={canRun}
          maxFileSizeMb={maxFileSizeMb}
          maxFiles={maxFiles}
        />
      ) : (
        <ToolForm
          tool={tool}
          canRun={canRun}
          maxFileSizeMb={maxFileSizeMb}
        />
      )}
    </AppShell>
  )
}
