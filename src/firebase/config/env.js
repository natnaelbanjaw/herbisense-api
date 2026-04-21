import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(
  __dirname,
  "../../../serviceAccountKey.json"
);
const hasServiceAccountFile = fs.existsSync(serviceAccountPath);
const hasServiceAccountJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

if (!hasServiceAccountFile && !hasServiceAccountJson) {
  const requiredEnvVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY"
  ];

  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required Firebase environment variable: ${key}`);
    }
  });
}

const env = {
  PORT: process.env.FIREBASE_PORT || process.env.PORT || "5002",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "",
  FIREBASE_SERVICE_ACCOUNT_PATH: serviceAccountPath,
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY
        .replace(/^"(.*)"$/s, "$1")
        .replace(/\\n/g, "\n")
    : "",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY || ""
};

export default env;
