import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";
import {
  deleteSuggestionTranslation,
  getAllSuggestionTranslations,
  getSuggestionTranslation,
  upsertSuggestionTranslation
} from "./suggestion-translation.controller.js";

const router = express.Router();

router.use(authMiddleware, requireAnyRole("admin", "super_admin"));
router.post("/", upsertSuggestionTranslation);
router.get("/:suggestionId/:language", getSuggestionTranslation);
router.get("/:suggestionId", getAllSuggestionTranslations);
router.delete("/:id", deleteSuggestionTranslation);

export default router;
