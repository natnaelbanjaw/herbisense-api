-- Migration: Create Ratings Table
-- Created: 2026-02-18

-- Create ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES recommendation_rules(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on user_id and recommendation_id combination
ALTER TABLE ratings ADD CONSTRAINT unique_user_recommendation_rating UNIQUE(user_id, recommendation_id);

-- Create index on user_id for faster lookups
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- Create index on recommendation_id for faster lookups
CREATE INDEX idx_ratings_recommendation_id ON ratings(recommendation_id);

-- Create index on rating for filtering and aggregation
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ratings_updated_at 
    BEFORE UPDATE ON ratings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ratings IS 'User ratings table for recommendation rules';
COMMENT ON COLUMN ratings.id IS 'Unique identifier for the rating record';
COMMENT ON COLUMN ratings.user_id IS 'Reference to the user who provided the rating';
COMMENT ON COLUMN ratings.recommendation_id IS 'Reference to the recommendation rule being rated';
COMMENT ON COLUMN ratings.rating IS 'Rating value (1-5 stars)';
COMMENT ON COLUMN ratings.created_at IS 'Timestamp when rating was created';