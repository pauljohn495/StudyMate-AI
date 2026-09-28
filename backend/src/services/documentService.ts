import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { env } from '../config/env.js';
import type { DocumentChunkInput, ExtractionResult, ExtractedSection, SupportedDocumentExtension } from '../types/documents.js';
import { ApiError } from '../utils/ApiError.js';

const allowed: Record<SupportedDocumentExtension, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
  txt: ['text/plain', 'application/octet-stream']
};

export const supportedExtensions = Object.keys(allowed) as SupportedDocumentExtension[];

const extensionOf = (name: string) => path.extname(name).slice(1).toLowerCase() as SupportedDocumentExtension;

export async function validateDocument(file: Express.Multer.File) {
  const extension = extensionOf(file.originalname);
  if (!supportedExtensions.includes(extension)) throw new ApiError(415, 'Only PDF, DOCX, PPTX, and TXT files are supported.', 'UNSUPPORTED_FILE');
  const detected = await fileTypeFromBuffer(file.buffer);
  if (extension === 'txt') {
    if (detected && detected.mime !== 'text/plain') throw new ApiError(415, 'The selected file does not appear to be plain text.', 'INVALID_FILE_SIGNATURE');
  } else if (!detected || !allowed[extension].includes(detected.mime)) {
    throw new ApiError(415, `The file contents do not match the .${extension} extension.`, 'INVALID_FILE_SIGNATURE');
  }
  if ((extension === 'docx' || extension === 'pptx') && detected?.mime === 'application/zip') {
    const zip = await JSZip.loadAsync(file.buffer);
    const marker = extension === 'docx' ? 'word/document.xml' : 'ppt/presentation.xml';
    if (!zip.file(marker)) throw new ApiError(415, `This archive is not a valid ${extension.toUpperCase()} document.`, 'INVALID_OFFICE_FILE');
  }
  return { extension, detectedMime: detected?.mime ?? file.mimetype };
}

export const contentHash = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');
export const storageKeyFor = (userId: string, lessonId: string, extension: string) => `${userId}/${lessonId}/${randomUUID()}.${extension}`;

const cleanSegment = (value: string) => value
  .replace(/\r\n?/g, '\n')
  .replace(/[\t\u00a0]+/g, ' ')
  .replace(/[ ]{2,}/g, ' ')
  .replace(/[ ]+\n/g, '\n')
  .replace(/\n[ ]+/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export function cleanExtractedText(value: string) {
  const clean = cleanSegment(value);
  const paragraphs = clean.split(/\n{2,}/);
  const lineFrequency = new Map<string, number>();
  for (const paragraph of paragraphs) {
    const line = paragraph.trim();
    if (line.length > 0 && line.length < 120) lineFrequency.set(line, (lineFrequency.get(line) ?? 0) + 1);
  }
  const repeatThreshold = Math.max(3, Math.ceil(paragraphs.length * .25));
  return paragraphs.filter((paragraph) => {
    const line = paragraph.trim();
    return !(/^page\s+\d+(\s+of\s+\d+)?$/i.test(line) || (lineFrequency.get(line) ?? 0) >= repeatThreshold);
  }).join('\n\n').trim();
}

function collectTextValue(node: unknown, output: string[]) {
  if (typeof node === 'string') { if (node.trim()) output.push(node.trim()); return; }
  if (Array.isArray(node)) { for (const child of node) collectTextValue(child, output); return; }
  if (!node || typeof node !== 'object') return;
  for (const value of Object.values(node)) collectTextValue(value, output);
}

function collectSlideText(node: unknown, output: string[]) {
  if (Array.isArray(node)) { for (const child of node) collectSlideText(child, output); return; }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'a:t') collectTextValue(value, output);
    else collectSlideText(value, output);
  }
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pageCount = result.total;
    if (pageCount > env.MAX_DOCUMENT_PAGES) throw new ApiError(422, `PDF exceeds the ${env.MAX_DOCUMENT_PAGES}-page limit.`, 'PAGE_LIMIT_EXCEEDED');
    const sections: ExtractedSection[] = result.pages.map((page) => ({ content: cleanSegment(page.text), pageNumber: page.num }));
    return { text: cleanExtractedText(result.text), sections, pageCount, warnings: [] };
  } finally { await parser.destroy(); }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanExtractedText(result.value);
  return { text, sections: [{ content: text }], warnings: result.messages.map((message) => message.message) };
}

async function extractPptx(buffer: Buffer): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  if (slideFiles.length > env.MAX_DOCUMENT_PAGES) throw new ApiError(422, `Presentation exceeds the ${env.MAX_DOCUMENT_PAGES}-slide limit.`, 'PAGE_LIMIT_EXCEEDED');
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true });
  const sections: ExtractedSection[] = [];
  for (let index = 0; index < slideFiles.length; index += 1) {
    const xml = await zip.file(slideFiles[index]!)!.async('string');
    const lines: string[] = [];
    collectSlideText(parser.parse(xml), lines);
    sections.push({ pageNumber: index + 1, content: cleanSegment(lines.filter(Boolean).join('\n')) });
  }
  const text = sections.map((section) => `Slide ${section.pageNumber}\n${section.content}`).join('\n\n');
  return { text, sections, pageCount: sections.length, warnings: [] };
}

function extractTxt(buffer: Buffer): ExtractionResult {
  if (buffer.includes(0)) throw new ApiError(415, 'The text file contains binary data.', 'INVALID_TEXT_FILE');
  const text = cleanExtractedText(buffer.toString('utf8').replace(/^\uFEFF/, ''));
  return { text, sections: [{ content: text }], warnings: [] };
}

export async function extractDocument(buffer: Buffer, extension: SupportedDocumentExtension) {
  const result = extension === 'pdf' ? await extractPdf(buffer)
    : extension === 'docx' ? await extractDocx(buffer)
    : extension === 'pptx' ? await extractPptx(buffer)
    : extractTxt(buffer);
  if (!result.text.trim()) throw new ApiError(422, 'No readable text was found in this document.', 'NO_TEXT_EXTRACTED');
  return result;
}

const headingFrom = (paragraph: string) => {
  const firstLine = paragraph.split('\n')[0]!.trim();
  if (firstLine.length > 100 || firstLine.endsWith('.') || firstLine.split(/\s+/).length > 12) return null;
  if (/^(chapter|module|lesson|unit|topic|section)\b/i.test(firstLine) || /^\d+(\.\d+)*[.)]?\s+/.test(firstLine) || firstLine === firstLine.toUpperCase()) return firstLine;
  return null;
};

export function chunkDocument(sections: ExtractedSection[], targetChars = 4_800, maxChars = 6_400): DocumentChunkInput[] {
  const chunks: DocumentChunkInput[] = [];
  let current = '';
  let currentPage: number | null = null;
  let currentHeading: string | null = null;
  const flush = () => {
    const content = current.trim();
    if (content) chunks.push({ chunkIndex: chunks.length, heading: currentHeading, content, pageNumber: currentPage, tokenEstimate: Math.ceil(content.length / 4) });
    current = ''; currentPage = null; currentHeading = null;
  };
  for (const section of sections) {
    const paragraphs = cleanSegment(section.content).split(/\n{2,}|(?<=\.)\n(?=[A-Z0-9])/).filter(Boolean);
    for (const paragraph of paragraphs) {
      const heading = headingFrom(paragraph);
      if (heading && current.length >= targetChars * .45) flush();
      if (!currentHeading && heading) currentHeading = heading;
      if (currentPage === null) currentPage = section.pageNumber ?? null;
      if (current && current.length + paragraph.length + 2 > maxChars) flush();
      current += `${current ? '\n\n' : ''}${paragraph}`;
      if (current.length >= targetChars) flush();
    }
  }
  flush();
  return chunks;
}
