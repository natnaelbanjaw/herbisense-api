-- Migration: Create Conditions Table
-- Created: 2026-02-18

-- Drop table if it exists (for development)
DROP TABLE IF EXISTS conditions;

-- Create conditions table
CREATE TABLE conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX idx_conditions_name ON conditions(name);

-- Create index on status for filtering
CREATE INDEX idx_conditions_status ON conditions(status);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conditions_updated_at 
    BEFORE UPDATE ON conditions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE conditions IS 'Conditions table for storing medical conditions';
COMMENT ON COLUMN conditions.id IS 'Unique identifier for the condition';
COMMENT ON COLUMN conditions.name IS 'Condition name (max 150 characters)';
COMMENT ON COLUMN conditions.description IS 'Detailed description of the condition';
COMMENT ON COLUMN conditions.status IS 'Condition status (ACTIVE, INACTIVE, etc.)';
COMMENT ON COLUMN conditions.created_at IS 'Timestamp when condition was created';