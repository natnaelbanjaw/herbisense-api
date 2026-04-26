import { db, timestamp } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const getUserFavoritesRef = (userId) => {
  return db.collection("users").doc(String(userId)).collection("favorites");
};

export const addFavoriteService = async (userId, herbId) => {
  if (!userId || !herbId) {
    throw createHttpError(400, "userId and herbId are required");
  }
  
  const favoriteRef = getUserFavoritesRef(userId).doc(String(herbId));
  const favoriteDoc = await favoriteRef.get();
  
  if (favoriteDoc.exists) {
    // Return existing favorite instead of throwing error (matches controller behavior)
    return {
      user_id: userId,
      herb_id: herbId,
      created_at: favoriteDoc.data().created_at?.toDate?.() || new Date().toISOString()
    };
  }
  
  await favoriteRef.set({
    herbId: String(herbId),
    created_at: timestamp.now(),
    updated_at: timestamp.now(),
  });

  await invalidateLocalCache([`favorites:${userId}:`, "favorites:"]);
  
  return {
    user_id: userId,
    herb_id: herbId,
    created_at: new Date().toISOString()
  };
};

export const removeFavoriteService = async (userId, herbId) => {
  const favoriteRef = getUserFavoritesRef(userId).doc(String(herbId));
  const favoriteDoc = await favoriteRef.get();
  
  if (!favoriteDoc.exists) {
    return false; // Return false instead of throwing error (matches controller expectation)
  }
  
  await favoriteRef.delete();
  await invalidateLocalCache([`favorites:${userId}:`, "favorites:"]);
  return true; // Return true if deleted
};

// This is the function name the controller expects: getFavoritesService
export const getFavoritesService = async (userId, language = "EN") => {
  return await withLocalCache(`favorites:${userId}:${language}`, async () => {
    const snapshot = await getUserFavoritesRef(userId).get();
    
    const favorites = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const herbId = data.herbId;
      
      // Fetch herb details including translations
      const herbRef = db.collection("herbs").doc(String(herbId));
      const herbDoc = await herbRef.get();
      
      if (herbDoc.exists) {
        const herbData = herbDoc.data();
        
        // Fetch translation if language is not EN
        let translatedName = herbData.name;
        let translatedDescription = herbData.description;
        let translatedPreparation = herbData.preparation;
        let translatedSafety = herbData.safetyWarning;
        
        if (language !== "EN") {
          const translationRef = db.collection("language_translations")
            .where("herbId", "==", String(herbId))
            .where("language", "==", language)
            .limit(1);
          const translationSnapshot = await translationRef.get();
          
          if (!translationSnapshot.empty) {
            const translationData = translationSnapshot.docs[0].data();
            translatedName = translationData.translatedName || herbData.name;
            translatedDescription = translationData.translatedUses || herbData.description;
            translatedPreparation = translationData.translatedPreparation || herbData.preparation;
            translatedSafety = translationData.translatedSafety || herbData.safetyWarning;
          }
        }
        
        favorites.push({
          id: doc.id,
          user_id: userId,
          herb_id: herbId,
          herb: {
            id: herbId,
            name: translatedName,
            scientific_name: herbData.scientificName,
            description: translatedDescription,
            preparation: translatedPreparation,
            safety_warning: translatedSafety,
            average_rating: herbData.averageRating || 0,
            rating_count: herbData.ratingCount || 0,
            image_url: herbData.imageUrl || null
          },
          created_at: data.created_at?.toDate?.() || new Date(),
        });
      }
    }
    
    return favorites;
  });
};

// Keep this for backward compatibility if needed
export const getUserFavoritesService = getFavoritesService;

export const isFavoriteService = async (userId, herbId) => {
  return await withLocalCache(`favorites:${userId}:is-favorite:${herbId}`, async () => {
    const favoriteRef = getUserFavoritesRef(userId).doc(String(herbId));
    const favoriteDoc = await favoriteRef.get();
    return favoriteDoc.exists;
  });
};
