import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import { resolveDocByNumericId, toEntityId } from "../../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const getUserSavedHerbsRef = (userId) => {
  return db.collection("users").doc(String(userId)).collection("saved_herbs");
};

const getPublishedHerbDoc = async (herbId) => {
  const herbDoc = await resolveDocByNumericId("herbs", herbId);

  if (!herbDoc?.exists) {
    throw createHttpError(400, "Invalid herbId");
  }

  const herbData = herbDoc.data() || {};
  if (String(herbData.status || "").toLowerCase() !== "published") {
    throw createHttpError(400, "Invalid herbId");
  }

  return herbDoc;
};

export const saveHerbService = async (userId, herbId) => {
  await getPublishedHerbDoc(herbId);

  const savedRef = getUserSavedHerbsRef(userId).doc(String(herbId));
  const existingDoc = await savedRef.get();

  if (existingDoc.exists) {
    return null;
  }

  await savedRef.set({
    herbId,
    created_at: timestamp.now(),
    updated_at: timestamp.now(),
  });

  await invalidateLocalCache([`saved-herbs:${userId}:`, "saved-herbs:"]);

  return {
    user_id: userId,
    herb_id: herbId,
    created_at: new Date().toISOString(),
  };
};

export const getSavedHerbsService = async (userId, language = "EN") => {
  return await withLocalCache(`saved-herbs:${userId}:${language}`, async () => {
    const snapshot = await getUserSavedHerbsRef(userId)
      .orderBy("created_at", "desc")
      .get();

    const savedHerbs = [];

    for (const doc of snapshot.docs) {
      const savedData = doc.data() || {};
      const herbId = toEntityId(savedData.herbId, savedData.herbId);
      const herbDoc = await resolveDocByNumericId("herbs", herbId);

      if (!herbDoc?.exists) {
        continue;
      }

      const herbData = herbDoc.data() || {};
      if (String(herbData.status || "").toLowerCase() !== "published") {
        continue;
      }

      let translatedName = herbData.name || null;
      let translatedDescription = herbData.description || null;
      let translatedPreparation = herbData.preparation || null;
      let translatedSafety = herbData.safetyWarning || null;
      let translatedSource = herbData.source || null;

      if (language !== "EN") {
        const translationSnapshot = await db.collection("language_translations")
          .where("herbId", "==", herbId)
          .where("language", "==", language)
          .limit(1)
          .get();

        if (!translationSnapshot.empty) {
          const translationData = translationSnapshot.docs[0].data() || {};
          translatedName = translationData.translatedName || translatedName;
          translatedDescription = translationData.translatedUses || translatedDescription;
          translatedPreparation = translationData.translatedPreparation || translatedPreparation;
          translatedSafety = translationData.translatedSafety || translatedSafety;
          translatedSource = translationData.source || translatedSource;
        }
      }

      const imageSnapshot = await herbDoc.ref.collection("images")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      savedHerbs.push({
        id: herbId,
        name: translatedName,
        scientific_name: herbData.scientificName || null,
        description: translatedDescription,
        preparation: translatedPreparation,
        safety_warning: translatedSafety,
        status: herbData.status || null,
        saved_at: savedData.created_at?.toDate?.() || new Date(),
        image: imageSnapshot.empty ? null : (imageSnapshot.docs[0].data()?.imageUrl || null),
        translation: language !== "EN"
          ? {
              translated_name: translatedName,
              translated_uses: translatedDescription,
              translated_preparation: translatedPreparation,
              translated_safety: translatedSafety,
              source: translatedSource,
            }
          : null,
      });
    }

    return savedHerbs;
  });
};

export const removeSavedHerbService = async (userId, herbId) => {
  const savedRef = getUserSavedHerbsRef(userId).doc(String(herbId));
  const existingDoc = await savedRef.get();

  if (!existingDoc.exists) {
    return null;
  }

  await savedRef.delete();
  await invalidateLocalCache([`saved-herbs:${userId}:`, "saved-herbs:"]);

  return {
    user_id: userId,
    herb_id: herbId,
  };
};
