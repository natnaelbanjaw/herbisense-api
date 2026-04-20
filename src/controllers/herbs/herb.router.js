import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireRole, requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  createHerb,
  getHerbById,
  getPublishedHerbs,
  getUnPublishedHerbs,
  searchHerbs,
  updateHerb,
  deleteHerb,
  updateHerbStatus,
  getRecommendedHerbs
} from "./herb.controller.js";

const router = express.Router();

// Public
router.get("/published", getPublishedHerbs);
router.get("/search", searchHerbs);
router.get("/unpublished",
  authMiddleware,
  requireAnyRole("admin", "super_admin"),
  getUnPublishedHerbs,
);
router.get(
  "/recommended/me",
  authMiddleware,
  getRecommendedHerbs
);
router.get("/:id", getHerbById);

// Admin
router.post(
  "/create",
  authMiddleware,
  requireAnyRole("admin", "super_admin"),
  createHerb
);

// Update herb
router.put(
  "/update/:id",
  authMiddleware,
  requireRole("super_admin"),
  updateHerb
);

// Delete herb
router.delete(
  "/delete/:id",
  authMiddleware,
  requireRole("super_admin"),
  deleteHerb
);

// Update status
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("super_admin"),
  updateHerbStatus
);

export default router;
