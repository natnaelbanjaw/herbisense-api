-- Create herbs table
CREATE TABLE IF NOT EXISTS herbs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT,
    preparation TEXT,
    safety_warning TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_herbs_name ON herbs(name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_herbs_status ON herbs(status);

-- Create index on created_by for user queries
CREATE INDEX IF NOT EXISTS idx_herbs_created_by ON herbs(created_by);