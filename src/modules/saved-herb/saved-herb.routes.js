import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  saveHerb,
  getSavedHerbs,
  removeSavedHerb
} from "./saved-herb.controller.js";

const router = express.Router();

router.post("/", authMiddleware, saveHerb);
router.get("/", authMiddleware, getSavedHerbs);
router.delete("/:herbId", authMiddleware, removeSavedHerb);

export default router;
