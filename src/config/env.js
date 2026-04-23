import dotenv from "dotenv";

dotenv.config();

// For Firebase, we don't need DATABASE_URL, JWT_SECRET, etc.
// Make these optional instead of required
const requiredEnvVars = [
  // Remove the PostgreSQL/MySQL requirements
  // "DATABASE_URL",
  // "JWT_SECRET", 
  // "JWT_EXPIRES_IN",
  // "BCRYPT_SALT"
];

// Only check for Firebase-specific required vars if you want
// For now, let's make everything optional since you have your own config
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Warning: ${key} is not set (not required for Firebase mode)`);
  }
});

const env = {
  PORT: process.env.PORT || "5001",
  
  // For Firebase, we don't need these - keep as placeholders
  DATABASE_URL: process.env.DATABASE_URL || "firebase://localhost:8080",
  DB_SCHEMA: process.env.DB_SCHEMA || "public",
  JWT_SECRET: process.env.JWT_SECRET || "firebase-jwt-placeholder",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  BCRYPT_SALT: parseInt(process.env.BCRYPT_SALT) || 10,
  
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "",
  
  // Firebase specific (from your .env)
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY,
};

export default env;