import express from "express";
import { getRecommendedHerbs } from "./recommendation.controller.js";

const router = express.Router();

router.get("/recommended", getRecommendedHerbs);

export default router;
