import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {  rateHerb } from "./rating.controller.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:herbId", rateHerb);

// Public routes
router.get("/:herbId/summary", 
  requireAnyRole("admin", "super_admin"),
  getHerbRatingSummary);
router.get("/:herbId", 
  requireAnyRole("admin", "super_admin"),
  
  getHerbRatings);

// Protected routes
router.post("/:herbId", rateHerb);
router.get("/:herbId/my", getMyRatingForHerb);


export default router;