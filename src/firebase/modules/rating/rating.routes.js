import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import {
  getAverageRating,
  getRatingsByHerb,
  rateRecommendation
} from "./rating.controller.js";

const router = express.Router();

router.post("/", firebaseAuthMiddleware, rateRecommendation);
router.get("/average/:herbId", getAverageRating);
router.get("/:herbId", getRatingsByHerb);

export default router;
