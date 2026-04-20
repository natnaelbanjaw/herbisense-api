import pool from "../../database/db.js";

export const saveHerbImageService = async (herbId, imageUrl) => {
  try {
    const result = await pool.query(
      `INSERT INTO herb_images (herb_id, image_url)
       VALUES ($1, $2)
       RETURNING *`,
      [herbId, imageUrl]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === "23503") {
      throw { status: 400, message: "Invalid herbId" };
    }
    throw error;
  }
};
export const getHerbsService = async () => {
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
      ) AS conditions,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', hi.id,
            'herb_id', hi.herb_id,
            'image_url', hi.image_url,
            'created_at', hi.created_at,
            'updated_at', hi.updated_at
          )
        ) FILTER (WHERE hi.id IS NOT NULL),
        '[]'::json
      ) AS images
     FROM herbs h
     LEFT JOIN conditions c ON h.condition_id = c.id
     LEFT JOIN herb_images hi ON hi.herb_id = h.id
     GROUP BY h.id, c.id
     ORDER BY h.created_at DESC`
  );
  return result.rows;
};

export const getHerbImagesService = async (herbId) => {
  const result = await pool.query(
    `SELECT *
     FROM herb_images
     WHERE herb_id = $1
     ORDER BY created_at DESC`,
    [herbId]
  );
  return result.rows;
};

export const deleteImageService = async (id) => {
  const result = await pool.query(
    `DELETE FROM herb_images
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
