-- Create language translations table for multilingual herb content
CREATE TABLE IF NOT EXISTS language_translations (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    language VARCHAR(2) NOT NULL,
    translated_name VARCHAR(255) NOT NULL,
    translated_uses TEXT NOT NULL,
    translated_preparation TEXT NOT NULL,
    translated_safety TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE,
    CONSTRAINT chk_language_translations_language CHECK (language IN ('EN', 'AM', 'OM')),
    CONSTRAINT unique_translation UNIQUE (herb_id, language)
);

CREATE INDEX IF NOT EXISTS idx_language_translations_herb_id
ON language_translations(herb_id);

CREATE INDEX IF NOT EXISTS idx_language_translations_language
ON language_translations(language);
