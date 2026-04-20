import {
  createRuleService,
  deleteRuleService,
  getByConditionService
} from "./recommendation.service.js";
import { validateCreateRecommendation } from "./recommendation.validation.js";

export const createRecommendation = async (req, res, next) => {
  try {
    const validation = validateCreateRecommendation(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const data = await createRuleService(validation.value);

    res.status(201).json({
      success: true,
      message: "Recommendation rule created",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendationsByCondition = async (req, res, next) => {
  try {
    const conditionId = Number(req.params.conditionId);

    if (!Number.isInteger(conditionId) || conditionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "conditionId must be a positive integer"
      });
    }

    const data = await getByConditionService(conditionId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecommendation = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteRuleService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Rule not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Rule deleted"
    });
  } catch (error) {
    next(error);
  }
};
