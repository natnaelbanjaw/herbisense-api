import pool from "../db.js";

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

export const createUser = async (fullName, email, hashedPassword) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email, role`,
    [fullName, email, hashedPassword]
  );

  return result.rows[0];
};
