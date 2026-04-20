import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  rateRecommendation,
  getRatingsByHerb,
  getAverageRating
} from "./rating.controller.js";

const router = express.Router();

router.post("/", authMiddleware, rateRecommendation);
router.get("/average/:herbId", getAverageRating);
router.get("/:herbId", getRatingsByHerb);

export default router;
