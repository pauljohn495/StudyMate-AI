USE studymate;

CREATE TABLE IF NOT EXISTS summaries (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  summary_length ENUM('short','medium','detailed') NOT NULL, content LONGTEXT NOT NULL,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_summary_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_summary_lesson (lesson_id), INDEX idx_summary_cache (generation_key)
) ENGINE=InnoDB;
