-- Create saved_herbs table
CREATE TABLE IF NOT EXISTS saved_herbs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    herb_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, herb_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_herbs_user_id ON saved_herbs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_herbs_herb_id ON saved_herbs(herb_id);
