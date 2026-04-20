import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  createCondition,
  getAllConditions,
  getConditionById,
  updateCondition,
  deleteCondition,
  linkHerbToCondition,
  getHerbsByCondition
} from "./condition.controller.js";

const router = express.Router();

// Public
router.get("/", getAllConditions);
router.get("/getSkinCondition", getAllConditions);
router.get("/:conditionId/herbs", getHerbsByCondition);
router.get("/:id", getConditionById);

// Admin only
router.use(authMiddleware);
router.use(requireAnyRole("admin", "super_admin"));

router.post("/", createCondition);
router.put("/:id", updateCondition);
router.delete("/:id", deleteCondition);
router.post("/createSkinCondition", createCondition);
router.delete("/delete/:id", deleteCondition);
router.post("/link", linkHerbToCondition);

export default router;
