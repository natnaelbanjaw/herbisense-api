import pkg from "pg";
import env from "../config/env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false // This allows self-signed certificates
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
