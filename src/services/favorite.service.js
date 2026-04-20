import {
  addFavoriteQuery,
  removeFavoriteQuery,
  getUserFavoritesQuery
} from "../database/queries/favorite.query.js";

export const addFavoriteService = async (userId, herbId) => {
  return await addFavoriteQuery(userId, herbId);
await pool.query(
  `UPDATE herbs
   SET favorite_count = favorite_count + 1
   WHERE id = $1`,
  [herbId]
);};

export const removeFavoriteService = async (userId, herbId) => {
await addFavoriteQuery(userId, herbId);

await pool.query(
  `UPDATE herbs
   SET favorite_count = favorite_count + 1
   WHERE id = $1`,
  [herbId]
);};

export const getUserFavoritesService = async (userId) => {
  return await getUserFavoritesQuery(userId);
};