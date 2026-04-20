const ALLOWED_LANGUAGES = new Set(["EN", "AM", "OM"]);

export const normalizeLanguage = (value) => String(value || "").trim().toUpperCase();

export const validateUpsertTranslation = (payload) => {
  const errors = [];

  const herbId = Number(payload?.herbId);
  const language = normalizeLanguage(payload?.language);
  const translated_name = String(payload?.translated_name ?? "").trim();
  const translated_uses = String(payload?.translated_uses ?? "").trim();
  const translated_preparation = String(payload?.translated_preparation ?? "").trim();
  const translated_safety =
    payload?.translated_safety === undefined || payload?.translated_safety === null
      ? null
      : String(payload.translated_safety).trim();
  const source =
    payload?.source === undefined || payload?.source === null
      ? null
      : String(payload.source).trim();

  if (!Number.isInteger(herbId) || herbId <= 0) {
    errors.push("herbId must be a positive integer");
  }

  if (!ALLOWED_LANGUAGES.has(language)) {
    errors.push("language must be one of EN, AM, OM");
  }

  if (!translated_name) {
    errors.push("translated_name is required");
  }

  if (!translated_uses) {
    errors.push("translated_uses is required");
  }

  if (!translated_preparation) {
    errors.push("translated_preparation is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      herbId,
      language,
      translated_name,
      translated_uses,
      translated_preparation,
      translated_safety,
      source
    }
  };
};

export const validateHerbId = (value) => {
  const herbId = Number(value);
  return Number.isInteger(herbId) && herbId > 0 ? herbId : null;
};

export const validateTranslationId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
