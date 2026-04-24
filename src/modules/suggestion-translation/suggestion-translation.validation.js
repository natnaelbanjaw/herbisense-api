const ALLOWED_LANGUAGES = new Set(["EN", "AM", "OM"]);

export const normalizeLanguage = (value) => String(value || "").trim().toUpperCase();

export const validateSuggestionTranslationId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const validateSuggestionId = (value) => {
  const suggestionId = Number(value);
  return Number.isInteger(suggestionId) && suggestionId > 0 ? suggestionId : null;
};

export const validateUpsertSuggestionTranslation = (payload) => {
  const errors = [];

  const suggestionId = Number(payload?.suggestionId);
  const language = normalizeLanguage(payload?.language);
  const translated_herb_name = String(payload?.translated_herb_name ?? "").trim();
  const translated_condition_used_for = String(payload?.translated_condition_used_for ?? "").trim();
  const translated_description = String(payload?.translated_description ?? "").trim();
  const translated_preparation = String(payload?.translated_preparation ?? "").trim();

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    errors.push("suggestionId must be a positive integer");
  }

  if (!ALLOWED_LANGUAGES.has(language)) {
    errors.push("language must be one of EN, AM, OM");
  }

  if (!translated_herb_name) {
    errors.push("translated_herb_name is required");
  }

  if (!translated_condition_used_for) {
    errors.push("translated_condition_used_for is required");
  }

  if (!translated_description) {
    errors.push("translated_description is required");
  }

  if (!translated_preparation) {
    errors.push("translated_preparation is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      suggestionId,
      language,
      translated_herb_name,
      translated_condition_used_for,
      translated_description,
      translated_preparation
    }
  };
};
