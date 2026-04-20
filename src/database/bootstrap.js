import bcrypt from "bcrypt";
import pool from "./db.js";
import env from "../config/env.js";

export const ensureSuperAdminExists = async () => {
  try {
    const adminEmail = "admin@herbisense.com";
    const adminPassword = "admin123";
    const role = "super_admin";

    // Check if super admin exists
   const existing = await pool.query(
  `SELECT id FROM users WHERE email = $1`,
  [adminEmail]
);

    if (existing.rows.length > 0) {
      console.log("✅ Super admin already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      adminPassword,
      parseInt(env.BCRYPT_SALT) || 10
    );

    // Insert admin
  await pool.query(
  `INSERT INTO users
   (full_name, email, password, role, is_verified)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (email) DO NOTHING`,
  [
    "System Admin",
    adminEmail,
    hashedPassword,
    role,
    true
  ]
);

    console.log("🔥 Initial Super Admin Created");

  } catch (error) {
    console.error("Failed to create super admin:", error);
  }
};