import { db, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";
import { mapDoc } from "../utils/documents.js";

const herbsCollection = db.collection("herbs");
const usersCollection = db.collection("users");

const getFavoriteRef = (userId, herbId) =>
  usersCollection.doc(String(userId)).collection("favorites").doc(String(herbId));

export const addFavoriteService = async (userId, herbId) => {
  const herbSnapshot = await herbsCollection.doc(String(herbId)).get();

  if (!herbSnapshot.exists) {
    throw createHttpError(400, "Invalid herbId");
  }

  const favoriteRef = getFavoriteRef(userId, herbId);
  const favoriteSnapshot = await favoriteRef.get();

  if (favoriteSnapshot.exists) {
    return null;
  }

  await favoriteRef.set({
    herbId: String(herbId),
    createdAt: timestamp.now()
  });

  return {
    herbId: String(herbId)
  };
};

export const getFavoritesService = async (userId) => {
  const snapshot = await usersCollection
    .doc(String(userId))
    .collection("favorites")
    .orderBy("createdAt", "desc")
    .get();

  const favoriteDocs = snapshot.docs.map(mapDoc);
  const herbs = await Promise.all(
    favoriteDocs.map(async (favorite) => {
      const herbSnapshot = await herbsCollection.doc(String(favorite.herbId)).get();
      return herbSnapshot.exists
        ? {
            favoriteId: favorite.id,
            favoriteCreatedAt: favorite.createdAt,
            ...mapDoc(herbSnapshot)
          }
        : null;
    })
  );

  return herbs.filter(Boolean);
};

export const removeFavoriteService = async (userId, herbId) => {
  const favoriteRef = getFavoriteRef(userId, herbId);
  const snapshot = await favoriteRef.get();

  if (!snapshot.exists) {
    return false;
  }

  await favoriteRef.delete();
  return true;
};
