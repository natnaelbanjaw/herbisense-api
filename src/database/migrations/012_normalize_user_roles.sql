-- Normalize role values so authorization checks work consistently.
UPDATE users
SET role = LOWER(role)
WHERE role IS NOT NULL
  AND role <> LOWER(role);

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'user';
