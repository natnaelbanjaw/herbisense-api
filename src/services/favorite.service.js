import {
  addFavoriteQuery,
  removeFavoriteQuery,
  getUserFavoritesQuery
} from "../database/queries/favorite.query.js";

export const addFavoriteService = async (userId, herbId) => {
  return await addFavoriteQuery(userId, herbId);
};

export const removeFavoriteService = async (userId, herbId) => {
  await removeFavoriteQuery(userId, herbId);
};

export const getUserFavoritesService = async (userId) => {
  return await getUserFavoritesQuery(userId);
};