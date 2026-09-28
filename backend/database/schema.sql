-- StudyMate PostgreSQL schema. Safe for a new local PostgreSQL or Supabase project.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE users (
  id uuid PRIMARY KEY, name varchar(100) NOT NULL, email varchar(190) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL, course varchar(120), year_level varchar(40), school varchar(160), profile_image_url varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL, description text, icon varchar(40) NOT NULL DEFAULT 'book-open', color varchar(20) NOT NULL DEFAULT 'indigo',
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,name)
);
CREATE INDEX idx_subject_user_archived ON subjects(user_id,archived_at);

CREATE TABLE lessons (
  id uuid PRIMARY KEY, subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL, description text, processing_status varchar(20) NOT NULL DEFAULT 'empty' CHECK(processing_status IN ('empty','uploading','processing','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(subject_id,title)
);
CREATE INDEX idx_lesson_subject ON lessons(subject_id);

CREATE TABLE documents (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  original_name varchar(255) NOT NULL, storage_key varchar(500) NOT NULL, mime_type varchar(120) NOT NULL,
  size_bytes bigint NOT NULL CHECK(size_bytes>=0), content_hash char(64), extracted_text text,
  status varchar(20) NOT NULL DEFAULT 'uploading' CHECK(status IN ('uploading','processing','ready','failed')), error_message varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_document_lesson ON documents(lesson_id);CREATE INDEX idx_document_hash ON documents(content_hash);

CREATE TABLE document_chunks (
  id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK(chunk_index>=0), heading varchar(255), content text NOT NULL, page_number integer CHECK(page_number IS NULL OR page_number>=0),
  token_estimate integer NOT NULL DEFAULT 0 CHECK(token_estimate>=0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,chunk_index)
);
CREATE INDEX idx_chunk_content_fts ON document_chunks USING gin(to_tsvector('english',coalesce(heading,'')||' '||content));

CREATE TABLE topics (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(lesson_id,name)
);

CREATE TABLE reviewers (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, title varchar(200) NOT NULL,
  reviewer_type varchar(30) NOT NULL CHECK(reviewer_type IN ('quick','detailed','qa','key_concepts','definitions')),
  difficulty varchar(20) NOT NULL CHECK(difficulty IN ('simple','standard','detailed')), original_wording boolean NOT NULL DEFAULT false,
  content text NOT NULL, source_version varchar(64), generation_key char(64), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviewer_lesson ON reviewers(lesson_id);CREATE INDEX idx_reviewer_cache ON reviewers(generation_key);

CREATE TABLE summaries (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, title varchar(200) NOT NULL,
  summary_length varchar(20) NOT NULL CHECK(summary_length IN ('short','medium','detailed')), content text NOT NULL,
  source_version varchar(64) NOT NULL, generation_key char(64) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_summary_lesson ON summaries(lesson_id);CREATE INDEX idx_summary_cache ON summaries(generation_key);

CREATE TABLE flashcard_decks (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, title varchar(200) NOT NULL,
  difficulty varchar(20) NOT NULL DEFAULT 'mixed' CHECK(difficulty IN ('easy','medium','hard','mixed')), card_count integer NOT NULL CHECK(card_count>=0),
  source_version varchar(64) NOT NULL, generation_key char(64) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deck_lesson ON flashcard_decks(lesson_id);CREATE INDEX idx_deck_cache ON flashcard_decks(generation_key);

CREATE TABLE flashcards (
  id uuid PRIMARY KEY, deck_id uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL, front text NOT NULL, back text NOT NULL,
  difficulty varchar(20) NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_flashcard_deck ON flashcards(deck_id);CREATE INDEX idx_flashcard_lesson ON flashcards(lesson_id);CREATE INDEX idx_flashcard_topic ON flashcards(topic_id);

CREATE TABLE flashcard_reviews (
  id uuid PRIMARY KEY, flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating varchar(20) NOT NULL CHECK(rating IN ('again','hard','good','easy')), reviewed_at timestamptz NOT NULL DEFAULT now(), due_at timestamptz NOT NULL
);
CREATE INDEX idx_review_due ON flashcard_reviews(user_id,due_at);CREATE INDEX idx_review_user_date ON flashcard_reviews(user_id,reviewed_at);

CREATE TABLE quizzes (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, title varchar(200) NOT NULL,
  question_type varchar(30) NOT NULL CHECK(question_type IN ('multiple_choice','true_false','identification','mixed')),
  difficulty varchar(20) NOT NULL CHECK(difficulty IN ('easy','medium','hard')), question_count integer NOT NULL CHECK(question_count>=0),
  source_version varchar(64) NOT NULL, generation_key char(64) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_lesson ON quizzes(lesson_id);CREATE INDEX idx_quiz_cache ON quizzes(generation_key);

CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY, quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE, topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  position integer NOT NULL CHECK(position>=0), question_type varchar(30) NOT NULL CHECK(question_type IN ('multiple_choice','true_false','identification')),
  prompt text NOT NULL, choices_json jsonb, correct_answer_json jsonb NOT NULL, explanation text, UNIQUE(quiz_id,position)
);

CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY, quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct_count integer NOT NULL CHECK(correct_count>=0), total_count integer NOT NULL CHECK(total_count>=0), percentage numeric(5,2) NOT NULL,
  started_at timestamptz NOT NULL, completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempt_user_date ON quiz_attempts(user_id,completed_at);

CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE, question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_json jsonb NOT NULL, is_correct boolean NOT NULL, UNIQUE(attempt_id,question_id)
);

CREATE TABLE topic_performance (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  correct_answers integer NOT NULL DEFAULT 0 CHECK(correct_answers>=0), total_answers integer NOT NULL DEFAULT 0 CHECK(total_answers>=0),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,topic_id)
);

CREATE TABLE tutor_conversations (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tutor_conversation_user ON tutor_conversations(user_id,updated_at);

CREATE TABLE tutor_messages (
  id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK(role IN ('user','assistant')), content text NOT NULL, sources_json jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tutor_message_conversation ON tutor_messages(conversation_id,created_at);

CREATE TABLE practice_exams (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, title varchar(200) NOT NULL,
  question_type varchar(30) NOT NULL CHECK(question_type IN ('multiple_choice','true_false','identification','mixed')),
  difficulty varchar(20) NOT NULL CHECK(difficulty IN ('easy','medium','hard')), question_count integer NOT NULL CHECK(question_count>=0),
  time_limit_minutes integer CHECK(time_limit_minutes IS NULL OR time_limit_minutes>=0), source_version varchar(64) NOT NULL, generation_key char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_user ON practice_exams(user_id,updated_at);CREATE INDEX idx_exam_cache ON practice_exams(generation_key);

CREATE TABLE practice_exam_lessons (
  exam_id uuid NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, PRIMARY KEY(exam_id,lesson_id)
);
CREATE TABLE practice_exam_questions (
  id uuid PRIMARY KEY, exam_id uuid NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL, position integer NOT NULL CHECK(position>=0),
  question_type varchar(30) NOT NULL CHECK(question_type IN ('multiple_choice','true_false','identification')), prompt text NOT NULL,
  choices_json jsonb, correct_answer_json jsonb NOT NULL, explanation text NOT NULL, UNIQUE(exam_id,position)
);
CREATE TABLE practice_exam_attempts (
  id uuid PRIMARY KEY, exam_id uuid NOT NULL REFERENCES practice_exams(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct_count integer NOT NULL CHECK(correct_count>=0), total_count integer NOT NULL CHECK(total_count>=0), percentage numeric(5,2) NOT NULL,
  started_at timestamptz NOT NULL, completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exam_attempt_user ON practice_exam_attempts(user_id,completed_at);
CREATE TABLE practice_exam_answers (
  id uuid PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES practice_exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES practice_exam_questions(id) ON DELETE CASCADE, answer_json jsonb NOT NULL, is_correct boolean NOT NULL,
  UNIQUE(attempt_id,question_id)
);

CREATE TABLE study_sessions (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  activity_type varchar(30) NOT NULL CHECK(activity_type IN ('lesson','reviewer','flashcards','quiz','exam','tutor')),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK(duration_seconds>=0), started_at timestamptz NOT NULL, ended_at timestamptz
);
CREATE INDEX idx_session_user_date ON study_sessions(user_id,started_at);

CREATE TABLE notes (
  id uuid PRIMARY KEY, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL, is_pinned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_note_lesson ON notes(lesson_id);

CREATE TABLE ai_usage (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature varchar(30) NOT NULL CHECK(feature IN ('reviewer','summary','flashcards','quiz','exam','tutor','topics')),
  request_count integer NOT NULL DEFAULT 1 CHECK(request_count>=0), input_tokens integer CHECK(input_tokens IS NULL OR input_tokens>=0),
  output_tokens integer CHECK(output_tokens IS NULL OR output_tokens>=0), model varchar(100) NOT NULL, successful boolean NOT NULL,
  error_code varchar(80), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_quota ON ai_usage(user_id,feature,created_at);

CREATE TABLE study_plans (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title varchar(180) NOT NULL, event_type varchar(30) NOT NULL CHECK(event_type IN ('exam','quiz','assignment','deadline')),
  due_at timestamptz NOT NULL, coverage text, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_due ON study_plans(user_id,due_at);
CREATE TABLE study_plan_lessons (
  plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE, lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, PRIMARY KEY(plan_id,lesson_id)
);
CREATE TABLE study_tasks (
  id uuid PRIMARY KEY, plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE, lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  title varchar(180) NOT NULL, task_type varchar(30) NOT NULL DEFAULT 'review' CHECK(task_type IN ('review','flashcards','quiz','tutor','practice_exam')),
  rationale varchar(500) NOT NULL, estimated_minutes integer NOT NULL DEFAULT 25 CHECK(estimated_minutes>=0), priority integer NOT NULL DEFAULT 50 CHECK(priority>=0),
  position integer NOT NULL DEFAULT 0 CHECK(position>=0), due_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_plan_due ON study_tasks(plan_id,due_at);CREATE INDEX idx_task_completion ON study_tasks(plan_id,completed_at);

CREATE TABLE notifications (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, title varchar(160) NOT NULL, body text NOT NULL,
  type varchar(50) NOT NULL DEFAULT 'info', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_unread ON notifications(user_id,read_at,created_at);

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','subjects','lessons','documents','reviewers','summaries','flashcard_decks','flashcards','quizzes','topic_performance','tutor_conversations','practice_exams','notes','study_plans']
  LOOP EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',table_name,table_name); END LOOP;
END $$;

-- StudyMate authorizes requests in the Express API, not through Supabase Auth.
-- RLS with no browser policies prevents accidental Data API access while the database owner used by the API retains access.
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','subjects','lessons','documents','document_chunks','topics','reviewers','summaries','flashcard_decks','flashcards','flashcard_reviews','quizzes','quiz_questions','quiz_attempts','quiz_answers','topic_performance','tutor_conversations','tutor_messages','practice_exams','practice_exam_lessons','practice_exam_questions','practice_exam_attempts','practice_exam_answers','study_sessions','notes','ai_usage','study_plans','study_plan_lessons','study_tasks','notifications']
  LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',table_name); END LOOP;
END $$;
