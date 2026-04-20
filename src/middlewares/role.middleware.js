import { normalizeRole, ROLES } from "../constants/roles.js";

export const rolesHierarchy = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

/**
 * Middleware to require a minimum role
 * @param {string} requiredRole - The minimum role required to access the route
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next({ status: 401, message: "Unauthorized" });
    }

    const normalizedUserRole = normalizeRole(req.user.role);
    const normalizedRequiredRole = normalizeRole(requiredRole);
    const userRoleIndex = rolesHierarchy.indexOf(normalizedUserRole);
    const requiredRoleIndex = rolesHierarchy.indexOf(normalizedRequiredRole);

    if (userRoleIndex === -1) {
      return next({ status: 403, message: "Invalid role" });
    }

    if (userRoleIndex < requiredRoleIndex) {
      return next({
        status: 403,
        message: `Forbidden - Requires ${normalizedRequiredRole} role`
      });
    }

    next();
  };
};

/**
 * Middleware to require any authenticated user
 */
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  }
  next();
};

export const requireAnyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next({ status: 401, message: "Unauthorized" });
  const normalizedUserRole = normalizeRole(req.user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
  if (!normalizedAllowedRoles.includes(normalizedUserRole))
    return next({ status: 403, message: "Forbidden - Insufficient role" });
  next();
};
