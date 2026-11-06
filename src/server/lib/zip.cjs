const { PassThrough } = require('stream');

async function entriesToZipBuffer(entries) {
  const { ZipArchive } = await import('archiver');
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks = [];

  const done = new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    archive.on('error', reject);
  });

  archive.pipe(stream);

  for (const entry of entries) {
    archive.append(entry.buffer, { name: entry.name });
  }

  await archive.finalize();
  return done;
}

module.exports = { entriesToZipBuffer };
