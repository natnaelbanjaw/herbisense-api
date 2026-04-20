import express from "express";
import { createAdmin } from "./admin.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.post(
  "/create-admin",
  authMiddleware,
  requireRole(ROLES.SUPER_ADMIN),
  createAdmin
);

export default router;
