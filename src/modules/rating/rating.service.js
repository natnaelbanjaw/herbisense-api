import { db, timestamp, fieldValue } from "../../config/firebase-admin.js";
import { createHttpError } from "../../utils/http-error.js";
import { createNumericDoc, resolveDocByNumericId, toEntityId } from "../../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const ratingsCollection = db.collection("ratings");

// This matches what controller expects: rateService(userId, herbId, ratingValue)
export const rateService = async (userId, herbId, ratingValue, comment = null) => {
  if (!userId || !herbId || !ratingValue) {
    throw createHttpError(400, "userId, herbId, and ratingValue are required");
  }
  
  if (ratingValue < 1 || ratingValue > 5) {
    throw createHttpError(400, "Rating must be between 1 and 5");
  }

  const herbDoc = await resolveDocByNumericId("herbs", herbId);
  if (!herbDoc?.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const existingSnapshot = await ratingsCollection
    .where("userId", "==", String(userId))
    .where("herbId", "==", Number(herbId))
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    throw createHttpError(409, "User has already rated this herb");
  }

  const now = timestamp.now();
  const { id: ratingId } = await createNumericDoc("ratings", {
    userId: String(userId),
    herbId: Number(herbId),
    rating: Number(ratingValue),
    ratingValue: Number(ratingValue),
    comment: comment || null,
    created_at: now,
    updated_at: now,
  });
  
  // Update herb average rating
  const herbData = herbDoc.data();
  const currentTotal = (herbData.averageRating || 0) * (herbData.ratingCount || 0);
  const newCount = (herbData.ratingCount || 0) + 1;
  const newAverage = (currentTotal + ratingValue) / newCount;
  
  await herbDoc.ref.update({
    averageRating: newAverage,
    ratingCount: newCount,
    updated_at: timestamp.now(),
  });

  await invalidateLocalCache(["ratings:", "herbs:", "favorites:", "saved-herbs:"]);
  
  return {
    id: ratingId,
    user_id: userId,
    herb_id: herbId,
    rating: ratingValue,
    rating_value: ratingValue,
    comment: comment || null,
    created_at: new Date().toISOString()
  };
};

// This matches what controller expects: getRatingsByHerbService(herbId)
export const getRatingsByHerbService = async (herbId) => {
  return await withLocalCache(`ratings:herb:${herbId}`, async () => {
    const snapshot = await ratingsCollection
      .where("herbId", "==", Number(herbId))
      .get();
    
    const ratings = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      ratings.push({
        id: toEntityId(doc, doc.id),
        user_id: data.userId,
        herb_id: data.herbId,
        rating: data.rating,
        rating_value: data.ratingValue,
        comment: data.comment || null,
        created_at: data.created_at?.toDate?.() || new Date(),
      });
    }

    ratings.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime() || 0;
      const rightTime = new Date(right.created_at).getTime() || 0;
      return rightTime - leftTime;
    });

    return ratings;
  });
};

// This matches what controller expects: getAverageRatingService(herbId)
export const getAverageRatingService = async (herbId) => {
  return await withLocalCache(`ratings:average:${herbId}`, async () => {
    const herbDoc = await resolveDocByNumericId("herbs", herbId);
    
    if (!herbDoc?.exists) {
      throw createHttpError(404, "Herb not found");
    }
    
    const herbData = herbDoc.data();
    
    return {
      herb_id: herbId,
      average_rating: herbData.averageRating || 0,
      rating_count: herbData.ratingCount || 0
    };
  });
};

// Keep these for backward compatibility if needed elsewhere
export const addRatingService = rateService;
export const getHerbRatingsService = getRatingsByHerbService;
