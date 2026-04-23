// src/utils/http-error.js
export const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export default createHttpError;