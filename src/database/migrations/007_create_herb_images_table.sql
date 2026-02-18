-- Migration: Create Herb Images Table
-- Created: 2026-02-18

-- Create herb_images table
CREATE TABLE herb_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    herb_id UUID REFERENCES herbs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on herb_id for faster lookups
CREATE INDEX idx_herb_images_herb_id ON herb_images(herb_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_herb_images_updated_at 
    BEFORE UPDATE ON herb_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE herb_images IS 'Herb images table for storing image URLs associated with herbs';
COMMENT ON COLUMN herb_images.id IS 'Unique identifier for the herb image record';
COMMENT ON COLUMN herb_images.herb_id IS 'Reference to the herb this image belongs to';
COMMENT ON COLUMN herb_images.image_url IS 'URL of the herb image';
COMMENT ON COLUMN herb_images.created_at IS 'Timestamp when image record was created';