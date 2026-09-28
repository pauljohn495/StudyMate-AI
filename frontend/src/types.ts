export interface User { id: string; name: string; email: string; course?: string | null; yearLevel?: string | null; school?: string | null; profileImageUrl?: string | null }
export interface SearchResult { id:string; type:'subject'|'lesson'|'material'|'reviewer'|'flashcards'|'quiz'|'exam'|'plan'; title:string; subtitle:string; href:string }
export interface Subject { id: string; user_id?: string; name: string; description: string | null; icon: string; color: SubjectColor; lesson_count: number; created_at?: string; updated_at?: string }
export type SubjectColor = 'indigo' | 'violet' | 'sky' | 'emerald' | 'amber' | 'rose';
export interface Lesson { id: string; subject_id: string; title: string; description: string | null; processing_status: 'empty'|'uploading'|'processing'|'ready'|'failed'; created_at?: string; updated_at?: string }
export interface StudyDocument {
  id: string; lesson_id: string; original_name: string; mime_type: string; size_bytes: number;
  status: 'uploading'|'processing'|'ready'|'failed'; error_message: string | null; chunk_count: number;
  created_at: string; updated_at?: string; lesson_title?: string; subject_id?: string; subject_name?: string;
  preview_text?: string;
}
export interface DocumentChunk { id: string; chunk_index: number; heading: string | null; content: string; page_number: number | null; token_estimate: number }
export interface ReviewerContent { title: string; sections: Array<{ heading: string; bullets: string[] }>; keyTakeaways: string[] }
export interface SummaryContent { title: string; overview: string; sections: Array<{ heading: string; content: string }>; keyTakeaways: string[] }
export interface ReviewerResource { id:string;lesson_id:string;title:string;reviewer_type:'quick'|'detailed'|'qa'|'key_concepts'|'definitions';difficulty:'simple'|'standard'|'detailed';original_wording:boolean;content:ReviewerContent;created_at:string;updated_at:string;lesson_title?:string;subject_name?:string;cached?:boolean }
export interface SummaryResource { id:string;lesson_id:string;title:string;summary_length:'short'|'medium'|'detailed';content:SummaryContent;created_at:string;updated_at:string;lesson_title?:string;subject_name?:string;cached?:boolean }
export interface LessonTopic { id:string;name:string;created_at?:string }
export interface AiStatus { configured:boolean;model:string;usage:Record<'reviewer'|'summary'|'topics'|'flashcards'|'quiz'|'exam'|'tutor',{used:number;limit:number;remaining:number}> }
export interface FlashcardDeck {id:string;lesson_id:string;title:string;difficulty:'easy'|'medium'|'hard'|'mixed';card_count:number;created_at:string;updated_at:string;lesson_title?:string;subject_name?:string;reviewed_count?:number;due_count?:number;cached?:boolean}
export interface Flashcard {id:string;front:string;back:string;difficulty:'easy'|'medium'|'hard';topic:string|null;last_rating:'again'|'hard'|'good'|'easy'|null;due_at:string|null;review_count:number}
export interface FlashcardDeckDetail {deck:FlashcardDeck;cards:Flashcard[]}
export type QuizQuestionType='multiple_choice'|'true_false'|'identification';
export type QuizConfigurationType=QuizQuestionType|'mixed';
export interface QuizSummary {id:string;lesson_id:string;title:string;question_type:QuizConfigurationType;difficulty:'easy'|'medium'|'hard';question_count:number;created_at:string;updated_at:string;lesson_title?:string;subject_name?:string;attempt_count?:number;best_percentage?:number|null;latest_percentage?:number|null;cached?:boolean}
export interface QuizQuestion {id:string;quiz_id:string;topic_id:string|null;topic:string|null;position:number;question_type:QuizQuestionType;prompt:string;choices:string[]}
export interface QuizDetail {quiz:QuizSummary;questions:QuizQuestion[]}
export interface QuizTopicResult {topic:string;correct:number;total:number;accuracy:number;status:'strong'|'good'|'needs_review'|'weak'}
export interface QuizAnswerReview {question_id:string;position:number;prompt:string;question_type:QuizQuestionType;choices:string[];answer:string;is_correct:boolean;correct_answer:string;acceptable_answers:string[];explanation:string;topic:string|null}
export interface QuizAttempt {id:string;quiz_id:string;quiz_title:string;lesson_id:string;lesson_title:string;correct_count:number;total_count:number;percentage:number;started_at:string;completed_at:string}
export interface QuizAttemptDetail {attempt:QuizAttempt;answers:QuizAnswerReview[];topics:QuizTopicResult[]}
export interface TutorLesson {id:string;title:string;subject_name:string}
export interface TutorSource {number:number;document:string;page:number|null;heading:string|null}
export interface TutorMessage {id?:string;role:'user'|'assistant';content:string;sources:TutorSource[];created_at?:string}
export interface TutorConversation {id:string;lesson_id:string;title:string;lesson_title:string;subject_name:string;created_at?:string;updated_at:string}
export interface TutorConversationDetail {conversation:TutorConversation;messages:TutorMessage[]}
export interface TutorReply {conversation:TutorConversation;message:TutorMessage}
export interface ExamSummary {id:string;title:string;question_type:QuizConfigurationType;difficulty:'easy'|'medium'|'hard';question_count:number;time_limit_minutes:number|null;lesson_count:number;created_at:string;updated_at?:string;attempt_count:number;best_percentage:number|null;cached?:boolean}
export interface ExamQuestion extends QuizQuestion {lesson_id:string;lesson_title:string}
export interface ExamDetail {exam:ExamSummary;questions:ExamQuestion[]}
export interface ExamAttempt {id:string;exam_id:string;exam_title:string;correct_count:number;total_count:number;percentage:number;started_at:string;completed_at:string}
export interface ExamAnswerReview extends QuizAnswerReview {lesson_title:string}
export interface ExamAttemptDetail {attempt:ExamAttempt;answers:ExamAnswerReview[]}
export type StudyPlanEventType='exam'|'quiz'|'assignment'|'deadline';
export type StudyTaskType='review'|'flashcards'|'quiz'|'tutor'|'practice_exam';
export interface StudyPlanSummary {id:string;subject_id:string|null;subject_name:string|null;title:string;event_type:StudyPlanEventType;due_at:string;coverage:string|null;notes:string|null;created_at:string;updated_at:string;task_count:number;completed_count:number;next_task_due:string|null;lesson_count:number}
export interface StudyTask {id:string;plan_id:string;lesson_id:string|null;lesson_title:string|null;title:string;task_type:StudyTaskType;rationale:string;estimated_minutes:number;priority:number;position:number;due_at:string;completed_at:string|null}
export interface PlanPriority {id:string;title:string;subject_id:string;subject_name:string;processing_status:Lesson['processing_status'];accuracy:number|null;weak_topic_count:number;weak_topics:string[];priority:number;status:'not_studied'|'weak'|'needs_review'|'good'|'strong'}
export interface StudyPlanDetail {plan:Omit<StudyPlanSummary,'task_count'|'completed_count'|'next_task_due'|'lesson_count'>;tasks:StudyTask[];priorities:PlanPriority[]}
export interface StudyRecommendation {title:string;description:string;action:string;href:string}
export interface ProgressMetrics {quizzes_completed:number;quiz_accuracy:number;flashcards_reviewed:number;total_sessions:number;study_minutes:number;lessons_studied:number;due_cards:number;current_streak:number;best_streak:number}
export interface WeeklyActivity {date:string;label:string;minutes:number;actions:number}
export interface TopicPerformance {topic_id:string;topic:string;lesson_id:string;lesson_title:string;subject_id:string;subject_name:string;correct_answers:number;total_answers:number;accuracy:number;status:QuizTopicResult['status'];recommendation:StudyRecommendation}
export interface SubjectPerformance {subject_id:string;subject_name:string;color:string;correct_answers:number;total_answers:number;attempt_count:number;accuracy:number}
export interface QuizTrendPoint {id:string;quiz_title:string;lesson_title:string;percentage:number;completed_at:string}
export interface RecentLessonProgress {lesson_id:string;lesson_title:string;subject_id:string;subject_name:string;color:string;last_activity:string;accuracy:number}
export interface ProgressOverview {metrics:ProgressMetrics;weekly_activity:WeeklyActivity[];topics:TopicPerformance[];subjects:SubjectPerformance[];quiz_trend:QuizTrendPoint[];recent_lessons:RecentLessonProgress[];recommendation:StudyRecommendation}
export interface ApiResponse<T> { success: boolean; data: T; message?: string }
