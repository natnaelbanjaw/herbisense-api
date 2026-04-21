import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  createCondition,
  deleteCondition,
  getConditionById,
  getConditions,
  linkHerbToCondition,
  searchConditions,
  updateCondition
} from "./condition.controller.js";

const router = express.Router();

router.get("/search", searchConditions);
router.get("/", getConditions);
router.post("/", firebaseAuthMiddleware, createCondition);
router.post("/link", firebaseAuthMiddleware, linkHerbToCondition);
router.put("/:id", firebaseAuthMiddleware, updateCondition);
router.patch("/:id", firebaseAuthMiddleware, updateCondition);
router.delete("/:id", firebaseAuthMiddleware, deleteCondition);
router.get("/:id", getConditionById);

export default router;
