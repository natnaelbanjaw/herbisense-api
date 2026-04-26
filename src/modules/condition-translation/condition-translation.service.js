import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import {
  createNumericDoc,
  parseNumericId,
  resolveDocByNumericId,
  toEntityId,
} from "../../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const translationsCollection = db.collection("condition_translations");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const getConditionDoc = async (conditionId) => {
  const conditionDoc = await resolveDocByNumericId("conditions", conditionId);
  if (!conditionDoc?.exists) {
    throw createHttpError(400, "Invalid conditionId");
  }

  return conditionDoc;
};

const formatConditionTranslation = async (doc) => {
  const data = doc.data() || {};
  const conditionId = parseNumericId(data.conditionId);
  const conditionDoc = conditionId
    ? await resolveDocByNumericId("conditions", conditionId)
    : null;
  const conditionData = conditionDoc?.data() || {};
  const herbId = parseNumericId(conditionData.herbId);
  let linkedHerbName = null;

  if (herbId) {
    const herbDoc = await resolveDocByNumericId("herbs", herbId);
    if (herbDoc?.exists) {
      linkedHerbName = herbDoc.data()?.name || null;
    }
  }

  return {
    id: toEntityId(doc, doc.id),
    condition_id: conditionId,
    language: data.language || null,
    translated_name: data.translatedName || data.translated_name || null,
    translated_description: data.translatedDescription || data.translated_description || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
    herb_id: herbId,
    linked_herb_name: linkedHerbName,
  };
};

export const upsertConditionTranslationService = async ({
  conditionId,
  language,
  translated_name,
  translated_description
}) => {
  await getConditionDoc(conditionId);

  const existingSnapshot = await translationsCollection
    .where("conditionId", "==", Number(conditionId))
    .where("language", "==", language)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];

    await existingDoc.ref.set(
      {
        translatedName: translated_name,
        translatedDescription: translated_description,
        updatedAt: timestamp.now(),
      },
      { merge: true }
    );

    const updatedDoc = await existingDoc.ref.get();
    await invalidateLocalCache(["condition-translations:", "conditions:"]);
    return await formatConditionTranslation(updatedDoc);
  }

  const now = timestamp.now();
  const { ref } = await createNumericDoc("condition_translations", {
    conditionId: Number(conditionId),
    language,
    translatedName: translated_name,
    translatedDescription: translated_description,
    createdAt: now,
    updatedAt: now,
  });

  const createdDoc = await ref.get();
  await invalidateLocalCache(["condition-translations:", "conditions:"]);
  return await formatConditionTranslation(createdDoc);
};

export const getConditionTranslationService = async (conditionId, language) => {
  return await withLocalCache(`condition-translations:one:${conditionId}:${language}`, async () => {
    const snapshot = await translationsCollection
      .where("conditionId", "==", Number(conditionId))
      .where("language", "==", language)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return await formatConditionTranslation(snapshot.docs[0]);
  });
};

export const getAllConditionTranslationsService = async (conditionId) => {
  return await withLocalCache(`condition-translations:all:${conditionId}`, async () => {
    const snapshot = await translationsCollection
      .where("conditionId", "==", Number(conditionId))
      .get();

    const docs = [...snapshot.docs].sort((left, right) => {
      const leftLanguage = String(left.data()?.language || "");
      const rightLanguage = String(right.data()?.language || "");
      return leftLanguage.localeCompare(rightLanguage);
    });

    return await Promise.all(docs.map((doc) => formatConditionTranslation(doc)));
  });
};

export const deleteConditionTranslationService = async (id) => {
  const translationDoc = await resolveDocByNumericId("condition_translations", id);

  if (!translationDoc?.exists) {
    return null;
  }

  const formatted = await formatConditionTranslation(translationDoc);
  await translationDoc.ref.delete();
  await invalidateLocalCache(["condition-translations:", "conditions:"]);
  return formatted;
};
