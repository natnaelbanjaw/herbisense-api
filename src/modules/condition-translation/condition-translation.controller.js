import {
  upsertConditionTranslationService,
  getConditionTranslationService,
  getAllConditionTranslationsService,
  deleteConditionTranslationService
} from "./condition-translation.service.js";
import {
  normalizeLanguage,
  validateConditionId,
  validateConditionTranslationId,
  validateUpsertConditionTranslation
} from "./condition-translation.validation.js";

export const upsertConditionTranslation = async (req, res, next) => {
  try {
    const validation = validateUpsertConditionTranslation(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const data = await upsertConditionTranslationService(validation.value);

    res.status(200).json({
      success: true,
      message: "Condition translation saved",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getConditionTranslation = async (req, res, next) => {
  try {
    const conditionId = validateConditionId(req.params.conditionId);
    const language = normalizeLanguage(req.params.language);

    if (!conditionId) {
      return res.status(400).json({
        success: false,
        message: "conditionId must be a positive integer"
      });
    }

    if (!["EN", "AM", "OM"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "language must be one of EN, AM, OM"
      });
    }

    const data = await getConditionTranslationService(conditionId, language);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Condition translation not found"
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

export const getAllConditionTranslations = async (req, res, next) => {
  try {
    const conditionId = validateConditionId(req.params.conditionId);

    if (!conditionId) {
      return res.status(400).json({
        success: false,
        message: "conditionId must be a positive integer"
      });
    }

    const data = await getAllConditionTranslationsService(conditionId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConditionTranslation = async (req, res, next) => {
  try {
    const id = validateConditionTranslationId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteConditionTranslationService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Condition translation not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Condition translation deleted"
    });
  } catch (error) {
    next(error);
  }
};
