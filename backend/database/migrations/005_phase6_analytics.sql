USE studymate;

ALTER TABLE flashcard_reviews ADD INDEX idx_review_user_date (user_id, reviewed_at);
