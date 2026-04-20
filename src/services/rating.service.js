import {
  upsertRatingQuery,
  getHerbRatingStatsQuery,
  updateHerbRatingStatsQuery,
  getHerbRatingSummaryQuery,
  getHerbRatingsQuery,
  getUserRatingForHerbQuery
} from "../database/queries/rating.query.js";

import { getHerbByIdQuery } from "../database/queries/herb.query.js";

export const rateHerbService = async (userId, herbId, rating) => {

  if (rating < 1 || rating > 5) {
    throw { status: 400, message: "Rating must be between 1 and 5" };
  }

  const herb = await getHerbByIdQuery(herbId);
  if (!herb) {
    throw { status: 404, message: "Herb not found" };
  }

  await upsertRatingQuery(userId, herbId, rating);

  const stats = await getHerbRatingStatsQuery(herbId);

  await updateHerbRatingStatsQuery(
    herbId,
    stats.average,
    stats.count
  );

  return stats;
};
// export const getRatedHerbsService = async (userId) => {
//   const result = await pool.query(
//     `SELECT h.id, h.name, h.average_rating, h.rating_count
//      FROM herbs h
//      JOIN ratings r ON h.id = r.herb_id
//      WHERE r.user_id = $1`,
//     [userId]
//   );

//   return result.rows;
// };
export const getHerbRatingSummaryService = async (herbId) => {
  return await getHerbRatingSummaryQuery(herbId);
};

export const getHerbRatingsService = async (herbId) => {
  return await getHerbRatingsQuery(herbId);
};

export const getUserRatingForHerbService = async (userId, herbId) => {
  return await getUserRatingForHerbQuery(userId, herbId);
};