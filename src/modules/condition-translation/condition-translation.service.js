import pool from "../../database/db.js";

export const upsertConditionTranslationService = async ({
  conditionId,
  language,
  translated_name,
  translated_description
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO condition_translations
       (condition_id, language, translated_name, translated_description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (condition_id, language)
       DO UPDATE SET
         translated_name = EXCLUDED.translated_name,
         translated_description = EXCLUDED.translated_description,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [conditionId, language, translated_name, translated_description]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23503") {
      throw { status: 400, message: "Invalid conditionId" };
    }
    throw error;
  }
};

export const getConditionTranslationService = async (conditionId, language) => {
  const result = await pool.query(
    `SELECT
       ct.*,
       c.herb_id,
       h.name AS linked_herb_name
     FROM condition_translations ct
     JOIN conditions c ON ct.condition_id = c.id
     LEFT JOIN herbs h ON c.herb_id = h.id
     WHERE ct.condition_id = $1 AND ct.language = $2`,
    [conditionId, language]
  );

  return result.rows[0] || null;
};

export const getAllConditionTranslationsService = async (conditionId) => {
  const result = await pool.query(
    `SELECT
       ct.*,
       c.herb_id,
       h.name AS linked_herb_name
     FROM condition_translations ct
     JOIN conditions c ON ct.condition_id = c.id
     LEFT JOIN herbs h ON c.herb_id = h.id
     WHERE ct.condition_id = $1
     ORDER BY ct.language ASC`,
    [conditionId]
  );

  return result.rows;
};

export const deleteConditionTranslationService = async (id) => {
  const result = await pool.query(
    `DELETE FROM condition_translations
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
};
