import pool from "../../database/db.js";

export const upsertTranslationService = async ({
  herbId,
  language,
  translated_name,
  translated_uses,
  translated_preparation,
  translated_safety,
  source
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO language_translations
       (herb_id, language, translated_name, translated_uses, translated_preparation, translated_safety, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (herb_id, language)
       DO UPDATE SET
         translated_name = EXCLUDED.translated_name,
         translated_uses = EXCLUDED.translated_uses,
         translated_preparation = EXCLUDED.translated_preparation,
         translated_safety = EXCLUDED.translated_safety,
         source = EXCLUDED.source,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        herbId,
        language,
        translated_name,
        translated_uses,
        translated_preparation,
        translated_safety,
        source
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23503") {
      throw { status: 400, message: "Invalid herbId" };
    }
    throw error;
  }
};

export const getTranslationService = async (herbId, language) => {
  const result = await pool.query(
    `SELECT * FROM language_translations
     WHERE herb_id = $1 AND language = $2`,
    [herbId, language]
  );

  return result.rows[0] || null;
};

export const getAllTranslationsService = async (herbId) => {
  const result = await pool.query(
    `SELECT *
     FROM language_translations
     WHERE herb_id = $1
     ORDER BY language ASC`,
    [herbId]
  );

  return result.rows;
};

export const deleteTranslationService = async (id) => {
  const result = await pool.query(
    `DELETE FROM language_translations
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};
