import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  upsertTranslation,
  getTranslation,
  getAllTranslations,
  deleteTranslation
} from "./translation.controller.js";

const router = express.Router();

// PUBLIC
router.get("/:herbId/:language", getTranslation);
router.get("/:herbId", getAllTranslations);

// ADMIN
router.post("/", authMiddleware, requireAnyRole("admin", "super_admin"), upsertTranslation);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteTranslation);

export default router;
