import fs from "fs/promises";
import path from "path";
import pool from "./db.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const runMigration = async () => {
  try {
    console.log("🚀 Running database migrations...");

    // Read the migration file
    const migrationFile = path.join(__dirname, "migrations", "001_create_users_table.sql");
    const migrationSQL = await fs.readFile(migrationFile, "utf8");

    // Execute the migration
    const client = await pool.connect();
    await client.query(migrationSQL);
    client.release();

    console.log("✅ Migration completed successfully!");
    console.log("✅ Users table created in PostgreSQL database");
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export default runMigration;