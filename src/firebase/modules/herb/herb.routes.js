import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  createHerb,
  deleteHerb,
  getHerbById,
  getHerbs,
  getPublishedHerbs,
  getRecommendedHerbs,
  getUnPublishedHerbs,
  searchHerbs,
  updateHerb
  ,
  updateHerbStatus
} from "./herb.controller.js";

const router = express.Router();

router.get("/published", getPublishedHerbs);
router.get("/search", searchHerbs);
router.get("/unpublished", firebaseAuthMiddleware, getUnPublishedHerbs);
router.get("/recommended/me", firebaseAuthMiddleware, getRecommendedHerbs);
router.get("/", getHerbs);
router.post("/", firebaseAuthMiddleware, createHerb);
router.post("/create", firebaseAuthMiddleware, createHerb);
router.put("/update/:id", firebaseAuthMiddleware, updateHerb);
router.patch("/:id", firebaseAuthMiddleware, updateHerb);
router.patch("/:id/status", firebaseAuthMiddleware, updateHerbStatus);
router.delete("/delete/:id", firebaseAuthMiddleware, deleteHerb);
router.delete("/:id", firebaseAuthMiddleware, deleteHerb);
router.get("/:id", getHerbById);

export default router;
