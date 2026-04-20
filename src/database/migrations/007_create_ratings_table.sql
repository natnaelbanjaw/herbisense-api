-- Create ratings table with support for recommendation-rule ratings.
-- Includes optional herb-rating columns for compatibility with legacy queries.
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    herb_id INTEGER,
    rule_id INTEGER,
    rating INTEGER,
    rating_value NUMERIC(2,1),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id) ON DELETE CASCADE
);

-- Ensure one rating per user per herb (legacy flow)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_herb
ON ratings(user_id, herb_id)
WHERE herb_id IS NOT NULL;

-- Ensure a full unique index for user/herb upsert support.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_herb_full
ON ratings(user_id, herb_id);

-- Ensure one rating per user per recommendation rule (new flow)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_rule
ON ratings(user_id, rule_id)
WHERE rule_id IS NOT NULL;

-- Helpful read indexes
CREATE INDEX IF NOT EXISTS idx_ratings_rule_id ON ratings(rule_id);
CREATE INDEX IF NOT EXISTS idx_ratings_herb_id ON ratings(herb_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
