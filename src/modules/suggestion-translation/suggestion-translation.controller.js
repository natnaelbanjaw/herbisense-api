import {
  deleteSuggestionTranslationService,
  getAllSuggestionTranslationsService,
  getSuggestionTranslationService,
  upsertSuggestionTranslationService
} from "./suggestion-translation.service.js";
import {
  normalizeLanguage,
  validateSuggestionId,
  validateSuggestionTranslationId,
  validateUpsertSuggestionTranslation
} from "./suggestion-translation.validation.js";

export const upsertSuggestionTranslation = async (req, res, next) => {
  try {
    const validation = validateUpsertSuggestionTranslation(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const data = await upsertSuggestionTranslationService(validation.value);

    res.status(200).json({
      success: true,
      message: "Suggestion translation saved",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestionTranslation = async (req, res, next) => {
  try {
    const suggestionId = validateSuggestionId(req.params.suggestionId);
    const language = normalizeLanguage(req.params.language);

    if (!suggestionId) {
      return res.status(400).json({
        success: false,
        message: "suggestionId must be a positive integer"
      });
    }

    if (!["EN", "AM", "OM"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "language must be one of EN, AM, OM"
      });
    }

    const data = await getSuggestionTranslationService(suggestionId, language);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Suggestion translation not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSuggestionTranslations = async (req, res, next) => {
  try {
    const suggestionId = validateSuggestionId(req.params.suggestionId);

    if (!suggestionId) {
      return res.status(400).json({
        success: false,
        message: "suggestionId must be a positive integer"
      });
    }

    const data = await getAllSuggestionTranslationsService(suggestionId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSuggestionTranslation = async (req, res, next) => {
  try {
    const id = validateSuggestionTranslationId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteSuggestionTranslationService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Suggestion translation not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Suggestion translation deleted"
    });
  } catch (error) {
    next(error);
  }
};
