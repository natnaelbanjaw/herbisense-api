import pool from "../../database/db.js";

export const createFeedbackService = async (userId, name, email, message) => {
  try {
    const result = await pool.query(
      `INSERT INTO feedback (user_id, name, email, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, email, message]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getMyFeedbackService = async (userId) => {
  const result = await pool.query(
    `SELECT
       f.id,
       f.name,
       f.email,
       f.message,
       f.created_at
     FROM feedback f
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getAllFeedbackService = async () => {
  const result = await pool.query(
    `SELECT
       f.id,
       f.name,
       f.email,
       f.message,
       f.created_at,
       u.id AS user_id,
       u.email AS account_email
     FROM feedback f
     JOIN users u ON f.user_id = u.id
     ORDER BY f.created_at DESC`
  );

  return result.rows;
};

export const deleteFeedbackService = async (id) => {
  const result = await pool.query(
    `DELETE FROM feedback
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};
