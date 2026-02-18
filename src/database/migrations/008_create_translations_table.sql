-- Migration: Create Translations Table
-- Created: 2026-02-18

-- Create translations table
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,  -- 'HERB', 'CONDITION'
    entity_id UUID NOT NULL,
    language VARCHAR(10) NOT NULL,     -- EN, AM, OM
    field_name VARCHAR(100) NOT NULL,  -- name, description, etc
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on entity_type and entity_id for faster lookups
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);

-- Create index on language for filtering
CREATE INDEX idx_translations_language ON translations(language);

-- Create index on field_name for filtering
CREATE INDEX idx_translations_field_name ON translations(field_name);

-- Create composite index for common queries
CREATE INDEX idx_translations_entity_language ON translations(entity_type, entity_id, language);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_translations_updated_at 
    BEFORE UPDATE ON translations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE translations IS 'Translations table for storing translated content';
COMMENT ON COLUMN translations.id IS 'Unique identifier for the translation record';
COMMENT ON COLUMN translations.entity_type IS 'Type of entity being translated (HERB, CONDITION)';
COMMENT ON COLUMN translations.entity_id IS 'ID of the entity being translated';
COMMENT ON COLUMN translations.language IS 'Language code (EN, AM, OM)';
COMMENT ON COLUMN translations.field_name IS 'Name of the field being translated';
COMMENT ON COLUMN translations.translated_text IS 'Translated text content';
COMMENT ON COLUMN translations.created_at IS 'Timestamp when translation was created';