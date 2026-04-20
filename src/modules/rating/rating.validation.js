export const validateRatingPayload = (payload) => {
  const errors = [];

  const herbId = Number(payload?.herbId);
  const ratingValue = Number(payload?.ratingValue);
  const comment =
    payload?.comment === undefined || payload?.comment === null
      ? null
      : String(payload.comment).trim();

  if (!Number.isInteger(herbId) || herbId <= 0) {
    errors.push("herbId must be a positive integer");
  }

  if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    errors.push("ratingValue must be a number between 1 and 5");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { herbId, ratingValue, comment }
  };
};
