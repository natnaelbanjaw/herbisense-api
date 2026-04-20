export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};

export const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : role;
