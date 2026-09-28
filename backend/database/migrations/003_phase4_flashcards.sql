USE studymate;

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id CHAR(36) PRIMARY KEY, lesson_id CHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
  difficulty ENUM('easy','medium','hard','mixed') NOT NULL DEFAULT 'mixed', card_count INT UNSIGNED NOT NULL,
  source_version VARCHAR(64) NOT NULL, generation_key CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deck_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_deck_lesson (lesson_id), INDEX idx_deck_cache (generation_key)
) ENGINE=InnoDB;

ALTER TABLE flashcards ADD COLUMN deck_id CHAR(36) NULL AFTER id;
ALTER TABLE flashcards ADD INDEX idx_flashcard_deck (deck_id);
ALTER TABLE flashcards ADD CONSTRAINT fk_flashcard_deck FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE;
ALTER TABLE flashcards MODIFY deck_id CHAR(36) NOT NULL;
