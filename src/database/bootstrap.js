import bcrypt from "bcrypt";
import pool from "./db.js";
import env from "../config/env.js";

export const ensureSuperAdminExists = async () => {
  try {
    const adminEmail = "admin@herbisense.com";
    const adminPassword = "admin123";

    // Check if super admin exists
    const existing = await pool.query(
      `SELECT id FROM users 
       WHERE email = $1 AND is_super_admin = true`,
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      console.log("✅ Super admin already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      adminPassword,
      env.BCRYPT_SALT
    );

    // Insert admin
    await pool.query(
      `INSERT INTO users
       (full_name, email, password, role, is_super_admin)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        "System Admin",
        adminEmail,
        hashedPassword,
        "ADMIN",
        true
      ]
    );

    console.log("🔥 Initial Super Admin Created");

  } catch (error) {
    console.error("Failed to create super admin:", error);
  }
};