import {
  createConditionQuery,
  getAllConditionsQuery,
  getConditionByIdQuery,
  updateConditionQuery,
  countRecommendationRulesByConditionQuery,
  deleteConditionQuery,
  linkHerbToConditionQuery,
  getHerbsByConditionQuery,
  countHerbsByConditionQuery
} from "../database/queries/condition.query.js";

export const createConditionService = async (name, description) => {
  return await createConditionQuery(name, description);
};

export const getAllConditionsService = async () => {
  return await getAllConditionsQuery();
};

export const getConditionByIdService = async (id) => {
  const condition = await getConditionByIdQuery(id);
  if (!condition) {
    throw { status: 404, message: "Condition not found" };
  }
  return condition;
};

export const updateConditionService = async (id, name, description) => {
  const existing = await getConditionByIdQuery(id);
  if (!existing) {
    throw { status: 404, message: "Condition not found" };
  }

  const updated = await updateConditionQuery(id, name, description);
  return updated;
};

export const deleteConditionService = async (id) => {
  const existing = await getConditionByIdQuery(id);
  if (!existing) {
    throw { status: 404, message: "Condition not found" };
  }

  const linkedRules = await countRecommendationRulesByConditionQuery(id);
  if (linkedRules > 0) {
    throw {
      status: 409,
      message: "Cannot delete condition because recommendation rules reference it"
    };
  }

  await deleteConditionQuery(id);
};

export const linkHerbToConditionService = async (herbId, conditionId) => {
  return await linkHerbToConditionQuery(herbId, conditionId);
};

export const getHerbsByConditionService = async (
  conditionId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  const herbs = await getHerbsByConditionQuery(
    conditionId,
    limit,
    offset
  );

  const total = await countHerbsByConditionQuery(conditionId);

  return {
    herbs,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  };
};
