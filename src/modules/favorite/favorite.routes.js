import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from "./favorite.controller.js";

const router = express.Router();

router.post("/", authMiddleware, addFavorite);
router.get("/", authMiddleware, getFavorites);
router.delete("/:herbId", authMiddleware, removeFavorite);

export default router;
