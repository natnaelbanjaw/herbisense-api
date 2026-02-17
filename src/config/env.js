import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "BCRYPT_SALT",
  "NODE_ENV"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  BCRYPT_SALT: parseInt(process.env.BCRYPT_SALT),
  NODE_ENV: process.env.NODE_ENV
};

export default env;
