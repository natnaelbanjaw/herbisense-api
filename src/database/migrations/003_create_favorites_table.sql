-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    herb_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, herb_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE
);

-- Create index on user_id for faster user queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Create index on herb_id for faster herb queries
CREATE INDEX IF NOT EXISTS idx_favorites_herb_id ON favorites(herb_id);