import {
  upsertTranslationService,
  getTranslationService,
  getAllTranslationsService,
  deleteTranslationService
} from "./translation.service.js";
import {
  normalizeLanguage,
  validateHerbId,
  validateTranslationId,
  validateUpsertTranslation
} from "./translation.validation.js";

export const upsertTranslation = async (req, res, next) => {
  try {
    const validation = validateUpsertTranslation(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const data = await upsertTranslationService(validation.value);

    res.status(200).json({
      success: true,
      message: "Translation saved",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getTranslation = async (req, res, next) => {
  try {
    const herbId = validateHerbId(req.params.herbId);
    const language = normalizeLanguage(req.params.language);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    if (!["EN", "AM", "OM"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "language must be one of EN, AM, OM"
      });
    }

    const data = await getTranslationService(herbId, language);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Translation not found"
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

export const getAllTranslations = async (req, res, next) => {
  try {
    const herbId = validateHerbId(req.params.herbId);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const data = await getAllTranslationsService(herbId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTranslation = async (req, res, next) => {
  try {
    const id = validateTranslationId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteTranslationService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Translation not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Translation deleted"
    });
  } catch (error) {
    next(error);
  }
};
