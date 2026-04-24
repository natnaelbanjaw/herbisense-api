import {
  createSuggestionService,
  deleteSuggestionService,
  getAllSuggestionsService,
  getMySuggestionsService,
  getSuggestionByIdService
} from "./suggestion.service.js";
import {
  normalizeLanguage,
  validateCreateSuggestion,
  validateSuggestionId
} from "./suggestion.validation.js";

export const createSuggestion = async (req, res, next) => {
  try {
    const validation = validateCreateSuggestion(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "herb_image is required"
      });
    }

    const herbImage = `${req.protocol}://${req.get("host")}/uploads/herbs/${req.file.filename}`;
    const data = await createSuggestionService(validation.value, req.user, herbImage);

    res.status(201).json({
      success: true,
      message: "Suggestion submitted",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getMySuggestions = async (req, res, next) => {
  try {
    const language = normalizeLanguage(req.query.lang);
    const data = await getMySuggestionsService(req.user.id, language);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSuggestions = async (req, res, next) => {
  try {
    const language = normalizeLanguage(req.query.lang);
    const data = await getAllSuggestionsService(language);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestionById = async (req, res, next) => {
  try {
    const id = validateSuggestionId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const language = normalizeLanguage(req.query.lang);
    const data = await getSuggestionByIdService(id, req.user, language);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found"
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

export const deleteSuggestion = async (req, res, next) => {
  try {
    const id = validateSuggestionId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteSuggestionService(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Suggestion deleted"
    });
  } catch (error) {
    next(error);
  }
};
