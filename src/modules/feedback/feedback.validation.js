export const validateCreateFeedback = (payload) => {
  const errors = [];

  const name = String(payload?.name ?? "").trim();
  const email = String(payload?.email ?? "").trim().toLowerCase();
  const message = String(payload?.message ?? "").trim();

  if (!name) {
    errors.push("name is required");
  } else if (name.length < 2 || name.length > 120) {
    errors.push("name must be between 2 and 120 characters");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.push("email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("email must be a valid email address");
  }

  if (!message) {
    errors.push("message is required");
  } else if (message.length < 5 || message.length > 1000) {
    errors.push("message must be between 5 and 1000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { name, email, message }
  };
};

export const parseFeedbackId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
