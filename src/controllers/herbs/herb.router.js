import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/role.middleware.js";

import {
  createHerb,
  getHerbs,
  searchHerbs,
  updateHerb,
  deleteHerb,
  updateHerbStatus
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

router.get("/search", searchHerbs);

// Update herb
router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  updateHerb
);

// Delete herb
router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  deleteHerb
);

// Update status
router.patch(
  "/:id/status",
  authMiddleware,
  requireAdmin,
  updateHerbStatus
);

export default router;
