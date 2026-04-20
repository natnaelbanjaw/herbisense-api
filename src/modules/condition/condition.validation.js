export const validateCreateCondition = (payload) => {
  const errors = [];
  const name = String(payload?.name ?? "").trim();
  const description = payload?.description == null ? null : String(payload.description).trim();
  const hasHerbIdsField =
    Object.prototype.hasOwnProperty.call(payload ?? {}, "herbIds") ||
    Object.prototype.hasOwnProperty.call(payload ?? {}, "herb_ids");
  const rawHerbIds = payload?.herbIds ?? payload?.herb_ids;
  let herbIds = null;

  if (!name) {
    errors.push("name is required");
  } else if (name.length < 2 || name.length > 100) {
    errors.push("name must be between 2 and 100 characters");
  }

  if (hasHerbIdsField) {
    if (rawHerbIds === null || rawHerbIds === "") {
      herbIds = [];
    } else {
      const values = (Array.isArray(rawHerbIds) ? rawHerbIds : [rawHerbIds])
        .filter((value) => value !== null && value !== undefined && value !== "");

      if (!values.length) {
        herbIds = [];
      } else {
        herbIds = [...new Set(values.map((value) => Number(value)))];
        if (herbIds.some((herbId) => !Number.isInteger(herbId) || herbId <= 0)) {
          errors.push("herbIds must contain only positive integers");
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { name, description, herbIds, hasHerbIdsField }
  };
};

export const validateUpdateCondition = (payload) => {
  return validateCreateCondition(payload);
};
