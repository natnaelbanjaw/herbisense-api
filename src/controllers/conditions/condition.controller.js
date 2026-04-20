import {
  createConditionService,
  getAllConditionsService,
  getConditionByIdService,
  updateConditionService,
  deleteConditionService,
  linkHerbToConditionService,
  getHerbsByConditionService
} from "../../services/condition.services.js";

// Admin create condition
export const createCondition = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "name is required"
      });
    }

    const condition = await createConditionService(
      String(name).trim(),
      description ?? null
    );

    res.status(201).json({
      success: true,
      data: condition
    });

  } catch (error) {
    next(error);
  }
};

// Public get all conditions
export const getAllConditions = async (req, res, next) => {
  try {
    const conditions = await getAllConditionsService();

    res.status(200).json({
      success: true,
      data: conditions
    });

  } catch (error) {
    next(error);
  }
};

// Public get one condition
export const getConditionById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const condition = await getConditionByIdService(id);

    res.status(200).json({
      success: true,
      data: condition
    });
  } catch (error) {
    next(error);
  }
};

// Admin update condition
export const updateCondition = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "name is required"
      });
    }

    const updated = await updateConditionService(
      id,
      String(name).trim(),
      description ?? null
    );

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Admin delete condition
export const deleteCondition = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    await deleteConditionService(id);

    res.status(200).json({
      success: true,
      message: "Condition deleted"
    });

  } catch (error) {
    next(error);
  }
};

// Admin link herb to condition
export const linkHerbToCondition = async (req, res, next) => {
  try {
    const { herbId, conditionId } = req.body;

    const result = await linkHerbToConditionService(herbId, conditionId);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// Public get herbs by condition
export const getHerbsByCondition = async (req, res, next) => {
  try {
    const { conditionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getHerbsByConditionService(
      conditionId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      pagination: result.pagination,
      data: result.herbs
    });

  } catch (error) {
    next(error);
  }
};
