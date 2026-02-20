import pool from "./src/database/db.js";

async function runQuery() {
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    
    console.log("Executing query: SELECT * FROM users WHERE email='admin@herbisense.com';");
    const result = await client.query("SELECT * FROM users WHERE email='admin@herbisense.com';");
    
    console.log("Query result:");
    console.log(JSON.stringify(result.rows, null, 2));
    
    client.release();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error executing query:", error.message);
  } finally {
    process.exit(0);
  }
}

runQuery();