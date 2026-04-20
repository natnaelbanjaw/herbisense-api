import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  addFavorite,
  removeFavorite,
  getFavorites
} from "./favorite.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", addFavorite);
router.delete("/:herbId", removeFavorite);
router.get("/get", getFavorites);

export default router;