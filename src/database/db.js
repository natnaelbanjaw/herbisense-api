import pkg from "pg";
import env from "../config/env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl:{
    rejectUnauthorized:false,
  }
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database Connected");
    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

export default pool;
