import { Link, createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/AppShell'
import {
  CAPABILITY_PILLARS,
  catalogStats,
  categorySlug,
  pillarToolCount,
} from '#/lib/catalog-ui'
import { getToolCatalog } from '#/server/adobe.functions'

export const Route = createFileRoute('/')({
  loader: () => getToolCatalog(),
  component: HomePage,
})

function HomePage() {
  const { categories, adobeConfigured } = Route.useLoaderData()
  const stats = catalogStats(categories)

  return (
    <AppShell active="home" width="wide">
      <section className="hero-mesh rounded-2xl px-6 py-10 sm:px-10 sm:py-14 text-white mb-10 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">
          Meltek · self-hosted PDF platform
        </p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight max-w-3xl text-white">
          A full PDF toolkit—not just merge and split
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed">
          <strong className="font-semibold text-white">{stats.total} tools</strong>{' '}
          across {stats.categories} categories: local processing on your server,
          plus Adobe PDF Services for conversion, OCR, accessibility, security,
          and enterprise workflows.
        </p>

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
          <HeroStat value={String(stats.total)} label="Operations" />
          <HeroStat value={String(stats.adobe)} label="Adobe-powered" />
          <HeroStat value={String(stats.runnable)} label="Ready to run" />
          <HeroStat value={String(stats.local)} label="Fully local" />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/library"
            className="btn bg-white text-ink-900 hover:bg-ink-100 focus-visible:outline-white"
          >
            Open tool library
          </Link>
          <Link to="/combine" className="btn btn-outline-on-dark border-white/30">
            Combine PDFs
          </Link>
          <Link to="/split" className="btn btn-outline-on-dark border-white/30">
            Split PDF
          </Link>
        </div>
      </section>

      {!adobeConfigured && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          Add{' '}
          <code className="text-amber-900">PDF_SERVICES_CLIENT_ID</code> and{' '}
          <code className="text-amber-900">PDF_SERVICES_CLIENT_SECRET</code> to
          unlock the full Adobe catalog ({stats.runnable}+ runnable tools).
        </div>
      )}

      <section className="mb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Start locally</h2>
            <p className="text-sm text-ink-500 mt-1">
              No API keys—runs on your machine with pdf-lib.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <LocalToolCard
            to="/combine"
            title="Combine PDFs"
            description="Merge multiple files in upload order. Choose the output filename and download one PDF."
            accent="primary"
          />
          <LocalToolCard
            to="/split"
            title="Split PDF"
            description="Every page becomes its own file, packaged in a ZIP with your chosen folder name."
            accent="sea"
          />
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">What you can do</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-2xl">
            Grouped by capability—each links into the library with dozens of
            Adobe SDK–aligned operations behind it.
          </p>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
          {CAPABILITY_PILLARS.map((pillar) => {
            const count = pillarToolCount(pillar, categories)
            const hash = categorySlug(pillar.categories[0])
            return (
              <li key={pillar.title}>
                <Link
                  to="/library"
                  hash={hash}
                  className="group flex flex-col h-full card card-hover no-underline text-inherit p-5"
                >
                  <h3 className="font-semibold text-ink-900 group-hover:text-sea-600 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-ink-500 mt-2 flex-1 leading-relaxed">
                    {pillar.description}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-sea-500">
                    {count > 0
                      ? `${count} tools in library →`
                      : 'Browse library →'}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card bg-ink-100/60 border-ink-200">
        <div className="grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-semibold text-ink-900 mb-1">Privacy first</p>
            <p className="text-ink-500 leading-relaxed">
              Temp storage only; files are removed after download. Local tools
              never leave your server.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink-900 mb-1">Production stack</p>
            <p className="text-ink-500 leading-relaxed">
              TanStack Start, SSR, and server functions—same patterns as modern
              Meltek product apps.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink-900 mb-1">SDK fidelity</p>
            <p className="text-ink-500 leading-relaxed">
              Adobe tools map to official PDF Services Node samples—export,
              autotag, seal, extract, and more.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
      <dd className="text-2xl font-display font-bold text-white">{value}</dd>
      <dt className="text-xs text-white/70 mt-0.5">{label}</dt>
    </div>
  )
}

function LocalToolCard({
  to,
  title,
  description,
  accent,
}: {
  to: '/combine' | '/split'
  title: string
  description: string
  accent: 'primary' | 'sea'
}) {
  const iconClass =
    accent === 'primary'
      ? 'bg-primary-100 text-primary-700 group-hover:bg-primary-700 group-hover:text-white'
      : 'bg-sea-100 text-sea-500 group-hover:bg-sea-500 group-hover:text-white'

  return (
    <Link
      to={to}
      className="group card card-hover block no-underline text-inherit"
    >
      <div className={`tool-card-icon ${iconClass}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          {to === '/combine' ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"
            />
          )}
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{description}</p>
      <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-sea-500 group-hover:text-sea-600">
        Open tool →
      </span>
    </Link>
  )
}
