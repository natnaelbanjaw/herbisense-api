import pool from "../db.js";

export const createHerbQuery = async (
  name,
  scientificName,
  description,
  preparation,
  safetyWarning,
  createdBy
) => {
  const result = await pool.query(
    `INSERT INTO herbs 
    (name, scientific_name, description, preparation, safety_warning, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [name, scientificName, description, preparation, safetyWarning, createdBy]
  );

  return result.rows[0];
};

export const getHerbByIdQuery = async (id) => {
  const result = await pool.query(
    `SELECT * FROM herbs WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

export const updateHerbQuery = async (
  id,
  name,
  scientificName,
  description,
  preparation,
  safetyWarning
) => {
  const result = await pool.query(
    `UPDATE herbs
     SET name = $1,
         scientific_name = $2,
         description = $3,
         preparation = $4,
         safety_warning = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [name, scientificName, description, preparation, safetyWarning, id]
  );

  return result.rows[0];
};


export const deleteHerbQuery = async (id) => {
  await pool.query(`DELETE FROM herbs WHERE id = $1`, [id]);
};

export const updateHerbStatusQuery = async (id, status) => {
  const result = await pool.query(
    `UPDATE herbs
     SET status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};


export const getPublishedHerbsQuery = async (limit, offset) => {
  const result = await pool.query(
    `SELECT * FROM herbs
     WHERE status = 'PUBLISHED'
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
};
