ALTER TABLE language_translations
ADD COLUMN IF NOT EXISTS source TEXT;
