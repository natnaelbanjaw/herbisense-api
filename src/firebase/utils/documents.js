export const mapDoc = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data()
});

export const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

export const normalizeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};
