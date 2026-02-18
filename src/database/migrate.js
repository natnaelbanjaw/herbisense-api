import fs from "fs/promises";
import path from "path";
import pool from "./db.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const runMigration = async () => {
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
    const client = await pool.connect();
    
    for (const migrationFile of migrationFiles) {
      console.log(`📝 Running migration: ${path.basename(migrationFile)}`);
      const migrationSQL = await fs.readFile(migrationFile, "utf8");
      await client.query(migrationSQL);
    }
    
    client.release();

    console.log("✅ All migrations completed successfully!");
    console.log(`✅ Created ${migrationFiles.length} tables in PostgreSQL database`);
    
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