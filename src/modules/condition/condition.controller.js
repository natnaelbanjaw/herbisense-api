import {
  createConditionService,
  getAllConditionsService,
  searchConditionsService,
  getConditionByIdService,
  updateConditionService,
  deleteConditionService,
  linkHerbToConditionService
} from "./condition.service.js";
import {
  validateCreateCondition,
  validateUpdateCondition
} from "./condition.validation.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createCondition = async (req, res, next) => {
  try {
    const validation = validateCreateCondition(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const language = req.query.lang ? String(req.query.lang).toUpperCase() : 'EN';
    const data = await createConditionService(validation.value, language);

    res.status(201).json({
      success: true,
      message: "Condition created successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAllConditions = async (req, res, next) => {
  try {
    const language = req.query.lang ? String(req.query.lang).toUpperCase() : 'EN';
    const data = await getAllConditionsService(language);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const searchConditions = async (req, res, next) => {
  try {
    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    if (!search) {
      return res.status(400).json({
        success: false,
        message: "search query is required"
      });
    }

    const language = req.query.lang ? String(req.query.lang).toUpperCase() : 'EN';
    const data = await searchConditionsService(search, language);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getConditionById = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const language = req.query.lang ? String(req.query.lang).toUpperCase() : 'EN';
    const data = await getConditionByIdService(id, language);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Condition not found"
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

export const updateCondition = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const validation = validateUpdateCondition(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const language = req.query.lang ? String(req.query.lang).toUpperCase() : 'EN';
    const updated = await updateConditionService(id, validation.value, language);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Condition not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Condition updated",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCondition = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteConditionService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Condition not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Condition deleted"
    });
  } catch (error) {
    next(error);
  }
};

export const linkHerbToCondition = async (req, res, next) => {
  try {
    const herbId = parseId(req.body?.herbId);
    const conditionId = parseId(req.body?.conditionId);

    if (!herbId || !conditionId) {
      return res.status(400).json({
        success: false,
        message: "herbId and conditionId must be positive integers"
      });
    }

    const data = await linkHerbToConditionService(herbId, conditionId);

    res.status(200).json({
      success: true,
      message: "Herb linked to condition",
      data
    });
  } catch (error) {
    next(error);
  }
};
