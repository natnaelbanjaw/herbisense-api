import {
  createConditionService,
  deleteConditionService,
  getConditionByIdService,
  getConditionsService,
  updateConditionService
} from "../../services/condition.service.js";

export const createCondition = async (req, res, next) => {
  try {
    const data = await createConditionService(req.body || {});

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getConditions = async (req, res, next) => {
  try {
    const data = await getConditionsService();

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
    const data = await getConditionByIdService(req.params.id);

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
    const data = await updateConditionService(req.params.id, req.body || {});

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCondition = async (req, res, next) => {
  try {
    const data = await deleteConditionService(req.params.id);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
