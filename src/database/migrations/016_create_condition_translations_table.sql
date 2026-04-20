-- Create condition translations table for multilingual condition content
CREATE TABLE IF NOT EXISTS condition_translations (
    id SERIAL PRIMARY KEY,
    condition_id INTEGER NOT NULL,
    language VARCHAR(2) NOT NULL,
    translated_name VARCHAR(255) NOT NULL,
    translated_description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    CONSTRAINT chk_condition_translations_language CHECK (language IN ('EN', 'AM', 'OM')),
    CONSTRAINT unique_condition_translation UNIQUE (condition_id, language)
);

CREATE INDEX IF NOT EXISTS idx_condition_translations_condition_id
ON condition_translations(condition_id);

CREATE INDEX IF NOT EXISTS idx_condition_translations_language
ON condition_translations(language);
