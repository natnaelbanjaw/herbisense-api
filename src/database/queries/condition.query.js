import pool from "../db.js";

// Create condition
export const createConditionQuery = async (name, description) => {
  try {
    const result = await pool.query(
      `INSERT INTO conditions (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw { status: 409, message: "Condition name already exists" };
    }
    throw error;
  }
};

// Get all conditions
export const getAllConditionsQuery = async (language = 'EN') => {
  const result = await pool.query(
    `SELECT
       c.*,
       h.name AS linked_herb_name,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object('id', h2.id, 'name', h2.name)
             ORDER BY h2.name
           )
           FROM herbs h2
           WHERE (h2.condition_id = c.id
              OR EXISTS (
                SELECT 1
                FROM herb_conditions hc
                WHERE hc.herb_id = h2.id
                  AND hc.condition_id = c.id
              ))
              AND TRIM(LOWER(COALESCE(h2.status, ''))) = 'published'
         ),
         '[]'::json
       ) AS herbs
     FROM conditions c
     LEFT JOIN herbs h ON c.herb_id = h.id
     ORDER BY c.name ASC`
  );
  return result.rows;
};

export const getConditionByIdQuery = async (id, language = 'EN') => {
  const result = await pool.query(
    `SELECT
       c.*,
       h.name AS linked_herb_name,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object('id', h2.id, 'name', h2.name)
             ORDER BY h2.name
           )
           FROM herbs h2
           WHERE (h2.condition_id = c.id
              OR EXISTS (
                SELECT 1
                FROM herb_conditions hc
                WHERE hc.herb_id = h2.id
                  AND hc.condition_id = c.id
              ))
              AND TRIM(LOWER(COALESCE(h2.status, ''))) = 'published'
         ),
         '[]'::json
       ) AS herbs
     FROM conditions c
     LEFT JOIN herbs h ON c.herb_id = h.id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0];
};

export const updateConditionQuery = async (id, name, description) => {
  try {
    const result = await pool.query(
      `UPDATE conditions
       SET name = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw { status: 409, message: "Condition name already exists" };
    }
    throw error;
  }
};

export const countRecommendationRulesByConditionQuery = async (conditionId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM recommendation_rules
     WHERE condition_id = $1`,
    [conditionId]
  );
  return result.rows[0].count;
};

// Delete condition
export const deleteConditionQuery = async (id) => {
  const result = await pool.query(
    `DELETE FROM conditions WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// Link herb to condition
export const linkHerbToConditionQuery = async (herbId, conditionId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const herbUpdate = await client.query(
      `UPDATE herbs
       SET condition_id = $1
       WHERE id = $2
       RETURNING id, condition_id`,
      [conditionId, herbId]
    );

    if (!herbUpdate.rows[0]) {
      throw { status: 404, message: "Herb not found" };
    }

    const conditionUpdate = await client.query(
      `UPDATE conditions
       SET herb_id = $1
       WHERE id = $2
       RETURNING id, herb_id`,
      [herbId, conditionId]
    );

    if (!conditionUpdate.rows[0]) {
      throw { status: 404, message: "Condition not found" };
    }

    await client.query("COMMIT");

    return {
      herb_id: herbUpdate.rows[0].id,
      condition_id: herbUpdate.rows[0].condition_id
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

// Get herbs by condition
export const getHerbsByConditionQuery = async (
  conditionId,
  limit,
  offset
) => {
  const result = await pool.query(
    `SELECT DISTINCT h.*
     FROM herbs h
     LEFT JOIN herb_conditions hc
       ON hc.herb_id = h.id
     WHERE (
       h.condition_id = $1
       OR hc.condition_id = $1
     )
       AND LOWER(h.status) = 'published'
     ORDER BY h.average_rating DESC
     LIMIT $2 OFFSET $3`,
    [conditionId, limit, offset]
  );

  return result.rows;
};

export const countHerbsByConditionQuery = async (conditionId) => {
  const result = await pool.query(
    `SELECT COUNT(DISTINCT h.id)
     FROM herbs h
     LEFT JOIN herb_conditions hc
       ON hc.herb_id = h.id
     WHERE (
       h.condition_id = $1
       OR hc.condition_id = $1
     )
       AND LOWER(h.status) = 'published'`,
    [conditionId]
  );

  return parseInt(result.rows[0].count, 10);
};
