import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import {
  createNumericDoc,
  resolveDocByNumericId,
  toEntityId,
} from "../../utils/firestore-id.js";

const translationsCollection = db.collection("language_translations");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const getHerbDoc = async (herbId) => {
  const herbDoc = await resolveDocByNumericId("herbs", herbId);
  if (!herbDoc?.exists) {
    throw createHttpError(400, "Invalid herbId");
  }

  return herbDoc;
};

const formatTranslation = async (doc) => {
  const data = doc.data() || {};

  return {
    id: toEntityId(doc, doc.id),
    herb_id: Number(data.herbId),
    language: data.language || null,
    translated_name: data.translatedName || data.translated_name || null,
    translated_uses: data.translatedUses || data.translated_uses || null,
    translated_preparation: data.translatedPreparation || data.translated_preparation || null,
    translated_safety: data.translatedSafety || data.translated_safety || null,
    source: data.source || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
  };
};

export const upsertTranslationService = async ({
  herbId,
  language,
  translated_name,
  translated_uses,
  translated_preparation,
  translated_safety,
  source
}) => {
  await getHerbDoc(herbId);

  const existingSnapshot = await translationsCollection
    .where("herbId", "==", Number(herbId))
    .where("language", "==", language)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];

    await existingDoc.ref.set(
      {
        translatedName: translated_name,
        translatedUses: translated_uses,
        translatedPreparation: translated_preparation,
        translatedSafety: translated_safety,
        source: source || null,
        updatedAt: timestamp.now(),
      },
      { merge: true }
    );

    const updatedDoc = await existingDoc.ref.get();
    return await formatTranslation(updatedDoc);
  }

  const now = timestamp.now();
  const { ref } = await createNumericDoc("language_translations", {
    herbId: Number(herbId),
    language,
    translatedName: translated_name,
    translatedUses: translated_uses,
    translatedPreparation: translated_preparation,
    translatedSafety: translated_safety,
    source: source || null,
    createdAt: now,
    updatedAt: now,
  });

  const createdDoc = await ref.get();
  return await formatTranslation(createdDoc);
};

export const getTranslationService = async (herbId, language) => {
  const snapshot = await translationsCollection
    .where("herbId", "==", Number(herbId))
    .where("language", "==", language)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return await formatTranslation(snapshot.docs[0]);
};

export const getAllTranslationsService = async (herbId) => {
  const snapshot = await translationsCollection
    .where("herbId", "==", Number(herbId))
    .get();

  const docs = [...snapshot.docs].sort((left, right) => {
    const leftLanguage = String(left.data()?.language || "");
    const rightLanguage = String(right.data()?.language || "");
    return leftLanguage.localeCompare(rightLanguage);
  });

  return await Promise.all(docs.map((doc) => formatTranslation(doc)));
};

export const deleteTranslationService = async (id) => {
  const translationDoc = await resolveDocByNumericId("language_translations", id);

  if (!translationDoc?.exists) {
    return null;
  }

  const formatted = await formatTranslation(translationDoc);
  await translationDoc.ref.delete();
  return formatted;
};
