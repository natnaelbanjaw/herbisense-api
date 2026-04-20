const ALLOWED_LANGUAGES = new Set(["EN", "AM", "OM"]);

export const normalizeLanguage = (value) => String(value || "").trim().toUpperCase();

export const validateUpsertConditionTranslation = (payload) => {
  const errors = [];

  const conditionId = Number(payload?.conditionId);
  const language = normalizeLanguage(payload?.language);
  const translated_name = String(payload?.translated_name ?? "").trim();
  const translated_description = String(payload?.translated_description ?? "").trim();

  if (!Number.isInteger(conditionId) || conditionId <= 0) {
    errors.push("conditionId must be a positive integer");
  }

  if (!ALLOWED_LANGUAGES.has(language)) {
    errors.push("language must be one of EN, AM, OM");
  }

  if (!translated_name) {
    errors.push("translated_name is required");
  }

  if (!translated_description) {
    errors.push("translated_description is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      conditionId,
      language,
      translated_name,
      translated_description
    }
  };
};

export const validateConditionId = (value) => {
  const conditionId = Number(value);
  return Number.isInteger(conditionId) && conditionId > 0 ? conditionId : null;
};

export const validateConditionTranslationId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
