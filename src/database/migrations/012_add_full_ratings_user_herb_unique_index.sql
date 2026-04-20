-- Add a full unique index for ratings by user and herb to support ON CONFLICT upserts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_herb_full
ON ratings(user_id, herb_id);
