import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  deleteFeedback
} from "./feedback.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createFeedback);
router.get("/mine", authMiddleware, getMyFeedback);
router.get("/", authMiddleware, requireAnyRole("admin", "super_admin"), getAllFeedback);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteFeedback);

export default router;
