import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/role.middleware.js";

import {
  createHerb,
  getHerbs
} from "./herb.controller.js";

const router = express.Router();

// Public
router.get("/", getHerbs);

// Admin
router.post(
  "/",
  authMiddleware,
  requireAdmin,
  createHerb
);

export default router;
