export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  }

  if (req.user.role !== "ADMIN") {
    return next({ status: 403, message: "Forbidden - Admin only" });
  }

  next();
};

export const requireUser = (req, res, next) => {
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized" });
  }

  next();
};
