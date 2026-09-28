CREATE DATABASE IF NOT EXISTS studymate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studymate;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  course VARCHAR(120), year_level VARCHAR(40), school VARCHAR(160), profile_image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE subjects (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL, description TEXT, icon VARCHAR(40) NOT NULL DEFAULT 'book-open', color VARCHAR(20) NOT NULL DEFAULT 'indigo',
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subject_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_subject_user_name (user_id, name), INDEX idx_subject_user_archived (user_id, archived_at)
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id CHAR(36) PRIMARY KEY, subject_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL, description TEXT,
  processing_status ENUM('empty','uploading','processing','ready','failed') NOT NULL DEFAULT 'empty',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lesson_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_lesson_subject_title (subject_id, title), INDEX idx_lesson_subject (subject_id)
) ENGINE=InnoDB;

CREATE TABLE documents (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL,
  original_name VARCHAR(255) NOT NULL, storage_key VARCHAR(500) NOT NULL, mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL, content_hash CHAR(64), extracted_text LONGTEXT,
  status ENUM('uploading','processing','ready','failed') NOT NULL DEFAULT 'uploading', error_message VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_document_lesson (lesson_id), INDEX idx_document_hash (content_hash)
) ENGINE=InnoDB;

CREATE TABLE document_chunks (
  id CHAR(36) PRIMARY KEY, document_id CHAR(36) NOT NULL, chunk_index INT UNSIGNED NOT NULL,
  heading VARCHAR(255), content MEDIUMTEXT NOT NULL, page_number INT UNSIGNED, token_estimate INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chunk_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_document_chunk (document_id, chunk_index), FULLTEXT KEY ft_chunk_content (heading, content)
) ENGINE=InnoDB;

CREATE TABLE topics (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, name VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_topic_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY uq_lesson_topic (lesson_id, name)
) ENGINE=InnoDB;

CREATE TABLE reviewers (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  reviewer_type ENUM('quick','detailed','qa','key_concepts','definitions') NOT NULL,
  difficulty ENUM('simple','standard','detailed') NOT NULL, original_wording BOOLEAN NOT NULL DEFAULT FALSE,
  content LONGTEXT NOT NULL, source_version VARCHAR(64), generation_key CHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviewer_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_reviewer_lesson (lesson_id), INDEX idx_reviewer_cache (generation_key)
) ENGINE=InnoDB;

CREATE TABLE summaries (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  summary_length ENUM('short','medium','detailed') NOT NULL, content LONGTEXT NOT NULL,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_summary_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_summary_lesson (lesson_id), INDEX idx_summary_cache (generation_key)
) ENGINE=InnoDB;

CREATE TABLE flashcard_decks (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  difficulty ENUM('easy','medium','hard','mixed') NOT NULL DEFAULT 'mixed', card_count INT UNSIGNED NOT NULL,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deck_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_deck_lesson (lesson_id), INDEX idx_deck_cache (generation_key)
) ENGINE=InnoDB;

CREATE TABLE flashcards (
  id CHAR(36) PRIMARY KEY, deck_id CHAR(36) NOT NULL, lesson_id CHAR(36) NOT NULL, topic_id CHAR(36),
  front TEXT NOT NULL, back TEXT NOT NULL, difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_flashcard_deck FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  CONSTRAINT fk_flashcard_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_flashcard_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_flashcard_deck (deck_id), INDEX idx_flashcard_lesson (lesson_id), INDEX idx_flashcard_topic (topic_id)
) ENGINE=InnoDB;

CREATE TABLE flashcard_reviews (
  id CHAR(36) PRIMARY KEY, flashcard_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
  rating ENUM('again','hard','good','easy') NOT NULL, reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, due_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_review_card FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_due (user_id, due_at), INDEX idx_review_user_date (user_id, reviewed_at)
) ENGINE=InnoDB;

CREATE TABLE quizzes (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  question_type ENUM('multiple_choice','true_false','identification','mixed') NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL, question_count INT UNSIGNED NOT NULL,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_quiz_lesson (lesson_id), INDEX idx_quiz_cache (generation_key)
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
  id CHAR(36) PRIMARY KEY, quiz_id CHAR(36) NOT NULL, topic_id CHAR(36), position INT UNSIGNED NOT NULL,
  question_type ENUM('multiple_choice','true_false','identification') NOT NULL, prompt TEXT NOT NULL,
  choices_json JSON, correct_answer_json JSON NOT NULL, explanation TEXT,
  CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  UNIQUE KEY uq_quiz_position (quiz_id, position)
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id CHAR(36) PRIMARY KEY, quiz_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
  correct_count INT UNSIGNED NOT NULL, total_count INT UNSIGNED NOT NULL, percentage DECIMAL(5,2) NOT NULL,
  started_at TIMESTAMP NOT NULL, completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_attempt_user_date (user_id, completed_at)
) ENGINE=InnoDB;

CREATE TABLE quiz_answers (
  id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, question_id CHAR(36) NOT NULL,
  answer_json JSON NOT NULL, is_correct BOOLEAN NOT NULL,
  CONSTRAINT fk_answer_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB;

CREATE TABLE topic_performance (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, topic_id CHAR(36) NOT NULL,
  correct_answers INT UNSIGNED NOT NULL DEFAULT 0, total_answers INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_performance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_performance_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_topic (user_id, topic_id)
) ENGINE=InnoDB;

CREATE TABLE tutor_conversations (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, lesson_id CHAR(36) NOT NULL, title VARCHAR(180) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tutor_conversation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tutor_conversation_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_tutor_conversation_user (user_id, updated_at)
) ENGINE=InnoDB;

CREATE TABLE tutor_messages (
  id CHAR(36) PRIMARY KEY, conversation_id CHAR(36) NOT NULL, role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL, sources_json JSON, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tutor_message_conversation FOREIGN KEY (conversation_id) REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  INDEX idx_tutor_message_conversation (conversation_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE practice_exams (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  question_type ENUM('multiple_choice','true_false','identification','mixed') NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL, question_count INT UNSIGNED NOT NULL, time_limit_minutes INT UNSIGNED,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_exam_user (user_id, updated_at), INDEX idx_exam_cache (generation_key)
) ENGINE=InnoDB;

CREATE TABLE practice_exam_lessons (
  exam_id CHAR(36) NOT NULL, lesson_id CHAR(36) NOT NULL, PRIMARY KEY (exam_id, lesson_id),
  CONSTRAINT fk_exam_lesson_exam FOREIGN KEY (exam_id) REFERENCES practice_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_lesson_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE practice_exam_questions (
  id CHAR(36) PRIMARY KEY, exam_id CHAR(36) NOT NULL, lesson_id CHAR(36) NOT NULL, topic_id CHAR(36), position INT UNSIGNED NOT NULL,
  question_type ENUM('multiple_choice','true_false','identification') NOT NULL, prompt TEXT NOT NULL, choices_json JSON,
  correct_answer_json JSON NOT NULL, explanation TEXT NOT NULL,
  CONSTRAINT fk_exam_question_exam FOREIGN KEY (exam_id) REFERENCES practice_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_question_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_question_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  UNIQUE KEY uq_exam_question_position (exam_id, position)
) ENGINE=InnoDB;

CREATE TABLE practice_exam_attempts (
  id CHAR(36) PRIMARY KEY, exam_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
  correct_count INT UNSIGNED NOT NULL, total_count INT UNSIGNED NOT NULL, percentage DECIMAL(5,2) NOT NULL,
  started_at TIMESTAMP NOT NULL, completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exam_attempt_exam FOREIGN KEY (exam_id) REFERENCES practice_exams(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_exam_attempt_user (user_id, completed_at)
) ENGINE=InnoDB;

CREATE TABLE practice_exam_answers (
  id CHAR(36) PRIMARY KEY, attempt_id CHAR(36) NOT NULL, question_id CHAR(36) NOT NULL, answer_json JSON NOT NULL, is_correct BOOLEAN NOT NULL,
  CONSTRAINT fk_exam_answer_attempt FOREIGN KEY (attempt_id) REFERENCES practice_exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_answer_question FOREIGN KEY (question_id) REFERENCES practice_exam_questions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_exam_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB;

CREATE TABLE study_sessions (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, lesson_id CHAR(36),
  activity_type ENUM('lesson','reviewer','flashcards','quiz','exam','tutor') NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0, started_at TIMESTAMP NOT NULL, ended_at TIMESTAMP NULL,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_session_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_session_user_date (user_id, started_at)
) ENGINE=InnoDB;

CREATE TABLE notes (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL, is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_note_lesson (lesson_id)
) ENGINE=InnoDB;

CREATE TABLE ai_usage (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL,
  feature ENUM('reviewer','summary','flashcards','quiz','exam','tutor','topics') NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 1, input_tokens INT UNSIGNED, output_tokens INT UNSIGNED,
  model VARCHAR(100) NOT NULL, successful BOOLEAN NOT NULL, error_code VARCHAR(80), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_usage_quota (user_id, feature, created_at)
) ENGINE=InnoDB;

CREATE TABLE study_plans (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, subject_id CHAR(36),
  title VARCHAR(180) NOT NULL, event_type ENUM('exam','quiz','assignment','deadline') NOT NULL,
  due_at DATETIME NOT NULL, coverage TEXT, notes TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  INDEX idx_plan_due (user_id, due_at)
) ENGINE=InnoDB;

CREATE TABLE study_plan_lessons (
  plan_id CHAR(36) NOT NULL, lesson_id CHAR(36) NOT NULL,
  PRIMARY KEY (plan_id, lesson_id),
  CONSTRAINT fk_plan_lesson_plan FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_lesson_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE study_tasks (
  id CHAR(36) PRIMARY KEY, plan_id CHAR(36) NOT NULL, lesson_id CHAR(36),
  title VARCHAR(180) NOT NULL, task_type ENUM('review','flashcards','quiz','tutor','practice_exam') NOT NULL DEFAULT 'review',
  rationale VARCHAR(500) NOT NULL, estimated_minutes INT UNSIGNED NOT NULL DEFAULT 25,
  priority INT UNSIGNED NOT NULL DEFAULT 50, position INT UNSIGNED NOT NULL DEFAULT 0, due_at DATETIME, completed_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_plan FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_task_plan_due (plan_id, due_at), INDEX idx_task_completion (plan_id, completed_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, title VARCHAR(160) NOT NULL, body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', read_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_unread (user_id, read_at, created_at)
) ENGINE=InnoDB;
