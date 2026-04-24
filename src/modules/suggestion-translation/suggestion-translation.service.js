import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import {
  createNumericDoc,
  resolveDocByNumericId,
  toEntityId
} from "../../utils/firestore-id.js";

const suggestionTranslationsCollection = db.collection("suggestion_translations");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const getSuggestionDoc = async (suggestionId) => {
  const suggestionDoc = await resolveDocByNumericId("suggestions", suggestionId);
  if (!suggestionDoc?.exists) {
    throw createHttpError(400, "Invalid suggestionId");
  }

  return suggestionDoc;
};

const formatSuggestionTranslation = async (doc) => {
  const data = doc.data() || {};

  return {
    id: toEntityId(doc, doc.id),
    suggestion_id: Number(data.suggestionId),
    language: data.language || null,
    translated_herb_name: data.translatedHerbName || data.translated_herb_name || null,
    translated_condition_used_for: data.translatedConditionUsedFor || data.translated_condition_used_for || null,
    translated_description: data.translatedDescription || data.translated_description || null,
    translated_preparation: data.translatedPreparation || data.translated_preparation || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at)
  };
};

export const upsertSuggestionTranslationService = async ({
  suggestionId,
  language,
  translated_herb_name,
  translated_condition_used_for,
  translated_description,
  translated_preparation
}) => {
  await getSuggestionDoc(suggestionId);

  const existingSnapshot = await suggestionTranslationsCollection
    .where("suggestionId", "==", Number(suggestionId))
    .where("language", "==", language)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];

    await existingDoc.ref.set(
      {
        translatedHerbName: translated_herb_name,
        translatedConditionUsedFor: translated_condition_used_for,
        translatedDescription: translated_description,
        translatedPreparation: translated_preparation,
        updatedAt: timestamp.now()
      },
      { merge: true }
    );

    const updatedDoc = await existingDoc.ref.get();
    return await formatSuggestionTranslation(updatedDoc);
  }

  const now = timestamp.now();
  const { ref } = await createNumericDoc("suggestion_translations", {
    suggestionId: Number(suggestionId),
    language,
    translatedHerbName: translated_herb_name,
    translatedConditionUsedFor: translated_condition_used_for,
    translatedDescription: translated_description,
    translatedPreparation: translated_preparation,
    createdAt: now,
    updatedAt: now
  });

  const createdDoc = await ref.get();
  return await formatSuggestionTranslation(createdDoc);
};

export const getSuggestionTranslationService = async (suggestionId, language) => {
  const snapshot = await suggestionTranslationsCollection
    .where("suggestionId", "==", Number(suggestionId))
    .where("language", "==", language)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return await formatSuggestionTranslation(snapshot.docs[0]);
};

export const getAllSuggestionTranslationsService = async (suggestionId) => {
  const snapshot = await suggestionTranslationsCollection
    .where("suggestionId", "==", Number(suggestionId))
    .get();

  const docs = [...snapshot.docs].sort((left, right) => {
    const leftLanguage = String(left.data()?.language || "");
    const rightLanguage = String(right.data()?.language || "");
    return leftLanguage.localeCompare(rightLanguage);
  });

  return await Promise.all(docs.map((doc) => formatSuggestionTranslation(doc)));
};

export const deleteSuggestionTranslationService = async (id) => {
  const translationDoc = await resolveDocByNumericId("suggestion_translations", id);
  if (!translationDoc?.exists) {
    return null;
  }

  const formatted = await formatSuggestionTranslation(translationDoc);
  await translationDoc.ref.delete();
  return formatted;
};
