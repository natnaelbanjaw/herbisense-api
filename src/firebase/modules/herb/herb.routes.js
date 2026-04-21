import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  createHerb,
  deleteHerb,
  getHerbById,
  getHerbs,
  updateHerb
} from "./herb.controller.js";

const router = express.Router();

router.get("/", getHerbs);
router.get("/:id", getHerbById);
router.post("/", firebaseAuthMiddleware, createHerb);
router.patch("/:id", firebaseAuthMiddleware, updateHerb);
router.delete("/:id", firebaseAuthMiddleware, deleteHerb);

export default router;
