import pool from "../db.js";
import { normalizeRole, ROLES } from "../../constants/roles.js";

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

export const createUser = async (
  fullName,
  email,
  hashedPassword,
  role = ROLES.USER
) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role`,
    [fullName, email, hashedPassword, normalizeRole(role)]
  );

  return result.rows[0];
};

export const updateUserPasswordQuery = async (userId, newPassword) => {
  const result = await pool.query(
    `UPDATE users
     SET password = $1
     WHERE id = $2
     RETURNING id, email, role`,
    [newPassword, userId]
  );

  return result.rows[0];
};
