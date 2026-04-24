import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import upload from "../upload/upload.middleware.js";
import {
  createSuggestion,
  deleteSuggestion,
  getAllSuggestions,
  getMySuggestions,
  getSuggestionById
} from "./suggestion.controller.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("herb_image"), createSuggestion);
router.get("/mine", authMiddleware, getMySuggestions);
router.get("/:id", authMiddleware, getSuggestionById);
router.get("/", authMiddleware, requireAnyRole("admin", "super_admin"), getAllSuggestions);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteSuggestion);

export default router;
