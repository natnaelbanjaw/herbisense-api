import pool from "./db.js";

const verifyDatabase = async () => {
  try {
    console.log("🔍 Verifying database structure...");

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    if (tableCheck.rows.length > 0) {
      console.log("✅ Users table exists");
    } else {
      console.log("❌ Users table not found");
      return;
    }

    // Check table structure
    const structureCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log("\n📋 Users table structure:");
    structureCheck.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });

    // Check indexes
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users'
    `);

    console.log("\n🔍 Indexes:");
    if (indexCheck.rows.length > 0) {
      indexCheck.rows.forEach(index => {
        console.log(`  - ${index.indexname}`);
      });
    } else {
      console.log("  No indexes found");
    }

    console.log("\n✅ Database verification completed successfully!");
    
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);
  }
};

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDatabase();
}

export default verifyDatabase;