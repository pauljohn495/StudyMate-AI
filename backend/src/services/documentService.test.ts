import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { chunkDocument, cleanExtractedText, extractDocument } from './documentService.js';

test('cleans common page markers and excessive whitespace', () => {
  const value = cleanExtractedText('Page 1 of 3\n\n  Introduction   to   Networks  \n\nA network connects devices.\n\n\nPage 2');
  assert.equal(value, 'Introduction to Networks\n\nA network connects devices.');
});

test('extracts and normalizes UTF-8 text files', async () => {
  const result = await extractDocument(Buffer.from('\uFEFFTitle\r\n\r\nFirst   paragraph.\r\n\r\nSecond paragraph.'), 'txt');
  assert.match(result.text, /Title/);
  assert.match(result.text, /Second paragraph/);
  assert.equal(result.sections.length, 1);
});

test('extracts slide text in slide order from PPTX archives', async () => {
  const zip = new JSZip();
  zip.file('ppt/presentation.xml', '<p:presentation xmlns:p="p"/>');
  zip.file('ppt/slides/slide1.xml', '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><a:t>Access Control</a:t><a:t>Least privilege limits permissions.</a:t></p:cSld></p:sld>');
  zip.file('ppt/slides/slide2.xml', '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><a:t>Authentication verifies identity.</a:t></p:cSld></p:sld>');
  const result = await extractDocument(await zip.generateAsync({ type: 'nodebuffer' }), 'pptx');
  assert.equal(result.pageCount, 2);
  assert.match(result.text, /Least privilege/);
  assert.match(result.text, /Authentication/);
});

test('extracts paragraph text from DOCX archives', async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p><w:r><w:t>Network Security</w:t></w:r></w:p>
      <w:p><w:r><w:t>Confidentiality protects information from unauthorized disclosure.</w:t></w:r></w:p>
    </w:body></w:document>`);
  const result = await extractDocument(await zip.generateAsync({ type: 'nodebuffer' }), 'docx');
  assert.match(result.text, /Network Security/);
  assert.match(result.text, /unauthorized disclosure/);
});

const minimalPdf = (text: string) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${text.length + 38} >>\nstream\nBT /F1 12 Tf 72 720 Td (${text}) Tj ET\nendstream`
  ];
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output);
};

test('extracts text and page metadata from PDFs', async () => {
  const result = await extractDocument(minimalPdf('Network security fundamentals'), 'pdf');
  assert.equal(result.pageCount, 1);
  assert.match(result.text, /Network security fundamentals/);
  assert.equal(result.sections[0]?.pageNumber, 1);
});

test('creates bounded, ordered chunks with token estimates', () => {
  const sections = [{ pageNumber: 1, content: Array.from({ length: 24 }, (_, index) => `Paragraph ${index + 1}. ${'Learning content '.repeat(18)}`).join('\n\n') }];
  const chunks = chunkDocument(sections, 900, 1_200);
  assert.ok(chunks.length > 1);
  assert.deepEqual(chunks.map((chunk) => chunk.chunkIndex), chunks.map((_, index) => index));
  assert.ok(chunks.every((chunk) => chunk.content.length <= 1_200 && chunk.tokenEstimate > 0));
});
