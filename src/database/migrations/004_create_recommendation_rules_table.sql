-- Migration: Create Recommendation Rules Table
-- Created: 2026-02-18

-- Create recommendation_rules table
CREATE TABLE recommendation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    herb_id UUID REFERENCES herbs(id) ON DELETE CASCADE,
    condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on herb_id for faster lookups
CREATE INDEX idx_recommendation_rules_herb_id ON recommendation_rules(herb_id);

-- Create index on condition_id for faster lookups
CREATE INDEX idx_recommendation_rules_condition_id ON recommendation_rules(condition_id);

-- Create composite index for common queries
CREATE INDEX idx_recommendation_rules_herb_condition ON recommendation_rules(herb_id, condition_id);

-- Create index on priority for ordering
CREATE INDEX idx_recommendation_rules_priority ON recommendation_rules(priority);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recommendation_rules_updated_at 
    BEFORE UPDATE ON recommendation_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE recommendation_rules IS 'Recommendation rules linking herbs to conditions';
COMMENT ON COLUMN recommendation_rules.id IS 'Unique identifier for the recommendation rule';
COMMENT ON COLUMN recommendation_rules.herb_id IS 'Reference to the herb being recommended';
COMMENT ON COLUMN recommendation_rules.condition_id IS 'Reference to the condition being treated';
COMMENT ON COLUMN recommendation_rules.priority IS 'Priority level for this recommendation (higher = more important)';
COMMENT ON COLUMN recommendation_rules.explanation IS 'Explanation for why this herb is recommended for this condition';
COMMENT ON COLUMN recommendation_rules.created_at IS 'Timestamp when recommendation rule was created';