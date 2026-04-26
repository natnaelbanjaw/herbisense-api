import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import {
  createNumericDoc,
  parseNumericId,
  resolveDocByNumericId,
  toEntityId,
} from "../../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const conditionsCollection = db.collection("conditions");
const herbsCollection = db.collection("herbs");
const conditionTranslationsCollection = db.collection("condition_translations");
const languageTranslationsCollection = db.collection("language_translations");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const normalizeLanguage = (language = "EN") => String(language || "EN").trim().toUpperCase();

const getConditionDocById = async (id) => {
  const doc = await resolveDocByNumericId("conditions", id);
  if (!doc?.exists) {
    return null;
  }
  return doc;
};

const getConditionTranslation = async (conditionId, language) => {
  if (normalizeLanguage(language) === "EN") {
    return null;
  }

  const snapshot = await conditionTranslationsCollection
    .where("conditionId", "==", Number(conditionId))
    .where("language", "==", normalizeLanguage(language))
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].data();
};

const getHerbTranslation = async (herbId, language) => {
  if (normalizeLanguage(language) === "EN") {
    return null;
  }

  const snapshot = await languageTranslationsCollection
    .where("herbId", "==", Number(herbId))
    .where("language", "==", normalizeLanguage(language))
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].data();
};

const formatPublishedHerb = async (doc, language = "EN") => {
  const data = doc.data() || {};
  const herbId = toEntityId(doc, doc.id);
  const translation = await getHerbTranslation(herbId, language);

  const imageSnapshot = await doc.ref.collection("images")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  return {
    id: herbId,
    name: translation?.translatedName || data.name || null,
    scientific_name: data.scientificName || null,
    description: translation?.translatedUses || data.description || null,
    preparation: translation?.translatedPreparation || data.preparation || null,
    safety_warning: translation?.translatedSafety || data.safetyWarning || null,
    source: translation?.source || data.source || null,
    status: data.status || null,
    average_rating: data.averageRating || 0,
    rating_count: data.ratingCount || 0,
    image: imageSnapshot.empty ? null : (imageSnapshot.docs[0].data()?.imageUrl || null),
    translation: translation
      ? {
          translated_name: translation.translatedName || null,
          translated_uses: translation.translatedUses || null,
          translated_preparation: translation.translatedPreparation || null,
          translated_safety: translation.translatedSafety || null,
          source: translation.source || null,
        }
      : null,
  };
};

const getPublishedHerbsForCondition = async (conditionId, language = "EN") => {
  const snapshot = await herbsCollection.get();

  const matchingDocs = snapshot.docs.filter((doc) => {
    const data = doc.data() || {};
    const status = String(data.status || "").toLowerCase();
    const conditionIds = Array.isArray(data.conditionIds)
      ? data.conditionIds.map((value) => Number(value)).filter(Number.isInteger)
      : [];

    return status === "published" && conditionIds.includes(Number(conditionId));
  });

  matchingDocs.sort((left, right) => {
    const leftName = String(left.data()?.name || "").toLowerCase();
    const rightName = String(right.data()?.name || "").toLowerCase();
    return leftName.localeCompare(rightName);
  });

  return await Promise.all(matchingDocs.map((doc) => formatPublishedHerb(doc, language)));
};

const formatCondition = async (doc, language = "EN") => {
  const data = doc.data() || {};
  const conditionId = toEntityId(doc, doc.id);
  const translation = await getConditionTranslation(conditionId, language);
  const linkedHerbId = parseNumericId(data.herbId);
  let linkedHerbName = null;

  if (linkedHerbId) {
    const herbDoc = await resolveDocByNumericId("herbs", linkedHerbId);
    if (herbDoc?.exists) {
      linkedHerbName = herbDoc.data()?.name || null;
    }
  }

  return {
    id: conditionId,
    name: translation?.translatedName || data.name || null,
    description: translation?.translatedDescription || data.description || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
    herb_id: linkedHerbId,
    linked_herb_name: linkedHerbName,
    herbs: await getPublishedHerbsForCondition(conditionId, language),
  };
};

const findConditionByName = async (name) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  if (!normalizedName) {
    return null;
  }

  const snapshot = await conditionsCollection.get();
  return snapshot.docs.find((doc) => String(doc.data()?.name || "").trim().toLowerCase() === normalizedName) || null;
};

const resolveHerbIds = async (herbIds) => {
  if (!Array.isArray(herbIds) || !herbIds.length) {
    return [];
  }

  const resolvedIds = [];

  for (const value of herbIds) {
    const herbId = parseNumericId(value);
    if (!herbId) {
      throw createHttpError(400, "herbIds must contain only positive integers");
    }

    const herbDoc = await resolveDocByNumericId("herbs", herbId);
    if (!herbDoc?.exists) {
      throw createHttpError(400, `herbIds do not exist: ${herbId}`);
    }

    resolvedIds.push(herbId);
  }

  return [...new Set(resolvedIds)];
};

export const createConditionService = async (
  { name, description, herbIds },
  language = "EN"
) => {
  const existing = await findConditionByName(name);
  if (existing) {
    throw createHttpError(409, "Condition already exists");
  }

  const resolvedHerbIds = await resolveHerbIds(herbIds);
  const now = timestamp.now();
  const payload = {
    name,
    description: description ?? null,
    herbId: resolvedHerbIds[0] || null,
    herbIds: resolvedHerbIds,
    createdAt: now,
    updatedAt: now,
  };

  const { ref } = await createNumericDoc("conditions", payload);
  const createdDoc = await ref.get();
  await invalidateLocalCache(["conditions:", "herbs:", "uploads:", "translations:"]);

  return await formatCondition(createdDoc, language);
};

export const getAllConditionsService = async (language = "EN") => {
  return await withLocalCache(`conditions:all:${language}`, async () => {
    const snapshot = await conditionsCollection.get();
    const docs = [...snapshot.docs].sort((left, right) => {
      const leftName = String(left.data()?.name || "").toLowerCase();
      const rightName = String(right.data()?.name || "").toLowerCase();
      return leftName.localeCompare(rightName);
    });

    return await Promise.all(docs.map((doc) => formatCondition(doc, language)));
  });
};

export const searchConditionsService = async (search, language = "EN") => {
  const term = String(search || "").trim().toLowerCase();
  if (!term) {
    return [];
  }

  return await withLocalCache(`conditions:search:${language}:${term}`, async () => {
    const conditions = await getAllConditionsService(language);
    return conditions.filter((condition) => {
      const name = String(condition.name || "").toLowerCase();
      const description = String(condition.description || "").toLowerCase();
      return name.includes(term) || description.includes(term);
    });
  });
};

export const getConditionByIdService = async (id, language = "EN") => {
  return await withLocalCache(`conditions:id:${id}:${language}`, async () => {
    const doc = await getConditionDocById(id);
    if (!doc) {
      return null;
    }

    return await formatCondition(doc, language);
  });
};

export const updateConditionService = async (
  id,
  { name, description, herbIds, hasHerbIdsField },
  language = "EN"
) => {
  const doc = await getConditionDocById(id);
  if (!doc) {
    return null;
  }

  const existing = await findConditionByName(name);
  if (existing && toEntityId(existing, existing.id) !== toEntityId(doc, doc.id)) {
    throw createHttpError(409, "Condition already exists");
  }

  const updates = {
    name,
    description: description ?? null,
    updatedAt: timestamp.now(),
  };

  if (hasHerbIdsField) {
    const resolvedHerbIds = await resolveHerbIds(herbIds);
    updates.herbIds = resolvedHerbIds;
    updates.herbId = resolvedHerbIds[0] || null;
  }

  await doc.ref.set(updates, { merge: true });
  const updatedDoc = await doc.ref.get();
  await invalidateLocalCache(["conditions:", "herbs:", "uploads:", "translations:"]);
  return await formatCondition(updatedDoc, language);
};

export const deleteConditionService = async (id) => {
  const doc = await getConditionDocById(id);
  if (!doc) {
    return null;
  }

  const recommendationSnapshot = await db.collection("recommendation_rules")
    .where("conditionId", "==", Number(id))
    .limit(1)
    .get();

  if (!recommendationSnapshot.empty) {
    throw createHttpError(409, "Cannot delete condition linked to recommendations");
  }

  await doc.ref.delete();
  await invalidateLocalCache(["conditions:", "herbs:", "uploads:", "translations:", "recommendations:"]);
  return { id: Number(id) };
};

export const linkHerbToConditionService = async (herbId, conditionId) => {
  const parsedHerbId = parseNumericId(herbId);
  const parsedConditionId = parseNumericId(conditionId);

  if (!parsedHerbId || !parsedConditionId) {
    throw createHttpError(400, "herbId and conditionId must be positive integers");
  }

  const herbDoc = await resolveDocByNumericId("herbs", parsedHerbId);
  if (!herbDoc?.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const conditionDoc = await getConditionDocById(parsedConditionId);
  if (!conditionDoc) {
    throw createHttpError(404, "Condition not found");
  }

  const herbData = herbDoc.data() || {};
  const conditionData = conditionDoc.data() || {};
  const conditionIds = Array.isArray(herbData.conditionIds)
    ? herbData.conditionIds.map((value) => Number(value)).filter(Number.isInteger)
    : [];

  if (!conditionIds.includes(parsedConditionId)) {
    conditionIds.push(parsedConditionId);
  }

  await herbDoc.ref.set(
    {
      conditionIds,
      updatedAt: timestamp.now(),
    },
    { merge: true }
  );

  await conditionDoc.ref.set(
    {
      herbId: parsedHerbId,
      herbIds: Array.isArray(conditionData.herbIds)
        ? [...new Set([...conditionData.herbIds.map((value) => Number(value)).filter(Number.isInteger), parsedHerbId])]
        : [parsedHerbId],
      updatedAt: timestamp.now(),
    },
    { merge: true }
  );

  await invalidateLocalCache(["conditions:", "herbs:", "uploads:", "translations:"]);

  return {
    herb_id: parsedHerbId,
    condition_id: parsedConditionId,
  };
};
