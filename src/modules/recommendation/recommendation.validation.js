export const validateCreateRecommendation = (payload) => {
  const errors = [];

  const conditionId = Number(payload?.conditionId);
  const herbId = Number(payload?.herbId);
  const hasPriority = payload?.priority !== undefined && payload?.priority !== null;
  const priority = hasPriority ? Number(payload.priority) : null;

  if (!Number.isInteger(conditionId) || conditionId <= 0) {
    errors.push("conditionId must be a positive integer");
  }

  if (!Number.isInteger(herbId) || herbId <= 0) {
    errors.push("herbId must be a positive integer");
  }

  if (hasPriority && !Number.isFinite(priority)) {
    errors.push("priority must be a number when provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      conditionId,
      herbId,
      priority
    }
  };
};
