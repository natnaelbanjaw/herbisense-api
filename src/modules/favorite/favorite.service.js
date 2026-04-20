import pool from "../../database/db.js";

export const addFavoriteService = async (userId, herbId) => {
  const result = await pool.query(
    `INSERT INTO favorites (user_id, herb_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, herb_id) DO NOTHING
     RETURNING *`,
    [userId, herbId]
  );

  return result.rows[0] || null;
};

export const getFavoritesService = async (userId, language = 'EN') => {
  const result = await pool.query(
    `SELECT
       h.id,
       h.name,
       h.scientific_name,
       h.description,
       h.preparation,
       h.safety_warning,
       h.status,
       f.created_at AS favorited_at,
       (
         SELECT hi.image_url
         FROM herb_images hi
         WHERE hi.herb_id = h.id
         ORDER BY hi.created_at DESC, hi.id DESC
         LIMIT 1
       ) AS image,
       CASE
         WHEN $2 != 'EN' THEN (
           SELECT json_build_object(
             'translated_name', lt.translated_name,
             'translated_uses', lt.translated_uses,
             'translated_preparation', lt.translated_preparation,
             'translated_safety', lt.translated_safety,
             'source', lt.source
           )
           FROM language_translations lt
           WHERE lt.herb_id = h.id AND lt.language = $2
         )
         ELSE NULL
       END AS translation
     FROM favorites f
     JOIN herbs h ON f.herb_id = h.id
     WHERE f.user_id = $1
       AND LOWER(COALESCE(h.status, '')) = 'published'
     ORDER BY f.created_at DESC`,
    [userId, language]
  );

  return result.rows;
};

export const removeFavoriteService = async (userId, herbId) => {
  const result = await pool.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND herb_id = $2
     RETURNING *`,
    [userId, herbId]
  );

  return result.rows[0] || null;
};
