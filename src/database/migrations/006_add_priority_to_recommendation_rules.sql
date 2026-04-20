-- Add priority column to recommendation rules
ALTER TABLE recommendation_rules
ADD COLUMN IF NOT EXISTS priority INTEGER;
