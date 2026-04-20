import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  createCondition,
  getAllConditions,
  searchConditions,
  getConditionById,
  updateCondition,
  deleteCondition,
  linkHerbToCondition
} from "./condition.controller.js";

const router = express.Router();

// PUBLIC
router.get("/", getAllConditions);
router.get("/search", searchConditions);
router.get("/:id", getConditionById);

// ADMIN
router.post("/", authMiddleware, requireAnyRole("admin", "super_admin"), createCondition);
router.put("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), updateCondition);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteCondition);
router.post("/link", authMiddleware, requireAnyRole("admin", "super_admin"), linkHerbToCondition);

export default router;
