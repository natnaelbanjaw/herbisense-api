import pkg from "pg";
import env from "../config/env.js";

const { Pool } = pkg;
const schemaInput = env.DB_SCHEMA || "public";
const schema = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaInput)
  ? schemaInput
  : "public";
const useCustomSchema = schema !== "public";
const searchPathOptions = useCustomSchema
  ? `-c search_path=${schema},public`
  : undefined;

const isUrlConnectionString =
  typeof env.DATABASE_URL === "string" &&
  /^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL);

const pgSslSetting = String(process.env.PGSSL || "").toLowerCase();
const useSsl =
  pgSslSetting === "true" ||
  (pgSslSetting !== "false" && process.env.NODE_ENV === "production");
const ssl = useSsl ? { require: true, rejectUnauthorized: false } : false;

const poolConfig = isUrlConnectionString
  ? {
      connectionString: env.DATABASE_URL,
      ssl,
      ...(searchPathOptions ? { options: searchPathOptions } : {})
    }
  : {
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "5432", 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || env.DATABASE_URL,
      ssl,
      ...(searchPathOptions ? { options: searchPathOptions } : {})
    };

const pool = new Pool(poolConfig);

// Prevent hard crashes when an idle PostgreSQL client emits an error event.
pool.on("error", (error) => {
  console.error("❌ Unexpected PostgreSQL pool error:", error);
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
