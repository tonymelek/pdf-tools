export type CatalogTool = {
  id: string
  name: string
  description: string
  provider: string
  route: string
  category: string
  sample?: string | null
  implemented: boolean
  note?: string | null
}

export type CatalogCategory = {
  category: string
  tools: CatalogTool[]
}

export function categorySlug(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function catalogStats(categories: CatalogCategory[]) {
  const tools = categories.flatMap((c) => c.tools)
  return {
    total: tools.length,
    categories: categories.length,
    adobe: tools.filter((t) => t.provider === 'adobe').length,
    local: tools.filter((t) => t.provider === 'local').length,
    runnable: tools.filter((t) => t.implemented && t.provider === 'adobe').length,
  }
}

/** Marketing groupings for the home page — maps to real catalog categories. */
export const CAPABILITY_PILLARS = [
  {
    title: 'Create & convert',
    description:
      'Word, PowerPoint, and HTML into print-ready PDFs with Adobe Document Services.',
    categories: ['Create PDF', 'HTML to PDF'],
  },
  {
    title: 'Export & extract',
    description:
      'DOCX, images, structured JSON, tables, and renditions from existing PDFs.',
    categories: ['Export PDF', 'Extract PDF', 'OCR'],
  },
  {
    title: 'Merge, split & pages',
    description:
      'Combine files, split by ranges, reorder, rotate, delete, and merge documents.',
    categories: [
      'Local tools',
      'Combine PDF',
      'Split PDF',
      'Page editing',
      'Document merge',
    ],
  },
  {
    title: 'Secure & optimize',
    description:
      'Password protection, compression, linearization, and permission removal.',
    categories: [
      'Protect',
      'Remove protection',
      'Compress',
      'Linearize',
    ],
  },
  {
    title: 'Accessibility & compliance',
    description:
      'Autotag, accessibility checks, electronic seal workflows, and PDF properties.',
    categories: [
      'Autotag',
      'Accessibility checker',
      'Electronic seal',
      'PDF properties',
    ],
  },
  {
    title: 'Advanced & custom',
    description:
      'Watermarks, custom configurations, and external-storage SDK samples.',
    categories: [
      'Custom configuration',
      'PDF watermark',
      'External storage',
    ],
  },
] as const

export function pillarToolCount(
  pillar: { categories: readonly string[] },
  categories: CatalogCategory[],
) {
  const names = new Set<string>(pillar.categories)
  return categories
    .filter((c) => names.has(c.category))
    .reduce((n, c) => n + c.tools.length, 0)
}

export function filterCatalog(
  categories: CatalogCategory[],
  query: string,
): CatalogCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return categories

  return categories
    .map(({ category, tools }) => ({
      category,
      tools: tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          category.toLowerCase().includes(q),
      ),
    }))
    .filter((c) => c.tools.length > 0)
}
