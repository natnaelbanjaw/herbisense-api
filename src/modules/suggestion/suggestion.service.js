import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import {
  createNumericDoc,
  resolveDocByNumericId,
  toEntityId
} from "../../utils/firestore-id.js";
import { normalizeLanguage } from "./suggestion.validation.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const suggestionsCollection = db.collection("suggestions");
const suggestionTranslationsCollection = db.collection("suggestion_translations");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const getSuggestionTranslation = async (suggestionId, language = "EN") => {
  const normalizedLanguage = normalizeLanguage(language);
  if (normalizedLanguage === "EN") {
    return null;
  }

  const snapshot = await suggestionTranslationsCollection
    .where("suggestionId", "==", Number(suggestionId))
    .where("language", "==", normalizedLanguage)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].data();
};

const formatSuggestion = async (doc, language = "EN") => {
  const data = doc.data() || {};
  const suggestionId = toEntityId(doc, doc.id);
  const translation = await getSuggestionTranslation(suggestionId, language);

  return {
    id: suggestionId,
    herb_name: translation?.translatedHerbName || data.herbName || null,
    condition_used_for: translation?.translatedConditionUsedFor || data.conditionUsedFor || null,
    description: translation?.translatedDescription || data.description || null,
    preparation: translation?.translatedPreparation || data.preparation || null,
    scientific_name: data.scientificName || null,
    herb_image: data.herbImage || null,
    user: {
      id: data.userId || null,
      full_name: data.userFullName || null,
      email: data.userEmail || null,
      phone: data.userPhone || null,
      account_full_name: data.accountFullName || null,
      account_email: data.accountEmail || null,
      role: data.userRole || null,
      is_verified: data.userIsVerified ?? null
    },
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
    translation: translation
      ? {
          language: translation.language || null,
          translated_herb_name: translation.translatedHerbName || null,
          translated_condition_used_for: translation.translatedConditionUsedFor || null,
          translated_description: translation.translatedDescription || null,
          translated_preparation: translation.translatedPreparation || null
        }
      : null
  };
};

const getSuggestionDocById = async (id) => {
  const doc = await resolveDocByNumericId("suggestions", id);
  return doc?.exists ? doc : null;
};

export const createSuggestionService = async (payload, authUser, herbImage) => {
  const now = timestamp.now();
  const { ref } = await createNumericDoc("suggestions", {
    herbName: payload.herb_name,
    conditionUsedFor: payload.condition_used_for,
    description: payload.description,
    preparation: payload.preparation,
    scientificName: payload.scientific_name,
    herbImage,
    userId: String(authUser.id),
    userFullName: payload.user_full_name,
    userEmail: payload.user_email,
    userPhone: payload.user_phone,
    accountFullName: authUser.fullName || null,
    accountEmail: authUser.email || null,
    userRole: authUser.role || "user",
    userIsVerified: Boolean(authUser.isVerified),
    createdAt: now,
    updatedAt: now
  });

  const createdDoc = await ref.get();
  await invalidateLocalCache(["suggestions:", "suggestion-translations:"]);
  return await formatSuggestion(createdDoc);
};

export const getMySuggestionsService = async (userId, language = "EN") => {
  return await withLocalCache(`suggestions:user:${userId}:${language}`, async () => {
    const snapshot = await suggestionsCollection
      .where("userId", "==", String(userId))
      .get();

    const docs = [...snapshot.docs].sort((left, right) => {
      const leftTime = new Date(left.data()?.createdAt?.toDate?.() || left.data()?.createdAt || 0).getTime() || 0;
      const rightTime = new Date(right.data()?.createdAt?.toDate?.() || right.data()?.createdAt || 0).getTime() || 0;
      return rightTime - leftTime;
    });

    return await Promise.all(docs.map((doc) => formatSuggestion(doc, language)));
  });
};

export const getAllSuggestionsService = async (language = "EN") => {
  return await withLocalCache(`suggestions:all:${language}`, async () => {
    const snapshot = await suggestionsCollection.get();
    const docs = [...snapshot.docs].sort((left, right) => {
      const leftTime = new Date(left.data()?.createdAt?.toDate?.() || left.data()?.createdAt || 0).getTime() || 0;
      const rightTime = new Date(right.data()?.createdAt?.toDate?.() || right.data()?.createdAt || 0).getTime() || 0;
      return rightTime - leftTime;
    });

    return await Promise.all(docs.map((doc) => formatSuggestion(doc, language)));
  });
};

export const getSuggestionByIdService = async (id, requester, language = "EN") => {
  return await withLocalCache(
    `suggestions:id:${id}:${requester?.id || "anonymous"}:${requester?.role || "none"}:${language}`,
    async () => {
      const doc = await getSuggestionDocById(id);
      if (!doc) {
        return null;
      }

      const data = doc.data() || {};
      const isAdmin = ["admin", "super_admin"].includes(String(requester?.role || ""));
      const isOwner = String(data.userId || "") === String(requester?.id || "");

      if (!isAdmin && !isOwner) {
        throw createHttpError(403, "You are not allowed to access this suggestion");
      }

      return await formatSuggestion(doc, language);
    }
  );
};

export const deleteSuggestionService = async (id) => {
  const doc = await getSuggestionDocById(id);
  if (!doc) {
    return null;
  }

  const translationSnapshot = await suggestionTranslationsCollection
    .where("suggestionId", "==", Number(id))
    .get();

  await Promise.all(translationSnapshot.docs.map((item) => item.ref.delete()));
  const formatted = await formatSuggestion(doc);
  await doc.ref.delete();
  await invalidateLocalCache(["suggestions:", "suggestion-translations:"]);
  return formatted;
};
