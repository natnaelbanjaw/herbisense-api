import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAdmin, requireSuperAdmin } from "../../middlewares/role.middleware.js";

import {
  createHerb,
  getPublishedHerbs,
  getUnPublishedHerbs,
  searchHerbs,
  updateHerb,
  deleteHerb,
  updateHerbStatus
} from "./herb.controller.js";

const router = express.Router();

// Public
router.get("/published", getPublishedHerbs);

router.get("/unpublished", getUnPublishedHerbs,
  authMiddleware,
  requireAdmin,
);

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
  requireSuperAdmin,
  updateHerb
);

// Delete herb
router.delete(
  "/:id",
  authMiddleware,
  requireSuperAdmin,
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
