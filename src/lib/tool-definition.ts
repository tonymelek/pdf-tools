export type ToolField = {
  name: string
  label: string
  type?: string
  placeholder?: string
  defaultValue?: string
  help?: string
  options?: { value: string; label: string }[]
}

export type ToolFile = {
  field: string
  label: string
  accept: string
  multiple?: boolean
  required?: boolean
}

export type ToolDefinition = {
  id: string
  name: string
  description: string
  category: string
  sample?: string | null
  implemented: boolean
  files: ToolFile[]
  fields: ToolField[]
  output: {
    downloadName: string
    contentType?: string
    zip?: boolean
  }
  note?: string | null
}

/** Catalog entry from `catalog.cjs` (tool definition + routing metadata). */
export type CatalogTool = ToolDefinition & {
  provider: string
  route: string
  apiRoute: string
}
