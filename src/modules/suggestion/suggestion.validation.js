const ALLOWED_LANGUAGES = new Set(["EN", "AM", "OM"]);

export const normalizeLanguage = (value) => {
  const language = String(value || "").trim().toUpperCase();
  return ALLOWED_LANGUAGES.has(language) ? language : "EN";
};

export const validateSuggestionId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const validateCreateSuggestion = (payload) => {
  const errors = [];

  const herb_name = String(payload?.herb_name ?? "").trim();
  const condition_used_for = String(payload?.condition_used_for ?? "").trim();
  const description = String(payload?.description ?? "").trim();
  const preparation = String(payload?.preparation ?? "").trim();
  const scientific_name =
    payload?.scientific_name === undefined || payload?.scientific_name === null
      ? null
      : String(payload.scientific_name).trim() || null;
  const user_full_name = String(payload?.user_full_name ?? "").trim();
  const user_email = String(payload?.user_email ?? "").trim().toLowerCase();
  const user_phone =
    payload?.user_phone === undefined || payload?.user_phone === null
      ? null
      : String(payload.user_phone).trim() || null;

  if (!herb_name) {
    errors.push("herb_name is required");
  }

  if (!condition_used_for) {
    errors.push("condition_used_for is required");
  }

  if (!description) {
    errors.push("description is required");
  }

  if (!preparation) {
    errors.push("preparation is required");
  }

  if (!user_full_name) {
    errors.push("user_full_name is required");
  } else if (user_full_name.length < 2 || user_full_name.length > 120) {
    errors.push("user_full_name must be between 2 and 120 characters");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!user_email) {
    errors.push("user_email is required");
  } else if (!emailRegex.test(user_email)) {
    errors.push("user_email must be a valid email address");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      herb_name,
      condition_used_for,
      description,
      preparation,
      scientific_name,
      user_full_name,
      user_email,
      user_phone
    }
  };
};
