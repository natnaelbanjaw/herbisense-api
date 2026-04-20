import pool from "../../database/db.js";

export const saveHerbService = async (userId, herbId) => {
  const result = await pool.query(
    `INSERT INTO saved_herbs (user_id, herb_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, herb_id) DO NOTHING
     RETURNING *`,
    [userId, herbId]
  );

  return result.rows[0] || null;
};

export const getSavedHerbsService = async (userId, language = 'EN') => {
  const result = await pool.query(
    `SELECT
       h.id,
       h.name,
       h.scientific_name,
       h.description,
       h.preparation,
       h.safety_warning,
       h.status,
       s.created_at AS saved_at,
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
     FROM saved_herbs s
     JOIN herbs h ON s.herb_id = h.id
     WHERE s.user_id = $1
       AND LOWER(COALESCE(h.status, '')) = 'published'
     ORDER BY s.created_at DESC`,
    [userId, language]
  );

  return result.rows;
};

export const removeSavedHerbService = async (userId, herbId) => {
  const result = await pool.query(
    `DELETE FROM saved_herbs
     WHERE user_id = $1 AND herb_id = $2
     RETURNING *`,
    [userId, herbId]
  );

  return result.rows[0] || null;
};
