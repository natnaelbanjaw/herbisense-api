import {
  getAverageRatingService,
  getRatingsByHerbService,
  rateHerbService
} from "../../services/rating.service.js";

export const rateRecommendation = async (req, res, next) => {
  try {
    const data = await rateHerbService(
      req.user.uid,
      req.body?.herbId,
      req.body?.rating
    );

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRatingsByHerb = async (req, res, next) => {
  try {
    const data = await getRatingsByHerbService(req.params.herbId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAverageRating = async (req, res, next) => {
  try {
    const data = await getAverageRatingService(req.params.herbId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
