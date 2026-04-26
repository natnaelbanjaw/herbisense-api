import pool from "../../database/db.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

export const createRuleService = async ({ conditionId, herbId, priority }) => {
  try {
    const result = await pool.query(
      `INSERT INTO recommendation_rules (condition_id, herb_id, priority)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conditionId, herbId, priority]
    );

    await invalidateLocalCache(["recommendations:"]);
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw {
        status: 409,
        message: "Recommendation rule already exists for this condition and herb"
      };
    }

    if (error.code === "23503") {
      throw {
        status: 400,
        message: "Invalid conditionId or herbId"
      };
    }

    throw error;
  }
};

export const getByConditionService = async (conditionId) => {
  return await withLocalCache(`recommendations:condition:${conditionId}`, async () => {
    const result = await pool.query(
      `SELECT
         h.id,
         h.name,
         h.scientific_name,
         h.description,
         h.preparation,
         h.safety_warning,
         h.status,
         r.priority
       FROM herbs h
       JOIN recommendation_rules r ON h.id = r.herb_id
       WHERE r.condition_id = $1
         AND TRIM(LOWER(COALESCE(h.status, ''))) = 'published'
       ORDER BY r.priority DESC NULLS LAST, h.name ASC`,
      [conditionId]
    );

    return result.rows;
  });
};

export const deleteRuleService = async (id) => {
  const result = await pool.query(
    `DELETE FROM recommendation_rules
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  await invalidateLocalCache(["recommendations:"]);
  return result.rows[0];
};
