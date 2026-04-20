import pool from "../db.js";

const conditionsSelect = `
  COALESCE(
    (
      SELECT json_agg(condition_item ORDER BY condition_item->>'name')
      FROM (
        SELECT DISTINCT jsonb_build_object(
          'id', c2.id,
          'name', c2.name,
          'description', c2.description,
          'created_at', c2.created_at,
          'updated_at', c2.updated_at
        ) AS condition_item
        FROM conditions c2
        WHERE c2.id IN (
          SELECT hc.condition_id
          FROM herb_conditions hc
          WHERE hc.herb_id = h.id

          UNION

          SELECT h.condition_id
          WHERE h.condition_id IS NOT NULL
        )
      ) aggregated_conditions
    ),
    '[]'::json
  ) AS conditions
`;

// Create a new herb
export const createHerbQuery = async (
  name,
  scientificName,
  description,
  preparation,
  safetyWarning,
  source,
  createdBy,
  conditionId = null,
  db = pool
) => {
  const result = await db.query(
    `INSERT INTO herbs 
      (name, scientific_name, description, preparation, safety_warning, source, created_by, condition_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, scientificName, description, preparation, safetyWarning, source, createdBy, conditionId]
  );
  return result.rows[0];
};

// Find herb by name or scientific name
export const findHerbByNameOrScientificNameQuery = async (name, scientificName) => {
  const hasScientificName = Boolean(scientificName && scientificName.trim());
  const query = hasScientificName
    ? `SELECT * FROM herbs
       WHERE LOWER(name) = LOWER($1)
          OR LOWER(scientific_name) = LOWER($2)
       LIMIT 1`
    : `SELECT * FROM herbs
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`;

  const values = hasScientificName ? [name, scientificName] : [name];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get herb by id
export const getHerbByIdQuery = async (id, db = pool, publishedOnly = true) => {
  const result = await db.query(
    `SELECT
      h.*,
      CASE
        WHEN c.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
      END AS condition,
      ${conditionsSelect}
     FROM herbs h
     LEFT JOIN conditions c ON h.condition_id = c.id
     WHERE h.id = $1
       ${publishedOnly ? "AND LOWER(h.status) = 'published'" : ""}`,
    [id]
  );
  return result.rows[0];
};

// Update herb by id
export const updateHerbQuery = async (
  id,
  name,
  scientificName,
  description,
  preparation,
  safetyWarning,
  source,
  conditionId = null,
  db = pool
) => {
  const result = await db.query(
    `UPDATE herbs
     SET name = $1,
         scientific_name = $2,
         description = $3,
         preparation = $4,
         safety_warning = $5,
         source = $6,
         condition_id = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [name, scientificName, description, preparation, safetyWarning, source, conditionId, id]
  );
  return result.rows[0];
};

// Delete herb by id
export const deleteHerbQuery = async (id) => {
  await pool.query(`DELETE FROM herbs WHERE id = $1`, [id]);
};

// Update herb status by id
export const updateHerbStatusQuery = async (id, status) => {
  const result = await pool.query(
    `UPDATE herbs
     SET status = LOWER($1),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

export const replaceHerbConditionLinksQuery = async (
  herbId,
  conditionIds = [],
  db = pool
) => {
  await db.query(
    `DELETE FROM herb_conditions
     WHERE herb_id = $1`,
    [herbId]
  );

  if (!conditionIds.length) {
    return [];
  }

  const placeholders = conditionIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(", ");

  const result = await db.query(
    `INSERT INTO herb_conditions (herb_id, condition_id)
     VALUES ${placeholders}
     ON CONFLICT (herb_id, condition_id) DO NOTHING
     RETURNING *`,
    [herbId, ...conditionIds]
  );

  return result.rows;
};

// Get published herbs with pagination
export const getPublishedHerbsQuery = async (limit, offset) => {
  const result = await pool.query(
    `SELECT
      h.*,
      CASE
        WHEN c.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
      END AS condition,
      ${conditionsSelect}
     FROM herbs h
     LEFT JOIN conditions c ON h.condition_id = c.id
     WHERE LOWER(h.status) = 'published'
     ORDER BY h.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

// Count published herbs
export const countPublishedHerbsQuery = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM herbs
     WHERE LOWER(status) = 'published'`
  );
  return parseInt(result.rows[0].count, 10);
};

// Get pending herbs with pagination
export const getPendingHerbsQuery = async (limit, offset) => {
  const result = await pool.query(
    `SELECT
      h.*,
      CASE
        WHEN c.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
      END AS condition,
      ${conditionsSelect}
     FROM herbs h
     LEFT JOIN conditions c ON h.condition_id = c.id
     WHERE LOWER(h.status) = 'pending'
     ORDER BY h.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

// Count pending herbs
export const countPendingHerbsQuery = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM herbs
     WHERE LOWER(status) = 'pending'`
  );
  return parseInt(result.rows[0].count, 10);
};

// Search herbs with optional condition filter, pagination, sorting
export const searchHerbsQuery = async ({
  search,
  conditionId,
  limit,
  offset,
  sort = "created_at"
}) => {
  const allowedSortFields = new Set(["created_at", "updated_at", "name"]);
  const safeSort = allowedSortFields.has(sort) ? sort : "created_at";

  let query = `
    SELECT
      h.*,
      c.id AS condition_id,
      c.name AS condition_name,
      c.description AS condition_description,
      CASE
        WHEN c.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
      END AS condition,
      ${conditionsSelect}
    FROM herbs h
    LEFT JOIN conditions c
      ON h.condition_id = c.id
    WHERE LOWER(h.status) = 'published'
  `;

  const values = [];
  let index = 1;

  if (search) {
    query += ` AND (
      h.name ILIKE $${index}
      OR h.scientific_name ILIKE $${index}
      OR c.name ILIKE $${index}
      OR EXISTS (
        SELECT 1
        FROM language_translations lt
        WHERE lt.herb_id = h.id
          AND (
            lt.translated_name ILIKE $${index}
            OR lt.translated_uses ILIKE $${index}
            OR lt.translated_preparation ILIKE $${index}
            OR COALESCE(lt.translated_safety, '') ILIKE $${index}
          )
      )
      OR EXISTS (
        SELECT 1
        FROM condition_translations ct
        WHERE ct.condition_id = c.id
          AND (
            ct.translated_name ILIKE $${index}
            OR ct.translated_description ILIKE $${index}
          )
      )
      OR EXISTS (
        SELECT 1
        FROM herb_conditions hc2
        JOIN conditions c2 ON c2.id = hc2.condition_id
        WHERE hc2.herb_id = h.id
          AND c2.name ILIKE $${index}
      )
      OR EXISTS (
        SELECT 1
        FROM herb_conditions hc2
        JOIN condition_translations ct2 ON ct2.condition_id = hc2.condition_id
        WHERE hc2.herb_id = h.id
          AND (
            ct2.translated_name ILIKE $${index}
            OR ct2.translated_description ILIKE $${index}
          )
      )
    )`;
    values.push(`%${search}%`);
    index++;
  }

  if (conditionId) {
    query += ` AND (
      h.condition_id = $${index}
      OR EXISTS (
        SELECT 1
        FROM herb_conditions hc
        WHERE hc.herb_id = h.id
          AND hc.condition_id = $${index}
      )
    )`;
    values.push(conditionId);
    index++;
  }

  query += `
    ORDER BY h.${safeSort} DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
};

export const getRecommendedHerbsQuery = async (
  userId,
  limit,
  offset
) => {
  const result = await pool.query(
    `
    WITH user_conditions AS (
      SELECT hc.condition_id
      FROM favorites f
      JOIN herbs h ON f.herb_id = h.id
      JOIN herb_conditions hc ON hc.herb_id = h.id
      WHERE f.user_id = $1

      UNION

      SELECT h.condition_id
      FROM favorites f
      JOIN herbs h ON f.herb_id = h.id
      WHERE f.user_id = $1
        AND h.condition_id IS NOT NULL

      UNION

      SELECT hc.condition_id
      FROM ratings r
      JOIN herbs h ON r.herb_id = h.id
      JOIN herb_conditions hc ON hc.herb_id = h.id
      WHERE r.user_id = $1 AND COALESCE(r.rating_value, r.rating) >= 4

      UNION

      SELECT h.condition_id
      FROM ratings r
      JOIN herbs h ON r.herb_id = h.id
      WHERE r.user_id = $1 AND COALESCE(r.rating_value, r.rating) >= 4
        AND h.condition_id IS NOT NULL
    )

    SELECT DISTINCT
      h.*,
      CASE
        WHEN c.id IS NULL THEN NULL
        ELSE json_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
      END AS condition,
      ${conditionsSelect},
      (
        (COALESCE(h.average_rating, 0) * 2)
        + (COALESCE(h.rating_count, 0) * 0.5)
      ) AS score
    FROM herbs h
    LEFT JOIN conditions c ON h.condition_id = c.id
    WHERE EXISTS (
      SELECT 1
      FROM user_conditions uc
      WHERE uc.condition_id IN (
        SELECT hc.condition_id
        FROM herb_conditions hc
        WHERE hc.herb_id = h.id

        UNION

        SELECT h.condition_id
        WHERE h.condition_id IS NOT NULL
      )
    )
      AND TRIM(UPPER(COALESCE(h.status, ''))) = 'PUBLISHED'
      AND h.id NOT IN (
        SELECT herb_id FROM favorites WHERE user_id = $1
      )
    ORDER BY score DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  return result.rows;
};
