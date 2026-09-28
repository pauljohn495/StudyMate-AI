export type SupportedDocumentExtension = 'pdf' | 'docx' | 'pptx' | 'txt';
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface DocumentRow {
  id: string;
  lesson_id: string;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  content_hash: string | null;
  extracted_text: string | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  chunk_count?: number;
}

export interface ExtractedSection {
  content: string;
  pageNumber?: number;
}

export interface ExtractionResult {
  text: string;
  sections: ExtractedSection[];
  pageCount?: number;
  warnings: string[];
}

export interface DocumentChunkInput {
  chunkIndex: number;
  heading: string | null;
  content: string;
  pageNumber: number | null;
  tokenEstimate: number;
}
