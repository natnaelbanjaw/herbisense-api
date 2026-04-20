import pool from "../db.js";

export const addFavoriteQuery = async (userId, herbId) => {
  const result = await pool.query(
    `INSERT INTO favorites (user_id, herb_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, herbId]
  );

  return result.rows[0];
};

export const removeFavoriteQuery = async (userId, herbId) => {
  await pool.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND herb_id = $2`,
    [userId, herbId]
  );
};

export const getUserFavoritesQuery = async (userId) => {
  const result = await pool.query(
    `SELECT h.*
     FROM favorites f
     JOIN herbs h ON f.herb_id = h.id
     WHERE f.user_id = $1`,
    [userId]
  );

  return result.rows;
};