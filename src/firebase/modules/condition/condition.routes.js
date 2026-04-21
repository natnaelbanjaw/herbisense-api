import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  createCondition,
  deleteCondition,
  getConditionById,
  getConditions,
  updateCondition
} from "./condition.controller.js";

const router = express.Router();

router.get("/", getConditions);
router.get("/:id", getConditionById);
router.post("/", firebaseAuthMiddleware, createCondition);
router.patch("/:id", firebaseAuthMiddleware, updateCondition);
router.delete("/:id", firebaseAuthMiddleware, deleteCondition);

export default router;
