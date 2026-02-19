-- Migration: Create Herbs Table
-- Created: 2026-02-18

-- Drop table if it exists (for development)
DROP TABLE IF EXISTS herbs;

-- Create herbs table
CREATE TABLE herbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    scientific_name VARCHAR(200),
    description TEXT,
    preparation TEXT,
    safety_warning TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT', 
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX idx_herbs_name ON herbs(name);

-- Create index on scientific_name for faster lookups
CREATE INDEX idx_herbs_scientific_name ON herbs(scientific_name);

-- Create index on status for filtering
CREATE INDEX idx_herbs_status ON herbs(status);

-- Create index on created_by for relationship queries
CREATE INDEX idx_herbs_created_by ON herbs(created_by);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_herbs_updated_at 
    BEFORE UPDATE ON herbs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE herbs IS 'Herbs table for storing medicinal herbs';
COMMENT ON COLUMN herbs.id IS 'Unique identifier for the herb';
COMMENT ON COLUMN herbs.name IS 'Herb common name (max 150 characters)';
COMMENT ON COLUMN herbs.scientific_name IS 'Scientific name of the herb (max 200 characters)';
COMMENT ON COLUMN herbs.description IS 'Detailed description of the herb';
COMMENT ON COLUMN herbs.preparation IS 'Preparation instructions for the herb';
COMMENT ON COLUMN herbs.safety_warning IS 'Safety warnings and precautions';
COMMENT ON COLUMN herbs.status IS 'Herb status (DRAFT, ACTIVE, INACTIVE, etc.)';
COMMENT ON COLUMN herbs.created_by IS 'User who created this herb record';
COMMENT ON COLUMN herbs.created_at IS 'Timestamp when herb was created';
COMMENT ON COLUMN herbs.updated_at IS 'Timestamp when herb was last updated';