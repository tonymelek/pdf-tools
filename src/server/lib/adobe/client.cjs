const fs = require('fs');
const {
  ServicePrincipalCredentials,
  PDFServices,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
} = require('@adobe/pdfservices-node-sdk');

function isAdobeConfigured() {
  return !!(
    process.env.PDF_SERVICES_CLIENT_ID && process.env.PDF_SERVICES_CLIENT_SECRET
  );
}

function getCredentials() {
  const clientId = process.env.PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.PDF_SERVICES_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Adobe PDF Services credentials not configured. Set PDF_SERVICES_CLIENT_ID and PDF_SERVICES_CLIENT_SECRET in .env'
    );
  }
  return new ServicePrincipalCredentials({ clientId, clientSecret });
}

function getPDFServices() {
  return new PDFServices({ credentials: getCredentials() });
}

function formatAdobeError(err) {
  if (err instanceof ServiceUsageError) {
    return 'Adobe PDF Services quota exhausted. Check your API usage limits.';
  }
  if (err instanceof ServiceApiError || err instanceof SDKError) {
    return err.message || 'Adobe PDF Services error';
  }
  return err.message || 'Adobe PDF Services error';
}

async function streamToBuffer(readStream) {
  const chunks = [];
  for await (const chunk of readStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function uploadFile(pdfServices, filePath, mimeType) {
  const readStream = fs.createReadStream(filePath);
  try {
    return await pdfServices.upload({ readStream, mimeType });
  } finally {
    readStream.destroy();
  }
}

async function uploadFiles(pdfServices, files) {
  const streams = files.map((f) => fs.createReadStream(f.path));
  try {
    return await pdfServices.uploadAssets({
      streamAssets: files.map((file, index) => ({
        readStream: streams[index],
        mimeType: file.mimeType,
      })),
    });
  } finally {
    streams.forEach((stream) => stream.destroy());
  }
}

async function getAssetBuffer(pdfServices, asset) {
  const streamAsset = await pdfServices.getContent({ asset });
  return streamToBuffer(streamAsset.readStream);
}

async function runJob(pdfServices, job, resultType) {
  const pollingURL = await pdfServices.submit({ job });
  return pdfServices.getJobResult({ pollingURL, resultType });
}

module.exports = {
  isAdobeConfigured,
  getCredentials,
  getPDFServices,
  formatAdobeError,
  streamToBuffer,
  uploadFile,
  uploadFiles,
  getAssetBuffer,
  runJob,
};
