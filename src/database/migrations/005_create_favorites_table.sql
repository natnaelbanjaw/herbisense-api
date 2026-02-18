-- Migration: Create Favorites Table
-- Created: 2026-02-18

-- Create favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    herb_id UUID REFERENCES herbs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on user_id and herb_id combination
ALTER TABLE favorites ADD CONSTRAINT unique_user_herb_favorite UNIQUE(user_id, herb_id);

-- Create index on user_id for faster lookups
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Create index on herb_id for faster lookups
CREATE INDEX idx_favorites_herb_id ON favorites(herb_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_favorites_updated_at 
    BEFORE UPDATE ON favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE favorites IS 'User favorites table for storing liked herbs';
COMMENT ON COLUMN favorites.id IS 'Unique identifier for the favorite record';
COMMENT ON COLUMN favorites.user_id IS 'Reference to the user who favorited the herb';
COMMENT ON COLUMN favorites.herb_id IS 'Reference to the herb that was favorited';
COMMENT ON COLUMN favorites.created_at IS 'Timestamp when favorite was created';