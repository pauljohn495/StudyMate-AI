export type AiFeature = 'reviewer' | 'summary' | 'topics' | 'flashcards' | 'quiz' | 'exam' | 'tutor';
export type ReviewerType = 'quick' | 'detailed' | 'qa' | 'key_concepts' | 'definitions';
export type ReviewerDifficulty = 'simple' | 'standard' | 'detailed';
export type SummaryLength = 'short' | 'medium' | 'detailed';

export interface AiUsageResult { inputTokens: number | null; outputTokens: number | null; model: string; }
export interface StructuredAiResult<T> extends AiUsageResult { data: T; repaired: boolean; }

export interface LessonSource {
  lessonId: string;
  title: string;
  sourceVersion: string;
  context: string;
  chunkCount: number;
  selectedChunkCount: number;
  truncated: boolean;
}
