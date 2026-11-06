import { Link } from '@tanstack/react-router'

type NavKey = 'home' | 'combine' | 'split' | 'library'

function navClass(active: boolean) {
  return active ? 'nav-link nav-link-active' : 'nav-link'
}

export function AppShell({
  active,
  children,
  width = 'default',
}: {
  active: NavKey
  children: React.ReactNode
  width?: 'default' | 'wide'
}) {
  const mainMax =
    width === 'wide' ? 'max-w-5xl' : 'max-w-3xl'

  return (
    <div className="min-h-full flex flex-col">
      <header className="site-header">
        <nav
          className={`${mainMax} mx-auto px-4 py-4 flex items-center justify-between gap-4`}
        >
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            <img
              src="/favicon.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg shrink-0"
            />
            <span className="min-w-0">
              <span className="block font-display font-semibold text-ink-900 leading-tight truncate">
                PDF Tools
              </span>
              <span className="block text-xs text-ink-500 font-sans">Meltek</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Link to="/combine" className={navClass(active === 'combine')}>
              Combine
            </Link>
            <Link to="/split" className={navClass(active === 'split')}>
              Split
            </Link>
            <Link to="/library" className={navClass(active === 'library')}>
              Library
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className={`${mainMax} mx-auto px-4 py-10`}>{children}</div>
      </main>

      <footer className="border-t border-ink-200 py-6 px-4 text-center text-sm text-ink-500">
        <p>
          Files are processed in temp storage and deleted after download.
        </p>
        <p className="mt-2">
          <a
            href="https://meltek.com.au/"
            className="font-medium text-sea-500 hover:text-sea-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meltek
          </a>
          <span className="text-ink-300 mx-2">·</span>
          Melbourne software engineering
        </p>
      </footer>
    </div>
  )
}
