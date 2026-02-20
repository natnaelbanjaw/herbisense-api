import bcrypt from "bcrypt";
import pool from "./db.js";
import env from "../config/env.js";

const createAdmin = async () => {
  const email = "admin@herbisense.com";
  const password = "admin123";

  const existing = await pool.query(
  `INSERT INTO users (full_name, email, password, role, is_super_admin)
   VALUES ($1, $2, $3, $4, $5)`,
  ["System Admin", email, hashedPassword, "ADMIN", true]
);

  if (existing.rows.length > 0) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT);

  await pool.query(
    `INSERT INTO users (full_name, email, password, role)
     VALUES ($1, $2, $3, $4)`,
    ["System Admin", email, hashedPassword, "ADMIN"]
  );

  console.log("✅ Admin created successfully");
};

createAdmin();