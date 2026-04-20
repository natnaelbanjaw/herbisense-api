import pool from "../../database/db.js";

export const rateService = async (userId, herbId, ratingValue) => {
  try {
    const result = await pool.query(
      `INSERT INTO ratings (user_id, herb_id, rating_value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, herb_id)
       DO UPDATE SET
         rating_value = EXCLUDED.rating_value,
         created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, herbId, ratingValue]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23503") {
      throw { status: 400, message: "Invalid herbId" };
    }
    throw error;
  }
};

export const getRatingsByHerbService = async (herbId) => {
  const result = await pool.query(
    `SELECT
       r.id,
       r.rating_value,
       r.user_id,
       r.created_at,
       u.email
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.herb_id = $1
     ORDER BY r.created_at DESC`,
    [herbId]
  );

  return result.rows;
};

export const getAverageRatingService = async (herbId) => {
  const result = await pool.query(
    `SELECT
       COALESCE(AVG(rating_value), 0)::numeric(2,1) AS average_rating,
       COUNT(*)::int AS total_ratings
     FROM ratings
     WHERE herb_id = $1`,
    [herbId]
  );

  return result.rows[0];
};
