-- Update feedback schema: remove herb linkage and store contact fields
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS name VARCHAR(120);

ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE feedback
DROP COLUMN IF EXISTS herb_id CASCADE;

UPDATE feedback
SET name = COALESCE(NULLIF(TRIM(name), ''), 'Anonymous'),
    email = COALESCE(NULLIF(TRIM(email), ''), 'unknown@example.com');

ALTER TABLE feedback
ALTER COLUMN name SET NOT NULL;

ALTER TABLE feedback
ALTER COLUMN email SET NOT NULL;

DROP INDEX IF EXISTS idx_feedback_herb_id;
CREATE INDEX IF NOT EXISTS idx_feedback_email ON feedback(email);
