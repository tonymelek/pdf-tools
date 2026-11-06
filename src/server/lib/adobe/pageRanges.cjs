const { PageRanges } = require('@adobe/pdfservices-node-sdk');

function parsePageRanges(input) {
  const pageRanges = new PageRanges();
  const trimmed = (input || '').trim();
  if (!trimmed) {
    throw new Error('Page ranges are required (e.g. 1,3-5,7)');
  }

  for (const part of trimmed.split(',')) {
    const segment = part.trim();
    if (!segment) continue;

    if (segment.includes('-')) {
      const [startRaw, endRaw] = segment.split('-');
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range: ${segment}`);
      }
      pageRanges.addRange(start, end);
    } else {
      const page = Number.parseInt(segment, 10);
      if (!Number.isFinite(page) || page < 1) {
        throw new Error(`Invalid page number: ${segment}`);
      }
      pageRanges.addSinglePage(page);
    }
  }

  return pageRanges;
}

/** One line per PDF; blank / `all` / `*` means include all pages. */
function parsePageRangesPerFile(input, fileCount) {
  const raw = (input ?? '').trim();
  const lines = raw
    ? raw.split(/\r?\n/).map((line) => line.trim())
    : Array(fileCount).fill('');

  if (lines.length !== fileCount) {
    throw new Error(
      `Provide exactly ${fileCount} page-range line(s), one per PDF in upload order (${lines.length} given).`
    );
  }

  return lines.map((line, index) => {
    if (!line || line === '*' || line.toLowerCase() === 'all') {
      return undefined;
    }
    try {
      return parsePageRanges(line);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`File ${index + 1}: ${message}`);
    }
  });
}

module.exports = { parsePageRanges, parsePageRangesPerFile };
