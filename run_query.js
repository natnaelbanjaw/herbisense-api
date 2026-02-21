import pool from "./src/database/db.js";

async function runQuery() {
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();
    
    console.log("Checking if user exists: SELECT * FROM users WHERE email = 'admin@herbisense.com';");
    const checkResult = await client.query("SELECT * FROM users WHERE email = 'admin@herbisense.com';");
    
    if (checkResult.rows.length > 0) {
      console.log("User found. Executing DELETE query...");
      const deleteResult = await client.query("DELETE FROM users WHERE email = 'admin@herbisense.com';");
      console.log("Query executed successfully");
      console.log(`Rows affected: ${deleteResult.rowCount}`);
    } else {
      console.log("No user found with email 'admin@herbisense.com'");
    }
    
    console.log("\nAll users in database:");
    const allUsers = await client.query("SELECT id, full_name, email, role FROM users;");
    console.log(JSON.stringify(allUsers.rows, null, 2));
    
    client.release();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error executing query:", error.message);
  } finally {
    process.exit(0);
  }
}

runQuery();
