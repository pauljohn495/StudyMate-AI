USE studymate;

ALTER TABLE quizzes ADD COLUMN question_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER difficulty;
ALTER TABLE quizzes ADD COLUMN source_version VARCHAR(64) NOT NULL DEFAULT '' AFTER question_count;
ALTER TABLE quizzes ADD COLUMN generation_key CHAR(64) NOT NULL DEFAULT '' AFTER source_version;
ALTER TABLE quizzes ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
ALTER TABLE quizzes ADD INDEX idx_quiz_cache (generation_key);
