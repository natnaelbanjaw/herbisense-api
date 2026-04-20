import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  createRecommendation,
  deleteRecommendation,
  getRecommendationsByCondition
} from "./recommendation.controller.js";

const router = express.Router();

// USER
router.get("/:conditionId", getRecommendationsByCondition);

// ADMIN
router.post("/", authMiddleware, requireAnyRole("admin", "super_admin"), createRecommendation);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteRecommendation);

export default router;
