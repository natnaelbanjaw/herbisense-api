import fs from "fs/promises";
import path from "path";
import pool from "./db.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const createRecommendationRulesTable = async () => {
  try {
    console.log("🚀 Creating recommendation_rules table...");

    // Read the migration file
    const migrationFile = path.join(__dirname, "migrations/004_create_recommendation_rules_table.sql");
    const migrationSQL = await fs.readFile(migrationFile, "utf8");
    
    // Execute the migration
    const client = await pool.connect();
    await client.query(migrationSQL);
    client.release();

    console.log("✅ recommendation_rules table created successfully!");
    
  } catch (error) {
    console.error("❌ Table creation failed:", error.message);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRecommendationRulesTable();
}

export default createRecommendationRulesTable;