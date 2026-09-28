USE studymate;

ALTER TABLE study_plans
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE study_plan_lessons (
  plan_id CHAR(36) NOT NULL,
  lesson_id CHAR(36) NOT NULL,
  PRIMARY KEY (plan_id, lesson_id),
  CONSTRAINT fk_plan_lesson_plan FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_lesson_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE study_tasks
  ADD COLUMN task_type ENUM('review','flashcards','quiz','tutor','practice_exam') NOT NULL DEFAULT 'review' AFTER title,
  ADD COLUMN rationale VARCHAR(500) NOT NULL DEFAULT 'Scheduled from lesson progress.' AFTER task_type,
  ADD COLUMN estimated_minutes INT UNSIGNED NOT NULL DEFAULT 25 AFTER rationale,
  ADD COLUMN position INT UNSIGNED NOT NULL DEFAULT 0 AFTER priority,
  ADD INDEX idx_task_completion (plan_id, completed_at);
