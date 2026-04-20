import pool from "../db.js";

// Insert or update rating (1 rating per user per herb)
export const upsertRatingQuery = async (userId, herbId, rating) => {
  const result = await pool.query(
    `INSERT INTO ratings (user_id, herb_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, herb_id)
     DO UPDATE SET rating = EXCLUDED.rating
     RETURNING *`,
    [userId, herbId, rating]
  );

  return result.rows[0];
};

// Get rating statistics for herb
export const getHerbRatingStatsQuery = async (herbId) => {
  const result = await pool.query(
    `SELECT 
        COUNT(*)::int AS count,
        COALESCE(AVG(rating), 0)::decimal(3,2) AS average
     FROM ratings
     WHERE herb_id = $1`,
    [herbId]
  );

  return result.rows[0];
};

// Update herb table rating fields
export const updateHerbRatingStatsQuery = async (herbId, average, count) => {
  await pool.query(
    `UPDATE herbs
     SET average_rating = $1,
         rating_count = $2
     WHERE id = $3`,
    [average, count, herbId]
  );
};

export const getHerbRatingSummaryQuery = async (herbId) => {
  const result = await pool.query(
    `SELECT average_rating, rating_count
     FROM herbs
     WHERE id = $1`,
    [herbId]
  );

  return result.rows[0];
};

export const getHerbRatingsQuery = async (herbId) => {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.created_at,
            u.id AS user_id,
            u.full_name
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.herb_id = $1
     ORDER BY r.created_at DESC`,
    [herbId]
  );

  return result.rows;
};

export const getUserRatingForHerbQuery = async (userId, herbId) => {
  const result = await pool.query(
    `SELECT rating
     FROM ratings
     WHERE user_id = $1 AND herb_id = $2`,
    [userId, herbId]
  );

  return result.rows[0];
};