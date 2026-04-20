import pool from "../../database/db.js";
import { getHerbByIdQuery } from "../../database/queries/herb.query.js";

const getConditionDetailsQuery = async (id, language = 'EN', db = pool) => {
  const result = await db.query(
    `SELECT
       c.id,
       CASE
         WHEN $2 != 'EN' AND ct.translated_name IS NOT NULL THEN ct.translated_name
         ELSE c.name
       END AS name,
       CASE
         WHEN $2 != 'EN' AND ct.translated_description IS NOT NULL THEN ct.translated_description
         ELSE c.description
       END AS description,
       c.created_at,
       c.updated_at,
       c.herb_id,
       h.name AS linked_herb_name,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', h2.id,
               'name', h2.name,
               'scientific_name', h2.scientific_name,
               'description', h2.description,
               'preparation', h2.preparation,
               'safety_warning', h2.safety_warning,
               'source', h2.source,
               'status', h2.status,
               'average_rating', h2.average_rating,
               'rating_count', h2.rating_count,
               'image', (
                 SELECT hi.image_url
                 FROM herb_images hi
                 WHERE hi.herb_id = h2.id
                 ORDER BY hi.created_at DESC, hi.id DESC
                 LIMIT 1
               ),
               'translation', CASE
                 WHEN $2 != 'EN' THEN (
                   SELECT json_build_object(
                     'translated_name', lt.translated_name,
                     'translated_uses', lt.translated_uses,
                     'translated_preparation', lt.translated_preparation,
                     'translated_safety', lt.translated_safety,
                     'source', lt.source
                   )
                   FROM language_translations lt
                   WHERE lt.herb_id = h2.id AND lt.language = $2
                 )
                 ELSE NULL
               END
             )
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
     LEFT JOIN condition_translations ct ON c.id = ct.condition_id AND ct.language = $2
     LEFT JOIN herbs h ON c.herb_id = h.id
     WHERE c.id = $1`,
    [id, language]
  );

  return result.rows[0] ?? null;
};

const resolveHerbIds = async (herbIds) => {
  if (!Array.isArray(herbIds) || !herbIds.length) {
    return [];
  }

  const herbs = await Promise.all(
    herbIds.map((herbId) => getHerbByIdQuery(herbId))
  );
  const missingHerbIds = herbIds.filter((_, index) => !herbs[index]);

  if (missingHerbIds.length) {
    throw {
      status: 400,
      message: `herbIds do not exist: ${missingHerbIds.join(", ")}`
    };
  }

  return herbIds;
};

const replaceConditionHerbLinks = async (client, conditionId, herbIds = []) => {
  await client.query(
    `DELETE FROM herb_conditions
     WHERE condition_id = $1`,
    [conditionId]
  );

  if (!herbIds.length) {
    return [];
  }

  const placeholders = herbIds
    .map((_, index) => `($${index + 1}, $${herbIds.length + 1})`)
    .join(", ");

  const result = await client.query(
    `INSERT INTO herb_conditions (herb_id, condition_id)
     VALUES ${placeholders}
     ON CONFLICT (herb_id, condition_id) DO NOTHING
     RETURNING *`,
    [...herbIds, conditionId]
  );

  return result.rows;
};

const syncHerbAndConditionLink = async (client, herbId, conditionId) => {
  const herbUpdate = await client.query(
    `UPDATE herbs
     SET condition_id = $1
     WHERE id = $2
     RETURNING id, name, condition_id`,
    [conditionId, herbId]
  );

  if (!herbUpdate.rows[0]) {
    throw { status: 404, message: "Herb not found" };
  }

  const conditionUpdate = await client.query(
    `UPDATE conditions
     SET herb_id = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [herbId, conditionId]
  );

  if (!conditionUpdate.rows[0]) {
    throw { status: 404, message: "Condition not found" };
  }

  return {
    condition: {
      ...conditionUpdate.rows[0],
      linked_herb_name: herbUpdate.rows[0].name
    },
    herb: herbUpdate.rows[0]
  };
};

export const createConditionService = async (
  { name, description, herbIds },
  language = 'EN'
) => {
  const resolvedHerbIds = await resolveHerbIds(herbIds);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO conditions (name, description, herb_id)
       VALUES ($1, $2, NULL)
       RETURNING *`,
      [name, description]
    );

    const condition = result.rows[0];

    await replaceConditionHerbLinks(client, condition.id, resolvedHerbIds);

    await client.query("COMMIT");
    return await getConditionDetailsQuery(condition.id, language);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    if (error.code === "23505") {
      throw { status: 409, message: "Condition already exists" };
    }
    throw error;
  } finally {
    client.release();
  }
};

export const getAllConditionsService = async (language = 'EN') => {
  const result = await pool.query(
    `SELECT
       c.id,
       CASE
         WHEN $1 != 'EN' AND ct.translated_name IS NOT NULL THEN ct.translated_name
         ELSE c.name
       END AS name,
       CASE
         WHEN $1 != 'EN' AND ct.translated_description IS NOT NULL THEN ct.translated_description
         ELSE c.description
       END AS description,
       c.created_at,
       c.updated_at,
       c.herb_id,
       h.name AS linked_herb_name,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', h2.id,
               'name', h2.name,
               'scientific_name', h2.scientific_name,
               'description', h2.description,
               'preparation', h2.preparation,
               'safety_warning', h2.safety_warning,
               'source', h2.source,
               'status', h2.status,
               'average_rating', h2.average_rating,
               'rating_count', h2.rating_count,
               'image', (
                 SELECT hi.image_url
                 FROM herb_images hi
                 WHERE hi.herb_id = h2.id
                 ORDER BY hi.created_at DESC, hi.id DESC
                 LIMIT 1
               ),
               'translation', CASE
                 WHEN $1 != 'EN' THEN (
                   SELECT json_build_object(
                     'translated_name', lt.translated_name,
                     'translated_uses', lt.translated_uses,
                     'translated_preparation', lt.translated_preparation,
                     'translated_safety', lt.translated_safety,
                     'source', lt.source
                   )
                   FROM language_translations lt
                   WHERE lt.herb_id = h2.id AND lt.language = $1
                 )
                 ELSE NULL
               END
             )
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
     LEFT JOIN condition_translations ct ON c.id = ct.condition_id AND ct.language = $1
     LEFT JOIN herbs h ON c.herb_id = h.id
     ORDER BY c.name ASC`,
    [language]
  );
  return result.rows;
};

export const searchConditionsService = async (search, language = 'EN') => {
  const term = String(search ?? "").trim();
  const result = await pool.query(
    `SELECT
       c.id,
       CASE
         WHEN $2 != 'EN' AND ct.translated_name IS NOT NULL THEN ct.translated_name
         ELSE c.name
       END AS name,
       CASE
         WHEN $2 != 'EN' AND ct.translated_description IS NOT NULL THEN ct.translated_description
         ELSE c.description
       END AS description,
       c.created_at,
       c.updated_at,
       c.herb_id,
       h.name AS linked_herb_name,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', h2.id,
               'name', h2.name,
               'scientific_name', h2.scientific_name,
               'description', h2.description,
               'preparation', h2.preparation,
               'safety_warning', h2.safety_warning,
               'source', h2.source,
               'status', h2.status,
               'average_rating', h2.average_rating,
               'rating_count', h2.rating_count,
               'image', (
                 SELECT hi.image_url
                 FROM herb_images hi
                 WHERE hi.herb_id = h2.id
                 ORDER BY hi.created_at DESC, hi.id DESC
                 LIMIT 1
               ),
               'translation', CASE
                 WHEN $2 != 'EN' THEN (
                   SELECT json_build_object(
                     'translated_name', lt.translated_name,
                     'translated_uses', lt.translated_uses,
                     'translated_preparation', lt.translated_preparation,
                     'translated_safety', lt.translated_safety,
                     'source', lt.source
                   )
                   FROM language_translations lt
                   WHERE lt.herb_id = h2.id AND lt.language = $2
                 )
                 ELSE NULL
               END
             )
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
     LEFT JOIN condition_translations ct ON c.id = ct.condition_id AND ct.language = $2
     LEFT JOIN herbs h ON c.herb_id = h.id
     WHERE c.name ILIKE $1
        OR COALESCE(c.description, '') ILIKE $1
        OR EXISTS (
          SELECT 1
          FROM condition_translations ct
          WHERE ct.condition_id = c.id
            AND (
              ct.translated_name ILIKE $1
              OR ct.translated_description ILIKE $1
            )
        )
     ORDER BY c.name ASC`,
    [`%${term}%`, language]
  );
  return result.rows;
};

export const getConditionByIdService = async (id, language = 'EN') => {
  return await getConditionDetailsQuery(id, language);
};

export const updateConditionService = async (
  id,
  { name, description, herbIds, hasHerbIdsField },
  language = 'EN'
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE conditions
       SET name = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );

    const condition = result.rows[0];
    if (!condition) {
      await client.query("ROLLBACK");
      return null;
    }

    if (hasHerbIdsField) {
      const resolvedHerbIds = await resolveHerbIds(herbIds);
      await replaceConditionHerbLinks(client, id, resolvedHerbIds);
    }

    await client.query("COMMIT");
    return await getConditionDetailsQuery(id, language);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    if (error.code === "23505") {
      throw { status: 409, message: "Condition already exists" };
    }
    throw error;
  } finally {
    client.release();
  }
};

export const deleteConditionService = async (id) => {
  const check = await pool.query(
    `SELECT 1
     FROM recommendation_rules
     WHERE condition_id = $1
     LIMIT 1`,
    [id]
  );

  if (check.rowCount > 0) {
    throw {
      status: 409,
      message: "Cannot delete condition linked to recommendations"
    };
  }

  const result = await pool.query(
    `DELETE FROM conditions
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
};

export const linkHerbToConditionService = async (herbId, conditionId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const linked = await syncHerbAndConditionLink(client, herbId, conditionId);

    await client.query("COMMIT");

    return {
      herb_id: linked.herb.id,
      condition_id: linked.herb.condition_id
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
