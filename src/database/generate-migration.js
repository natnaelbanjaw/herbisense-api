import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

const toSnakeCase = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getNextMigrationNumber = async () => {
  const files = await fs.readdir(migrationsDir);
  const numbers = files
    .map((file) => {
      const match = file.match(/^(\d+)_.*\.sql$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0);

  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return String(next).padStart(3, "0");
};

const generateMigration = async () => {
  const rawName = process.argv[2];
  if (!rawName) {
    console.error("Usage: npm run migration:generate -- <migration_name>");
    process.exit(1);
  }

  const name = toSnakeCase(rawName);
  if (!name) {
    console.error("❌ Migration name must contain letters or numbers.");
    process.exit(1);
  }

  const migrationNumber = await getNextMigrationNumber();
  const fileName = `${migrationNumber}_${name}.sql`;
  const filePath = path.join(migrationsDir, fileName);
  const template = `-- ${name}
-- Write your SQL migration here.

`;

  try {
    await fs.writeFile(filePath, template, { flag: "wx" });
    console.log(`✅ Created migration: ${fileName}`);
  } catch (error) {
    console.error("❌ Failed to create migration file:", error.message);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  generateMigration();
}
