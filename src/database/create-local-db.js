import dotenv from "dotenv";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Client } = pkg;

const isPostgresUrl = (value) =>
  typeof value === "string" && /^postgres(?:ql)?:\/\//i.test(value);

const quoteIdentifier = (name) => `"${String(name).replace(/"/g, "\"\"")}"`;

const getBaseConnection = () => {
  const connectionString = process.env.DATABASE_URL;
  if (isPostgresUrl(connectionString)) {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      user: decodeURIComponent(url.username || ""),
      password: decodeURIComponent(url.password || "")
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || ""
  };
};

const getTargetDatabase = () => {
  if (process.env.PGDATABASE) {
    return process.env.PGDATABASE;
  }

  if (isPostgresUrl(process.env.DATABASE_URL)) {
    const pathname = new URL(process.env.DATABASE_URL).pathname || "";
    return decodeURIComponent(pathname.replace(/^\//, "")) || "herbisense_db";
  }

  return process.env.DATABASE_URL || "herbisense_db";
};

const createLocalDatabase = async () => {
  const targetDb = getTargetDatabase();
  const adminDb = process.env.PGADMIN_DATABASE || "postgres";
  const connection = getBaseConnection();

  const client = new Client({
    ...connection,
    database: adminDb,
    ssl:
      process.env.NODE_ENV === "production"
        ? { require: true, rejectUnauthorized: false }
        : false
  });

  try {
    await client.connect();
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (exists.rowCount > 0) {
      console.log(`✅ Database "${targetDb}" already exists`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(targetDb)}`);
    console.log(`✅ Database "${targetDb}" created`);
  } catch (error) {
    console.error("❌ Failed to create local database:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

const isDirectRun =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  createLocalDatabase();
}

export default createLocalDatabase;
