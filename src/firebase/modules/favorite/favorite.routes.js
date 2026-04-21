import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  addFavorite,
  getFavorites,
  removeFavorite
} from "./favorite.controller.js";

const router = express.Router();

router.post("/", firebaseAuthMiddleware, addFavorite);
router.get("/", firebaseAuthMiddleware, getFavorites);
router.delete("/:herbId", firebaseAuthMiddleware, removeFavorite);

export default router;
