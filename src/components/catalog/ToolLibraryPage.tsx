import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { AdobeCredentialsBanner } from '#/components/ToolForm'
import {
  catalogStats,
  categorySlug,
  filterCatalog,
  type CatalogCategory,
} from '#/lib/catalog-ui'
import { ToolCatalogCard } from '#/components/catalog/ToolCatalogCard'

export function ToolLibraryPage({
  categories,
  adobeConfigured,
}: {
  categories: CatalogCategory[]
  adobeConfigured: boolean
}) {
  const [query, setQuery] = useState('')
  const stats = catalogStats(categories)
  const filtered = useMemo(
    () => filterCatalog(categories, query),
    [categories, query],
  )

  return (
    <>
      <section className="rounded-2xl border border-ink-200 bg-surface p-6 sm:p-8 mb-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-sea-500 mb-2">
          Tool library
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-3">
          {stats.total} PDF operations in one place
        </h1>
        <p className="text-ink-500 max-w-2xl leading-relaxed">
          Local merge and split run entirely on your server.{' '}
          <strong className="font-medium text-ink-700">
            {stats.runnable} Adobe-powered tools
          </strong>{' '}
          mirror the official PDF Services SDK samples—convert, export, OCR,
          protect, autotag, and more.
        </p>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total tools" value={String(stats.total)} />
          <Stat label="Categories" value={String(stats.categories)} />
          <Stat label="Adobe API" value={String(stats.adobe)} />
          <Stat label="Local" value={String(stats.local)} />
        </dl>

        <div className="mt-6">
          <label htmlFor="tool-search" className="sr-only">
            Search tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category, or capability…"
            className="input-field max-w-xl"
          />
        </div>
      </section>

      {!adobeConfigured && <AdobeCredentialsBanner />}

      <nav
        className="mb-8 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        aria-label="Jump to category"
      >
        {categories.map(({ category }) => (
          <a
            key={category}
            href={`#${categorySlug(category)}`}
            className="shrink-0 rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-sea-500/40 hover:text-sea-600 transition-colors"
          >
            {category}
          </a>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="text-ink-500 text-center py-12">
          No tools match &ldquo;{query}&rdquo;.{' '}
          <button
            type="button"
            className="text-sea-500 font-medium hover:text-sea-600"
            onClick={() => setQuery('')}
          >
            Clear search
          </button>
        </p>
      ) : (
        <div className="space-y-12">
          {filtered.map(({ category, tools }) => (
            <section
              key={category}
              id={categorySlug(category)}
              className="scroll-mt-24"
            >
              <div className="flex items-end justify-between gap-4 mb-4 border-b border-ink-200 pb-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">
                    {category}
                  </h2>
                  <p className="text-sm text-ink-500 mt-0.5">
                    {tools.length} tool{tools.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Link
                  to="/"
                  className="hidden sm:inline text-xs text-ink-500 hover:text-sea-600"
                >
                  ↑ Home
                </Link>
              </div>
              <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
                {tools.map((tool) => (
                  <li key={tool.id}>
                    <ToolCatalogCard tool={tool} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 card bg-ink-100/60 text-sm text-ink-500">
        <p>
          <span className="text-ink-700 font-medium">Privacy:</span> Local
          tools keep files on your server only. Adobe tools transmit files to
          Adobe PDF Services for processing; temp uploads are deleted after
          download.
        </p>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-100/80 px-4 py-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-2xl font-display font-semibold text-ink-900 mt-0.5">
        {value}
      </dd>
    </div>
  )
}
