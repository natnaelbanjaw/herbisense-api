import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaInput = process.env.DB_SCHEMA || "public";
const schema = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaInput)
  ? schemaInput
  : "public";

const runMigration = async () => {
  let client;
  try {
    console.log("🚀 Running database migrations...");

    // Get all migration files
    const migrationDir = path.join(__dirname, "migrations");
    const files = await fs.readdir(migrationDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => path.join(migrationDir, file));

    // Execute each migration
    client = await pool.connect();
    await client.query("BEGIN");
    if (schema !== "public") {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      await client.query(`SET search_path TO ${schema}, public`);
    }
    
    for (const migrationFile of migrationFiles) {
      console.log(`📝 Running migration: ${path.basename(migrationFile)}`);
      const migrationSQL = await fs.readFile(migrationFile, "utf8");
      await client.query(migrationSQL);
    }

    await client.query("COMMIT");
    
    client.release();
    client = null;

    console.log("✅ All migrations completed successfully!");
    console.log(`✅ Created ${migrationFiles.length} tables in PostgreSQL database`);
    
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
      client.release();
    }
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

// Run migration if this file is executed directly.
const isDirectRun =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runMigration();
}

export default runMigration;
