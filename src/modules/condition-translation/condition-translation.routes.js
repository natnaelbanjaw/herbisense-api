import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  upsertConditionTranslation,
  getConditionTranslation,
  getAllConditionTranslations,
  deleteConditionTranslation
} from "./condition-translation.controller.js";

const router = express.Router();

// PUBLIC
router.get("/:conditionId/:language", getConditionTranslation);
router.get("/:conditionId", getAllConditionTranslations);

// ADMIN
router.post("/", authMiddleware, requireAnyRole("admin", "super_admin"), upsertConditionTranslation);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteConditionTranslation);

export default router;
