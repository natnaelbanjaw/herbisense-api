import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import { parseNumericId, resolveDocByNumericId, toEntityId } from "../../utils/firestore-id.js";

const herbsCollection = db.collection("herbs");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const formatImageDoc = (doc, herbId) => {
  const data = doc.data() || {};

  return {
    id: toEntityId(doc, doc.id),
    herb_id: herbId,
    image_url: data.imageUrl || data.image_url || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
  };
};

const getHerbDoc = async (herbId) => {
  const herbDoc = await resolveDocByNumericId("herbs", herbId);
  if (!herbDoc?.exists) {
    throw createHttpError(400, "Invalid herbId");
  }

  return herbDoc;
};

const getCondition = async (conditionId) => {
  const parsedConditionId = parseNumericId(conditionId);
  if (!parsedConditionId) {
    return null;
  }

  const conditionDoc = await resolveDocByNumericId("conditions", parsedConditionId);
  if (!conditionDoc?.exists) {
    return null;
  }

  const data = conditionDoc.data() || {};
  return {
    id: parsedConditionId,
    name: data.name || null,
    description: data.description || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
  };
};

const getConditions = async (conditionIds = []) => {
  const ids = [...new Set(
    (Array.isArray(conditionIds) ? conditionIds : [])
      .map((value) => parseNumericId(value))
      .filter(Boolean)
  )];

  const conditions = await Promise.all(ids.map((id) => getCondition(id)));
  return conditions.filter(Boolean).sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
};

const formatHerbDoc = async (doc) => {
  const data = doc.data() || {};
  const herbId = toEntityId(doc, doc.id);
  const conditions = await getConditions(data.conditionIds);
  const primaryCondition = conditions[0] || null;
  const imagesSnapshot = await doc.ref.collection("images").get();
  const images = imagesSnapshot.docs
    .map((imageDoc) => formatImageDoc(imageDoc, herbId))
    .sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime() || 0;
      const rightTime = new Date(right.created_at).getTime() || 0;
      return rightTime - leftTime;
    });

  return {
    id: herbId,
    name: data.name || null,
    scientific_name: data.scientificName || null,
    description: data.description || null,
    preparation: data.preparation || null,
    safety_warning: data.safetyWarning || null,
    source: data.source || null,
    status: data.status || null,
    average_rating: data.averageRating || 0,
    rating_count: data.ratingCount || 0,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
    condition: primaryCondition,
    conditions,
    images,
  };
};

export const saveHerbImageService = async (herbId, imageUrl) => {
  const herbDoc = await getHerbDoc(herbId);
  const now = timestamp.now();
  const imageRef = herbDoc.ref.collection("images").doc(String(Date.now()));

  await imageRef.set({
    imageUrl,
    createdAt: now,
    updatedAt: now,
  });

  const savedDoc = await imageRef.get();
  return formatImageDoc(savedDoc, herbId);
};

export const getHerbsService = async () => {
  const snapshot = await herbsCollection.get();
  const herbs = await Promise.all(snapshot.docs.map((doc) => formatHerbDoc(doc)));

  herbs.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime() || 0;
    const rightTime = new Date(right.created_at).getTime() || 0;
    return rightTime - leftTime;
  });

  return herbs;
};

export const getHerbImagesService = async (herbId) => {
  const herbDoc = await getHerbDoc(herbId);
  const snapshot = await herbDoc.ref.collection("images").get();

  const images = snapshot.docs.map((doc) => formatImageDoc(doc, herbId));
  images.sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime() || 0;
    const rightTime = new Date(right.created_at).getTime() || 0;
    return rightTime - leftTime;
  });

  return images;
};

export const deleteImageService = async (id) => {
  const snapshot = await db.collectionGroup("images").get();
  const imageDoc = snapshot.docs.find((doc) => toEntityId(doc, doc.id) === Number(id) || doc.id === String(id));

  if (!imageDoc) {
    return null;
  }

  const herbId = parseNumericId(imageDoc.ref.parent.parent?.id);
  const formatted = formatImageDoc(imageDoc, herbId);
  await imageDoc.ref.delete();
  return formatted;
};
