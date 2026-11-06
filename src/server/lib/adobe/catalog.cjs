const PDF_FIELD = {
  field: 'pdf',
  label: 'PDF file',
  accept: '.pdf,application/pdf',
  multiple: false,
  required: true,
};

const DOCX_FIELD = {
  field: 'docx',
  label: 'Word document (.docx)',
  accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  multiple: false,
  required: true,
};

const PPTX_FIELD = {
  field: 'pptx',
  label: 'PowerPoint (.pptx)',
  accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  multiple: false,
  required: true,
};

const PDFS_FIELD = {
  field: 'pdfs',
  label: 'PDF files',
  accept: '.pdf,application/pdf',
  multiple: true,
  required: true,
};

const PAGE_RANGES_FIELD = {
  name: 'pageRanges',
  label: 'Page ranges',
  type: 'text',
  placeholder: '1,3-5,7',
  help: 'Comma-separated pages or ranges (1-based).',
};

const PASSWORD_FIELD = {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Required to open the PDF',
};

function adobeTool({
  id,
  name,
  description,
  category,
  sample,
  implemented = true,
  files = [PDF_FIELD],
  fields = [],
  output: outputOverrides = {},
  note = null,
}) {
  const output = {
    contentType: 'application/pdf',
    extension: 'pdf',
    downloadName: 'output.pdf',
    zip: false,
    ...outputOverrides,
  };
  return {
    id,
    name,
    description,
    category,
    provider: 'adobe',
    sample,
    route: `/tools/${id}`,
    apiRoute: `/api/tools/${id}`,
    implemented,
    files,
    fields,
    output,
    note,
  };
}

const TOOLS = [
  {
    id: 'combine',
    name: 'Combine PDFs (local)',
    description:
      'Merge multiple PDFs into one file using pdf-lib. Runs entirely on your server — no Adobe API required.',
    category: 'Local tools',
    provider: 'local',
    sample: null,
    route: '/combine',
    apiRoute: '/api/combine',
    implemented: true,
    files: [],
    fields: [],
    output: {
      contentType: 'application/pdf',
      extension: 'pdf',
      downloadName: 'combined.pdf',
      zip: false,
    },
    note: null,
  },
  {
    id: 'split',
    name: 'Split PDF (local)',
    description:
      'Split a PDF into one file per page and download as a ZIP. Uses pdf-lib locally — no Adobe API required.',
    category: 'Local tools',
    provider: 'local',
    sample: null,
    route: '/split',
    apiRoute: '/api/split',
    implemented: true,
    files: [],
    fields: [],
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'pages.zip',
      zip: true,
    },
    note: null,
  },

  adobeTool({
    id: 'create-pdf-from-docx',
    name: 'Create PDF from DOCX',
    description: 'Convert a Word document to PDF.',
    category: 'Create PDF',
    sample: 'createpdf/create-pdf-from-docx.js',
    files: [DOCX_FIELD],
  }),
  adobeTool({
    id: 'create-pdf-from-docx-with-options',
    name: 'Create PDF from DOCX (language)',
    description: 'Convert DOCX to PDF with a document language option.',
    category: 'Create PDF',
    sample: 'createpdf/create-pdf-from-docx-with-options.js',
    files: [DOCX_FIELD],
    fields: [
      {
        name: 'documentLanguage',
        label: 'Document language',
        type: 'text',
        placeholder: 'en-US',
        defaultValue: 'en-US',
      },
    ],
  }),
  adobeTool({
    id: 'create-pdf-from-pptx',
    name: 'Create PDF from PPTX',
    description: 'Convert a PowerPoint presentation to PDF.',
    category: 'Create PDF',
    sample: 'createpdf/create-pdf-from-pptx.js',
    files: [PPTX_FIELD],
  }),

  adobeTool({
    id: 'html-with-inline-css-to-pdf',
    name: 'HTML to PDF (inline CSS)',
    description: 'Convert a local HTML file with inline CSS to PDF.',
    category: 'HTML to PDF',
    sample: 'htmltopdf/html-with-inline-css-to-pdf.js',
    implemented: false,
    files: [
      {
        field: 'html',
        label: 'HTML file',
        accept: '.html,.htm,text/html',
        multiple: false,
        required: true,
      },
    ],
    note: 'Adobe sample expects a prepared HTML file. Upload support can be added when needed.',
  }),
  adobeTool({
    id: 'html-to-pdf-from-url',
    name: 'HTML to PDF (URL)',
    description: 'Convert HTML at a public URL to PDF.',
    category: 'HTML to PDF',
    sample: 'htmltopdf/html-to-pdf-from-url.js',
    implemented: false,
    files: [],
    note: 'Requires a URL input and has SSRF considerations — not enabled in the web UI yet.',
  }),
  adobeTool({
    id: 'static-html-to-pdf',
    name: 'HTML to PDF (ZIP archive)',
    description: 'Convert a ZIP of HTML and assets to PDF.',
    category: 'HTML to PDF',
    sample: 'htmltopdf/static-html-to-pdf.js',
    implemented: false,
    files: [
      {
        field: 'archive',
        label: 'ZIP archive',
        accept: '.zip,application/zip',
        multiple: false,
        required: true,
      },
    ],
    note: 'ZIP must follow Adobe HTML-to-PDF structure. See Adobe SDK docs.',
  }),
  adobeTool({
    id: 'dynamic-html-to-pdf',
    name: 'HTML to PDF (dynamic template)',
    description: 'Merge JSON data into an HTML ZIP template and convert to PDF.',
    category: 'HTML to PDF',
    sample: 'htmltopdf/dynamic-html-to-pdf.js',
    implemented: false,
    note: 'Requires a template ZIP plus JSON data payload.',
  }),

  adobeTool({
    id: 'export-pdf-to-docx',
    name: 'Export PDF to DOCX',
    description: 'Convert a PDF file to Microsoft Word (.docx).',
    category: 'Export PDF',
    sample: 'exportpdf/export-pdf-to-docx.js',
    output: {
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      downloadName: 'export.docx',
      zip: false,
    },
  }),
  adobeTool({
    id: 'export-pdf-to-docx-with-ocr-options',
    name: 'Export PDF to DOCX (with OCR)',
    description: 'Convert PDF to DOCX and run OCR on embedded images.',
    category: 'Export PDF',
    sample: 'exportpdf/export-pdf-to-docx-with-ocr-options.js',
    output: {
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      downloadName: 'export.docx',
      zip: false,
    },
  }),
  adobeTool({
    id: 'export-pdf-to-jpeg',
    name: 'Export PDF to JPEG',
    description: 'Render PDF pages as JPEG images (one file per page).',
    category: 'Export PDF',
    sample: 'exportpdftoimages/export-pdf-to-jpeg.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'pages.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'export-pdf-to-jpeg-zip',
    name: 'Export PDF to JPEG ZIP',
    description: 'Convert each PDF page to JPEG and download as a ZIP archive.',
    category: 'Export PDF',
    sample: 'exportpdftoimages/export-pdf-to-jpeg-zip.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'images.zip',
      zip: true,
    },
  }),

  adobeTool({
    id: 'combine-pdf-with-page-ranges',
    name: 'Combine PDFs with page ranges',
    description: 'Merge specific page ranges from multiple PDFs into one file.',
    category: 'Combine PDF',
    sample: 'combinepdf/combine-pdf-with-page-ranges.js',
    implemented: true,
    files: [PDFS_FIELD],
    fields: [
      {
        name: 'pageRangesPerFile',
        label: 'Page ranges per file',
        type: 'pageRangesPerFile',
      },
    ],
    output: {
      downloadName: 'combined.pdf',
    },
  }),

  adobeTool({
    id: 'split-pdf-by-number-of-pages',
    name: 'Split PDF by page count',
    description: 'Split a PDF into parts with a maximum number of pages each.',
    category: 'Split PDF',
    sample: 'splitpdf/split-pdf-by-number-of-pages.js',
    fields: [
      {
        name: 'pageCount',
        label: 'Max pages per file',
        type: 'number',
        placeholder: '2',
        defaultValue: '2',
      },
    ],
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'split.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'split-pdf-into-number-of-files',
    name: 'Split PDF into N files',
    description: 'Split a PDF into a specific number of output files.',
    category: 'Split PDF',
    sample: 'splitpdf/split-pdf-into-number-of-files.js',
    fields: [
      {
        name: 'fileCount',
        label: 'Number of output files',
        type: 'number',
        placeholder: '2',
        defaultValue: '2',
      },
    ],
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'split.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'split-pdf-by-page-ranges',
    name: 'Split PDF by page ranges',
    description: 'Split a PDF so each page range becomes its own output file.',
    category: 'Split PDF',
    sample: 'splitpdf/split-pdf-by-page-ranges.js',
    fields: [PAGE_RANGES_FIELD],
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'split.zip',
      zip: true,
    },
    implemented: false,
    note: 'Adobe split-by-ranges uses multiple range groups — use the CLI sample for advanced cases.',
  }),

  adobeTool({
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Make a PDF searchable by applying OCR.',
    category: 'OCR',
    sample: 'ocr/ocr-pdf.js',
  }),
  adobeTool({
    id: 'ocr-pdf-with-options',
    name: 'OCR PDF (options)',
    description: 'OCR with locale and searchable-image options.',
    category: 'OCR',
    sample: 'ocr/ocr-pdf-with-options.js',
    fields: [
      {
        name: 'locale',
        label: 'OCR locale',
        type: 'text',
        placeholder: 'en-US',
        defaultValue: 'en-US',
      },
      {
        name: 'searchableImage',
        label: 'Searchable image mode',
        type: 'select',
        options: [
          { value: 'true', label: 'Keep original image (searchable image)' },
          { value: 'false', label: 'Replace with text layer' },
        ],
        defaultValue: 'true',
      },
    ],
  }),

  adobeTool({
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size.',
    category: 'Compress',
    sample: 'compresspdf/compress-pdf.js',
    output: { downloadName: 'compressed.pdf' },
  }),
  adobeTool({
    id: 'compress-pdf-with-options',
    name: 'Compress PDF (level)',
    description: 'Compress a PDF with a chosen compression level.',
    category: 'Compress',
    sample: 'compresspdf/compress-pdf-with-options.js',
    fields: [
      {
        name: 'compressionLevel',
        label: 'Compression level',
        type: 'select',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
        defaultValue: 'MEDIUM',
      },
    ],
    output: { downloadName: 'compressed.pdf' },
  }),

  adobeTool({
    id: 'linearize-pdf',
    name: 'Linearize PDF',
    description: 'Optimize a PDF for fast web viewing (linearized / web optimized).',
    category: 'Linearize',
    sample: 'linearizepdf/linearize-pdf.js',
    output: { downloadName: 'linearized.pdf' },
  }),

  adobeTool({
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Add a password required to open the PDF.',
    category: 'Protect',
    sample: 'protectpdf/protect-pdf.js',
    fields: [PASSWORD_FIELD],
    output: { downloadName: 'protected.pdf' },
  }),
  adobeTool({
    id: 'protect-pdf-with-owner-password',
    name: 'Protect PDF (owner password)',
    description: 'Set owner password and permissions (copy, edit, print).',
    category: 'Protect',
    sample: 'protectpdf/protect-pdf-with-owner-password.js',
    fields: [
      PASSWORD_FIELD,
      {
        name: 'ownerPassword',
        label: 'Owner password',
        type: 'password',
      },
    ],
    implemented: false,
    note: 'Owner-permission matrix is configured in the Adobe sample — extend the form to enable.',
  }),

  adobeTool({
    id: 'remove-protection',
    name: 'Remove PDF protection',
    description: 'Remove password protection from a secured PDF.',
    category: 'Remove protection',
    sample: 'removeprotection/remove-protection.js',
    fields: [PASSWORD_FIELD],
    output: { downloadName: 'unprotected.pdf' },
  }),

  adobeTool({
    id: 'rotate-pdf-pages',
    name: 'Rotate PDF pages',
    description: 'Rotate selected pages by 90°, 180°, or 270°.',
    category: 'Page editing',
    sample: 'rotatepages/rotate-pdf-pages.js',
    fields: [
      PAGE_RANGES_FIELD,
      {
        name: 'angle',
        label: 'Rotation',
        type: 'select',
        options: [
          { value: '90', label: '90° clockwise' },
          { value: '180', label: '180°' },
          { value: '270', label: '270° clockwise' },
        ],
        defaultValue: '90',
      },
    ],
    output: { downloadName: 'rotated.pdf' },
  }),
  adobeTool({
    id: 'delete-pdf-pages',
    name: 'Delete PDF pages',
    description: 'Remove specific pages from a PDF.',
    category: 'Page editing',
    sample: 'deletepages/delete-pdf-pages.js',
    fields: [PAGE_RANGES_FIELD],
    output: { downloadName: 'edited.pdf' },
  }),
  adobeTool({
    id: 'reorder-pdf-pages',
    name: 'Reorder PDF pages',
    description: 'Rearrange pages using a new page order (page ranges).',
    category: 'Page editing',
    sample: 'reorderpages/reorder-pdf-pages.js',
    fields: [
      {
        ...PAGE_RANGES_FIELD,
        help: 'Pages/ranges in the order they should appear in the output.',
      },
    ],
    output: { downloadName: 'reordered.pdf' },
  }),
  adobeTool({
    id: 'insert-pdf-pages',
    name: 'Insert PDF pages',
    description: 'Insert pages from other PDFs into a base document.',
    category: 'Page editing',
    sample: 'insertpages/insert-pdf-pages.js',
    implemented: false,
    note: 'Requires base PDF plus source PDFs with page mapping — use the Adobe CLI sample.',
  }),
  adobeTool({
    id: 'replace-pdf-pages',
    name: 'Replace PDF pages',
    description: 'Replace pages in a PDF with pages from other documents.',
    category: 'Page editing',
    sample: 'replacepages/replace-pdf-pages.js',
    implemented: false,
    note: 'Requires base PDF plus source PDFs with page mapping — use the Adobe CLI sample.',
  }),

  adobeTool({
    id: 'merge-document-to-docx',
    name: 'Document merge to DOCX',
    description: 'Merge a Word template with JSON data to produce DOCX.',
    category: 'Document merge',
    sample: 'documentmerge/merge-document-to-docx.js',
    implemented: false,
    note: 'Requires a Word template and JSON data file.',
  }),
  adobeTool({
    id: 'merge-document-to-pdf',
    name: 'Document merge to PDF',
    description: 'Merge a Word template with JSON data to produce PDF.',
    category: 'Document merge',
    sample: 'documentmerge/merge-document-to-pdf.js',
    implemented: false,
    note: 'Requires a Word template and JSON data file.',
  }),
  adobeTool({
    id: 'merge-document-to-docx-fragments',
    name: 'Document merge with fragments',
    description: 'Merge template, JSON data, and fragments JSON to DOCX.',
    category: 'Document merge',
    sample: 'documentmerge/merge-document-to-docx-fragments.js',
    implemented: false,
    note: 'Requires template, data JSON, and fragments JSON.',
  }),

  adobeTool({
    id: 'electronic-seal',
    name: 'Electronic seal',
    description: 'Apply an electronic seal to a PDF document.',
    category: 'Electronic seal',
    sample: 'electronicseal/electronic-seal.js',
    implemented: false,
    note: 'Requires TSP provider credentials (PROVIDER_NAME, ACCESS_TOKEN, CREDENTIAL_ID, PIN).',
  }),
  adobeTool({
    id: 'electronic-seal-with-appearance-options',
    name: 'Electronic seal (appearance)',
    description: 'Apply an electronic seal with custom appearance options.',
    category: 'Electronic seal',
    sample: 'electronicseal/electronic-seal-with-appearance-options.js',
    implemented: false,
    note: 'Requires TSP provider credentials and appearance configuration.',
  }),
  adobeTool({
    id: 'electronic-seal-with-stamp-authority',
    name: 'Electronic seal (timestamp)',
    description: 'Apply an electronic seal with a trusted timestamp authority.',
    category: 'Electronic seal',
    sample: 'electronicseal/electronic-seal-with-stamp-authority.js',
    implemented: false,
    note: 'Requires TSP provider credentials and timestamp authority setup.',
  }),

  adobeTool({
    id: 'extract-text-info-from-pdf',
    name: 'Extract text',
    description: 'Extract text elements from a PDF into structured JSON (ZIP).',
    category: 'Extract PDF',
    sample: 'extractpdf/extract-text-info-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-from-pdf',
    name: 'Extract text and tables',
    description: 'Extract text and table elements from a PDF (ZIP).',
    category: 'Extract PDF',
    sample: 'extractpdf/extract-text-table-info-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-with-tables-renditions-from-pdf',
    name: 'Extract with table renditions',
    description: 'Extract text/tables plus table image renditions (ZIP).',
    category: 'Extract PDF',
    sample:
      'extractpdf/extract-text-table-info-with-tables-renditions-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-with-figures-tables-renditions-from-pdf',
    name: 'Extract with figure renditions',
    description: 'Extract text/tables plus figure and table renditions (ZIP).',
    category: 'Extract PDF',
    sample:
      'extractpdf/extract-text-table-info-with-figures-tables-renditions-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-with-char-bounds-from-pdf',
    name: 'Extract with character bounds',
    description: 'Extract text/tables with character bounding boxes (ZIP).',
    category: 'Extract PDF',
    sample:
      'extractpdf/extract-text-table-info-with-char-bounds-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-with-tables-structure-from-pdf',
    name: 'Extract with table CSV',
    description: 'Extract text/tables with table structure as CSV (ZIP).',
    category: 'Extract PDF',
    sample:
      'extractpdf/extract-text-table-info-with-tables-structure-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'extract-text-table-info-with-styling-info-from-pdf',
    name: 'Extract with styling info',
    description: 'Extract text/tables with text styling metadata (ZIP).',
    category: 'Extract PDF',
    sample:
      'extractpdf/extract-text-table-info-with-styling-info-from-pdf.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'extract.zip',
      zip: true,
    },
  }),

  adobeTool({
    id: 'get-pdf-properties',
    name: 'PDF properties',
    description: 'Fetch metadata and page-level properties for a PDF (JSON response).',
    category: 'PDF properties',
    sample: 'pdfproperties/get-pdf-properties.js',
    output: {
      contentType: 'application/json',
      extension: 'json',
      downloadName: 'properties.json',
      zip: false,
    },
  }),

  adobeTool({
    id: 'create-pdf-with-custom-timeouts',
    name: 'Custom API timeouts',
    description: 'Demo: create PDF with custom client timeout settings.',
    category: 'Custom configuration',
    sample: 'customconfigurations/create-pdf-with-custom-timeouts.js',
    implemented: false,
    note: 'Infrastructure demo — configure timeouts in server code, not via upload.',
  }),
  adobeTool({
    id: 'create-pdf-with-proxy-server',
    name: 'Proxy server config',
    description: 'Demo: route Adobe API calls through a proxy.',
    category: 'Custom configuration',
    sample: 'customconfigurations/create-pdf-with-proxy-server.js',
    implemented: false,
    note: 'Configure proxy settings in server environment.',
  }),
  adobeTool({
    id: 'create-pdf-with-authenticated-proxy-server',
    name: 'Authenticated proxy',
    description: 'Demo: Adobe API via authenticated proxy.',
    category: 'Custom configuration',
    sample: 'customconfigurations/create-pdf-with-authenticated-proxy-server.js',
    implemented: false,
    note: 'Configure authenticated proxy in server environment.',
  }),
  adobeTool({
    id: 'export-pdf-with-specified-region',
    name: 'Regional processing',
    description: 'Demo: process documents in a specified Adobe region.',
    category: 'Custom configuration',
    sample: 'customconfigurations/export-pdf-with-specified-region.js',
    implemented: false,
    note: 'Configure region in server SDK client settings.',
  }),

  adobeTool({
    id: 'autotag-pdf',
    name: 'Autotag PDF',
    description: 'Add accessibility tags to improve PDF readability.',
    category: 'Autotag',
    sample: 'autotag/autotag-pdf.js',
    output: { downloadName: 'tagged.pdf' },
  }),
  adobeTool({
    id: 'autotag-pdf-with-options',
    name: 'Autotag PDF (report)',
    description: 'Autotag a PDF and optionally generate a tagging report ZIP.',
    category: 'Autotag',
    sample: 'autotag/autotag-pdf-with-options.js',
    fields: [
      {
        name: 'generateReport',
        label: 'Generate tagging report',
        type: 'select',
        options: [
          { value: 'false', label: 'PDF only' },
          { value: 'true', label: 'PDF + report ZIP' },
        ],
        defaultValue: 'false',
      },
    ],
    output: { downloadName: 'tagged.pdf' },
  }),
  adobeTool({
    id: 'autotag-pdf-parameterised',
    name: 'Autotag PDF (CLI)',
    description: 'Autotag via command-line arguments (Adobe sample).',
    category: 'Autotag',
    sample: 'autotag/autotag-pdf-parameterised.js',
    implemented: false,
    note: 'Use autotag-pdf or autotag-pdf-with-options in the web UI instead.',
  }),

  adobeTool({
    id: 'pdf-accessibility-checker',
    name: 'PDF accessibility checker',
    description: 'Check accessibility and return tagged PDF plus JSON report (ZIP).',
    category: 'Accessibility checker',
    sample: 'pdfaccessibilitychecker/pdf-accessibility-checker.js',
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'accessibility.zip',
      zip: true,
    },
  }),
  adobeTool({
    id: 'pdf-accessibility-checker-with-options',
    name: 'Accessibility checker (page range)',
    description: 'Check accessibility for a specific page range.',
    category: 'Accessibility checker',
    sample: 'pdfaccessibilitychecker/pdf-accessibility-checker-with-options.js',
    fields: [PAGE_RANGES_FIELD],
    output: {
      contentType: 'application/zip',
      extension: 'zip',
      downloadName: 'accessibility.zip',
      zip: true,
    },
    implemented: false,
    note: 'Page-range accessibility check uses start/end options in the Adobe sample.',
  }),

  adobeTool({
    id: 'pdf-watermark',
    name: 'PDF watermark',
    description: 'Add a watermark from a watermark PDF to your document.',
    category: 'PDF watermark',
    sample: 'pdfwatermark/pdf-watermark.js',
    files: [
      PDF_FIELD,
      {
        field: 'watermark',
        label: 'Watermark PDF',
        accept: '.pdf,application/pdf',
        multiple: false,
        required: true,
      },
    ],
    output: { downloadName: 'watermarked.pdf' },
  }),
  adobeTool({
    id: 'pdf-watermark-with-options',
    name: 'PDF watermark (options)',
    description: 'Add a watermark with opacity and foreground options.',
    category: 'PDF watermark',
    sample: 'pdfwatermark/pdf-watermark-with-options.js',
    files: [
      PDF_FIELD,
      {
        field: 'watermark',
        label: 'Watermark PDF',
        accept: '.pdf,application/pdf',
        multiple: false,
        required: true,
      },
    ],
    fields: [
      {
        name: 'opacity',
        label: 'Opacity (0–1)',
        type: 'text',
        placeholder: '0.5',
        defaultValue: '0.5',
      },
    ],
    output: { downloadName: 'watermarked.pdf' },
  }),

  adobeTool({
    id: 'external-input-create-pdf-from-docx',
    name: 'External input storage',
    description: 'Create PDF from DOCX stored at an external presigned URL.',
    category: 'External storage',
    sample: 'externalstorage/external-input-create-pdf-from-docx.js',
    implemented: false,
    note: 'Requires presigned S3 (or compatible) URLs — not a browser upload flow.',
  }),
  adobeTool({
    id: 'external-input-and-output-create-pdf-from-docx',
    name: 'External input and output',
    description: 'Create PDF from external input and write result to external storage.',
    category: 'External storage',
    sample: 'externalstorage/external-input-and-output-create-pdf-from-docx.js',
    implemented: false,
    note: 'Requires presigned input and output URLs.',
  }),
];

const TOOL_MAP = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]));

function getTool(id) {
  return TOOL_MAP[id] || null;
}

function getToolsByCategory() {
  const grouped = new Map();
  for (const tool of TOOLS) {
    if (!grouped.has(tool.category)) {
      grouped.set(tool.category, []);
    }
    grouped.get(tool.category).push(tool);
  }
  return [...grouped.entries()].map(([category, tools]) => ({ category, tools }));
}

module.exports = {
  TOOLS,
  getTool,
  getToolsByCategory,
};
