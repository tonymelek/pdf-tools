import { Link } from '@tanstack/react-router'
import type { CatalogTool } from '#/lib/catalog-ui'

export function ToolCatalogCard({
  tool,
  compact = false,
}: {
  tool: CatalogTool
  compact?: boolean
}) {
  const className =
    'group flex flex-col h-full rounded-xl border border-ink-200 bg-surface p-4 no-underline text-inherit transition-all hover:border-sea-500/40 hover:shadow-md'

  const body = (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-ink-900 group-hover:text-sea-600 transition-colors leading-snug">
          {tool.name}
        </h3>
        <ToolBadges tool={tool} />
      </div>
      <p
        className={`text-ink-500 leading-relaxed flex-1 ${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}
      >
        {tool.description}
      </p>
      {!compact && tool.note && (
        <p className="mt-2 text-xs text-amber-700 line-clamp-2">{tool.note}</p>
      )}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sea-500 group-hover:text-sea-600">
        {tool.implemented ? 'Open tool' : 'Details'}
        <span aria-hidden>→</span>
      </span>
    </>
  )

  if (tool.provider === 'local') {
    return (
      <Link to={tool.route} className={className}>
        {body}
      </Link>
    )
  }

  return (
    <Link to="/tools/$id" params={{ id: tool.id }} className={className}>
      {body}
    </Link>
  )
}

function ToolBadges({ tool }: { tool: CatalogTool }) {
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {tool.provider === 'local' ? (
        <span className="rounded-md bg-success-bg text-success px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          Local
        </span>
      ) : (
        <span className="rounded-md bg-sea-100 text-sea-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          Adobe
        </span>
      )}
      {!tool.implemented && (
        <span className="rounded-md bg-ink-100 text-ink-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          Preview
        </span>
      )}
    </div>
  )
}
