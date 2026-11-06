const {
  MimeType,
  CreatePDFJob,
  CreatePDFParams,
  CreatePDFResult,
  DocumentLanguage,
  ExportPDFJob,
  ExportPDFParams,
  ExportPDFTargetFormat,
  ExportOCRLocale,
  ExportPDFResult,
  ExportPDFToImagesJob,
  ExportPDFToImagesParams,
  ExportPDFToImagesTargetFormat,
  ExportPDFToImagesOutputType,
  ExportPDFToImagesResult,
  SplitPDFJob,
  SplitPDFParams,
  SplitPDFResult,
  OCRJob,
  OCRParams,
  OCRSupportedLocale,
  OCRSupportedType,
  OCRResult,
  CompressPDFJob,
  CompressPDFParams,
  CompressionLevel,
  CompressPDFResult,
  LinearizePDFJob,
  LinearizePDFResult,
  ProtectPDFJob,
  ProtectPDFParams,
  EncryptionAlgorithm,
  ProtectPDFResult,
  RemoveProtectionJob,
  RemoveProtectionParams,
  RemoveProtectionResult,
  RotatePagesJob,
  RotatePagesParams,
  Angle,
  RotatePagesResult,
  DeletePagesJob,
  DeletePagesParams,
  DeletePagesResult,
  ReorderPagesJob,
  ReorderPagesParams,
  ReorderPagesResult,
  ExtractPDFJob,
  ExtractPDFParams,
  ExtractElementType,
  ExtractRenditionsElementType,
  ExtractPDFResult,
  PDFPropertiesJob,
  PDFPropertiesParams,
  PDFPropertiesResult,
  AutotagPDFJob,
  AutotagPDFParams,
  AutotagPDFResult,
  PDFAccessibilityCheckerJob,
  PDFAccessibilityCheckerResult,
  PDFWatermarkJob,
  PDFWatermarkParams,
  PDFWatermarkResult,
  WatermarkAppearance,
  CombinePDFJob,
  CombinePDFParams,
  CombinePDFResult,
} = require('@adobe/pdfservices-node-sdk');
const {
  getPDFServices,
  uploadFile,
  uploadFiles,
  getAssetBuffer,
  runJob,
} = require('./client.cjs');
const { parsePageRanges, parsePageRangesPerFile } = require('./pageRanges.cjs');
const { entriesToZipBuffer } = require('../zip.cjs');

function requireFile(files, field) {
  const file = files[field];
  if (!file) {
    throw new Error(`Missing required file: ${field}`);
  }
  return file;
}

function requireFileList(files, field) {
  const list = files[field];
  if (!Array.isArray(list) || !list.length) {
    throw new Error(`Upload at least one file for ${field}`);
  }
  return list;
}

function requirePassword(body) {
  const password = body.password?.trim();
  if (!password) {
    throw new Error('Password is required');
  }
  return password;
}

function parsePositiveInt(value, label, fallback) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive number`);
  }
  return parsed;
}

function mapDocumentLanguage(value) {
  const key = (value || 'en-US').replace('-', '_').toUpperCase();
  return DocumentLanguage[key] || DocumentLanguage.EN_US;
}

function mapOcrLocale(value) {
  const key = (value || 'en-US').replace('-', '_').toUpperCase();
  return OCRSupportedLocale[key] || OCRSupportedLocale.EN_US;
}

function mapCompressionLevel(value) {
  const level = (value || 'MEDIUM').toUpperCase();
  return CompressionLevel[level] || CompressionLevel.MEDIUM;
}

function mapAngle(value) {
  const angle = String(value || '90');
  if (angle === '180') return Angle._180;
  if (angle === '270') return Angle._270;
  return Angle._90;
}

async function runPdfOperation(ctx, build) {
  const pdfServices = getPDFServices();
  const inputAsset = await uploadFile(
    pdfServices,
    requireFile(ctx.files, 'pdf').path,
    MimeType.PDF
  );
  const { job, resultType } = build(inputAsset);
  const response = await runJob(pdfServices, job, resultType);
  return { pdfServices, response };
}

async function assetResult(ctx, build, { resultKey = 'asset' } = {}) {
  const { pdfServices, response } = await runPdfOperation(ctx, build);
  const buffer = await getAssetBuffer(pdfServices, response.result[resultKey]);
  return { buffer };
}

async function zipAssets(pdfServices, assets, nameFn) {
  const entries = [];
  for (let index = 0; index < assets.length; index += 1) {
    entries.push({
      name: nameFn(index),
      buffer: await getAssetBuffer(pdfServices, assets[index]),
    });
  }
  return { buffer: await entriesToZipBuffer(entries) };
}

async function extractPdf(ctx, paramsBuilder) {
  const pdfServices = getPDFServices();
  const inputAsset = await uploadFile(
    pdfServices,
    requireFile(ctx.files, 'pdf').path,
    MimeType.PDF
  );
  const params = paramsBuilder();
  const job = new ExtractPDFJob({ inputAsset, params });
  const response = await runJob(pdfServices, job, ExtractPDFResult);
  const buffer = await getAssetBuffer(pdfServices, response.result.resource);
  return { buffer };
}

const OPERATIONS = {
  'create-pdf-from-docx': async (ctx) => {
    const pdfServices = getPDFServices();
    const inputAsset = await uploadFile(
      pdfServices,
      requireFile(ctx.files, 'docx').path,
      MimeType.DOCX
    );
    const job = new CreatePDFJob({ inputAsset });
    const response = await runJob(pdfServices, job, CreatePDFResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'create-pdf-from-docx-with-options': async (ctx) => {
    const pdfServices = getPDFServices();
    const inputAsset = await uploadFile(
      pdfServices,
      requireFile(ctx.files, 'docx').path,
      MimeType.DOCX
    );
    const params = new CreatePDFParams({
      documentLanguage: mapDocumentLanguage(ctx.body.documentLanguage),
    });
    const job = new CreatePDFJob({ inputAsset, params });
    const response = await runJob(pdfServices, job, CreatePDFResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'create-pdf-from-pptx': async (ctx) => {
    const pdfServices = getPDFServices();
    const inputAsset = await uploadFile(
      pdfServices,
      requireFile(ctx.files, 'pptx').path,
      MimeType.PPTX
    );
    const job = new CreatePDFJob({ inputAsset });
    const response = await runJob(pdfServices, job, CreatePDFResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'export-pdf-to-docx': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new ExportPDFJob({
        inputAsset,
        params: new ExportPDFParams({
          targetFormat: ExportPDFTargetFormat.DOCX,
        }),
      }),
      resultType: ExportPDFResult,
    })),

  'export-pdf-to-docx-with-ocr-options': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new ExportPDFJob({
        inputAsset,
        params: new ExportPDFParams({
          targetFormat: ExportPDFTargetFormat.DOCX,
          ocrLocale: ExportOCRLocale.EN_US,
        }),
      }),
      resultType: ExportPDFResult,
    })),

  'export-pdf-to-jpeg': async (ctx) => {
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new ExportPDFToImagesJob({
        inputAsset,
        params: new ExportPDFToImagesParams({
          targetFormat: ExportPDFToImagesTargetFormat.JPEG,
          outputType: ExportPDFToImagesOutputType.LIST_OF_PAGE_IMAGES,
        }),
      }),
      resultType: ExportPDFToImagesResult,
    }));
    return zipAssets(pdfServices, response.result.assets, (i) => `page_${i + 1}.jpeg`);
  },

  'export-pdf-to-jpeg-zip': async (ctx) => {
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new ExportPDFToImagesJob({
        inputAsset,
        params: new ExportPDFToImagesParams({
          targetFormat: ExportPDFToImagesTargetFormat.JPEG,
          outputType: ExportPDFToImagesOutputType.ZIP_OF_PAGE_IMAGES,
        }),
      }),
      resultType: ExportPDFToImagesResult,
    }));
    const buffer = await getAssetBuffer(pdfServices, response.result.assets[0]);
    return { buffer };
  },

  'combine-pdf-with-page-ranges': async (ctx) => {
    const pdfServices = getPDFServices();
    const pdfFiles = requireFileList(ctx.files, 'pdfs');
    if (pdfFiles.length < 2) {
      throw new Error('Upload at least 2 PDF files to combine.');
    }

    const assets = await uploadFiles(
      pdfServices,
      pdfFiles.map((file) => ({ path: file.path, mimeType: MimeType.PDF }))
    );

    const pageRangesList = parsePageRangesPerFile(
      ctx.body.pageRangesPerFile,
      pdfFiles.length
    );

    let params = new CombinePDFParams();
    for (let index = 0; index < assets.length; index += 1) {
      const pageRanges = pageRangesList[index];
      params = pageRanges
        ? params.addAsset(assets[index], pageRanges)
        : params.addAsset(assets[index]);
    }

    const job = new CombinePDFJob({ params });
    const response = await runJob(pdfServices, job, CombinePDFResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'split-pdf-by-number-of-pages': async (ctx) => {
    const pageCount = parsePositiveInt(ctx.body.pageCount, 'Max pages per file', 2);
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new SplitPDFJob({
        inputAsset,
        params: new SplitPDFParams({ pageCount }),
      }),
      resultType: SplitPDFResult,
    }));
    return zipAssets(pdfServices, response.result.assets, (i) => `part_${i + 1}.pdf`);
  },

  'split-pdf-into-number-of-files': async (ctx) => {
    const fileCount = parsePositiveInt(ctx.body.fileCount, 'Number of output files', 2);
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new SplitPDFJob({
        inputAsset,
        params: new SplitPDFParams({ fileCount }),
      }),
      resultType: SplitPDFResult,
    }));
    return zipAssets(pdfServices, response.result.assets, (i) => `part_${i + 1}.pdf`);
  },

  'ocr-pdf': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new OCRJob({ inputAsset }),
      resultType: OCRResult,
    })),

  'ocr-pdf-with-options': (ctx) =>
    assetResult(ctx, (inputAsset) => {
      const searchableImage = ctx.body.searchableImage !== 'false';
      return {
        job: new OCRJob({
          inputAsset,
          params: new OCRParams({
            ocrLocale: mapOcrLocale(ctx.body.locale),
            ocrType: searchableImage
              ? OCRSupportedType.SEARCHABLE_IMAGE_EXACT
              : OCRSupportedType.SEARCHABLE_IMAGE,
          }),
        }),
        resultType: OCRResult,
      };
    }),

  'compress-pdf': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new CompressPDFJob({ inputAsset }),
      resultType: CompressPDFResult,
    })),

  'compress-pdf-with-options': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new CompressPDFJob({
        inputAsset,
        params: new CompressPDFParams({
          compressionLevel: mapCompressionLevel(ctx.body.compressionLevel),
        }),
      }),
      resultType: CompressPDFResult,
    })),

  'linearize-pdf': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new LinearizePDFJob({ inputAsset }),
      resultType: LinearizePDFResult,
    })),

  'protect-pdf': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new ProtectPDFJob({
        inputAsset,
        params: new ProtectPDFParams({
          userPassword: requirePassword(ctx.body),
          encryptionAlgorithm: EncryptionAlgorithm.AES_256,
        }),
      }),
      resultType: ProtectPDFResult,
    })),

  'remove-protection': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new RemoveProtectionJob({
        inputAsset,
        params: new RemoveProtectionParams({
          password: requirePassword(ctx.body),
        }),
      }),
      resultType: RemoveProtectionResult,
    })),

  'rotate-pdf-pages': (ctx) =>
    assetResult(ctx, (inputAsset) => {
      const pageRanges = parsePageRanges(ctx.body.pageRanges);
      return {
        job: new RotatePagesJob({
          inputAsset,
          params: new RotatePagesParams().setAngleToRotatePagesBy(
            mapAngle(ctx.body.angle),
            pageRanges
          ),
        }),
        resultType: RotatePagesResult,
      };
    }),

  'delete-pdf-pages': (ctx) =>
    assetResult(ctx, (inputAsset) => ({
      job: new DeletePagesJob({
        inputAsset,
        params: new DeletePagesParams({
          pageRanges: parsePageRanges(ctx.body.pageRanges),
        }),
      }),
      resultType: DeletePagesResult,
    })),

  'reorder-pdf-pages': async (ctx) => {
    const pdfServices = getPDFServices();
    const inputAsset = await uploadFile(
      pdfServices,
      requireFile(ctx.files, 'pdf').path,
      MimeType.PDF
    );
    const params = new ReorderPagesParams({
      asset: inputAsset,
      pageRanges: parsePageRanges(ctx.body.pageRanges),
    });
    const job = new ReorderPagesJob({ params });
    const response = await runJob(pdfServices, job, ReorderPagesResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'extract-text-info-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({ elementsToExtract: [ExtractElementType.TEXT] })
    ),

  'extract-text-table-info-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
      })
    ),

  'extract-text-table-info-with-tables-renditions-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        elementsToExtractRenditions: [ExtractRenditionsElementType.TABLES],
      })
    ),

  'extract-text-table-info-with-figures-tables-renditions-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        elementsToExtractRenditions: [
          ExtractRenditionsElementType.TABLES,
          ExtractRenditionsElementType.FIGURES,
        ],
      })
    ),

  'extract-text-table-info-with-char-bounds-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        getCharBounds: true,
      })
    ),

  'extract-text-table-info-with-tables-structure-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        elementsToExtractRenditions: [ExtractRenditionsElementType.TABLES],
        tableStructureFormat: 'csv',
      })
    ),

  'extract-text-table-info-with-styling-info-from-pdf': (ctx) =>
    extractPdf(ctx, () =>
      new ExtractPDFParams({
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        includeStyling: true,
      })
    ),

  'get-pdf-properties': async (ctx) => {
    const { response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new PDFPropertiesJob({
        inputAsset,
        params: new PDFPropertiesParams({ includePageLevelProperties: true }),
      }),
      resultType: PDFPropertiesResult,
    }));
    return { json: response.result.pdfProperties };
  },

  'autotag-pdf': async (ctx) => {
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new AutotagPDFJob({ inputAsset }),
      resultType: AutotagPDFResult,
    }));
    const buffer = await getAssetBuffer(pdfServices, response.result.taggedPDF);
    return { buffer };
  },

  'autotag-pdf-with-options': async (ctx) => {
    const generateReport = ctx.body.generateReport === 'true';
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new AutotagPDFJob({
        inputAsset,
        params: new AutotagPDFParams({ generateReport }),
      }),
      resultType: AutotagPDFResult,
    }));
    const pdfBuffer = await getAssetBuffer(pdfServices, response.result.taggedPDF);
    if (!generateReport) {
      return { buffer: pdfBuffer };
    }
    const reportBuffer = await getAssetBuffer(pdfServices, response.result.report);
    return {
      buffer: await entriesToZipBuffer([
        { name: 'tagged.pdf', buffer: pdfBuffer },
        { name: 'report.xlsx', buffer: reportBuffer },
      ]),
    };
  },

  'pdf-accessibility-checker': async (ctx) => {
    const { pdfServices, response } = await runPdfOperation(ctx, (inputAsset) => ({
      job: new PDFAccessibilityCheckerJob({ inputAsset }),
      resultType: PDFAccessibilityCheckerResult,
    }));
    const pdfBuffer = await getAssetBuffer(pdfServices, response.result.asset);
    const reportBuffer = await getAssetBuffer(pdfServices, response.result.report);
    return {
      buffer: await entriesToZipBuffer([
        { name: 'tagged.pdf', buffer: pdfBuffer },
        { name: 'report.json', buffer: reportBuffer },
      ]),
    };
  },

  'pdf-watermark': async (ctx) => {
    const pdfServices = getPDFServices();
    const [inputAsset, watermarkAsset] = await uploadFiles(pdfServices, [
      { path: requireFile(ctx.files, 'pdf').path, mimeType: MimeType.PDF },
      { path: requireFile(ctx.files, 'watermark').path, mimeType: MimeType.PDF },
    ]);
    const job = new PDFWatermarkJob({ inputAsset, watermarkAsset });
    const response = await runJob(pdfServices, job, PDFWatermarkResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },

  'pdf-watermark-with-options': async (ctx) => {
    const pdfServices = getPDFServices();
    const [inputAsset, watermarkAsset] = await uploadFiles(pdfServices, [
      { path: requireFile(ctx.files, 'pdf').path, mimeType: MimeType.PDF },
      { path: requireFile(ctx.files, 'watermark').path, mimeType: MimeType.PDF },
    ]);
    const opacityInput = Number.parseFloat(ctx.body.opacity ?? '0.5');
    const opacity = Number.isFinite(opacityInput)
      ? Math.min(100, Math.max(0, Math.round(opacityInput * 100)))
      : 50;
    const params = new PDFWatermarkParams({
      watermarkAppearance: new WatermarkAppearance({
        appearOnForeground: false,
        opacity,
      }),
    });
    const job = new PDFWatermarkJob({ inputAsset, watermarkAsset, params });
    const response = await runJob(pdfServices, job, PDFWatermarkResult);
    const buffer = await getAssetBuffer(pdfServices, response.result.asset);
    return { buffer };
  },
};

function runOperation(toolId, ctx) {
  const handler = OPERATIONS[toolId];
  if (!handler) {
    throw new Error('This tool is not available in the web app yet');
  }
  return handler(ctx);
}

module.exports = { runOperation, OPERATIONS };
