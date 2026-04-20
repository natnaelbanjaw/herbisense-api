-- Create recommendation_rules table
CREATE TABLE IF NOT EXISTS recommendation_rules (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    condition_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
    UNIQUE(herb_id, condition_id)
);

-- Create index on herb_id for faster herb queries
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_herb_id ON recommendation_rules(herb_id);

-- Create index on condition_id for faster condition queries
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_condition_id ON recommendation_rules(condition_id);