import { db, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";
import { mapDoc } from "../utils/documents.js";

const herbsCollection = db.collection("herbs");
const ratingsCollection = db.collection("ratings");

const getRatingDocId = (userId, herbId) => `${userId}_${herbId}`;

const updateHerbAggregate = async (herbId) => {
  const snapshot = await ratingsCollection.where("herbId", "==", String(herbId)).get();
  const ratings = snapshot.docs.map((doc) => doc.data().rating).filter(Number.isFinite);
  const ratingCount = ratings.length;
  const averageRating = ratingCount
    ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratingCount).toFixed(2))
    : 0;

  await herbsCollection.doc(String(herbId)).set(
    {
      averageRating,
      ratingCount,
      updatedAt: timestamp.now()
    },
    { merge: true }
  );

  return { averageRating, ratingCount };
};

export const rateHerbService = async (userId, herbId, rating) => {
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    throw createHttpError(400, "rating must be a number between 1 and 5");
  }

  const herbSnapshot = await herbsCollection.doc(String(herbId)).get();

  if (!herbSnapshot.exists) {
    throw createHttpError(400, "Invalid herbId");
  }

  const ratingRef = ratingsCollection.doc(getRatingDocId(userId, herbId));
  const existingSnapshot = await ratingRef.get();

  await ratingRef.set(
    {
      userId: String(userId),
      herbId: String(herbId),
      rating: numericRating,
      createdAt: existingSnapshot.exists
        ? existingSnapshot.data().createdAt
        : timestamp.now(),
      updatedAt: timestamp.now()
    },
    { merge: true }
  );

  const aggregate = await updateHerbAggregate(herbId);

  return {
    herbId: String(herbId),
    rating: numericRating,
    ...aggregate
  };
};

export const getRatingsByHerbService = async (herbId) => {
  const snapshot = await ratingsCollection
    .where("herbId", "==", String(herbId))
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(mapDoc);
};

export const getAverageRatingService = async (herbId) => {
  const herbSnapshot = await herbsCollection.doc(String(herbId)).get();

  if (!herbSnapshot.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const herb = herbSnapshot.data();

  return {
    herbId: String(herbId),
    averageRating: herb.averageRating || 0,
    ratingCount: herb.ratingCount || 0
  };
};
