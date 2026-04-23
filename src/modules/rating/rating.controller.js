import {
  rateService,
  getRatingsByHerbService,
  getAverageRatingService
} from "./rating.service.js";
import { validateRatingPayload } from "./rating.validation.js";

const parseHerbId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const rateRecommendation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validation = validateRatingPayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const { herbId, ratingValue, comment } = validation.value;
    const data = await rateService(userId, herbId, ratingValue, comment);

    res.status(200).json({
      success: true,
      message: "Rating submitted",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRatingsByHerb = async (req, res, next) => {
  try {
    const herbId = parseHerbId(req.params.herbId);
    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const data = await getRatingsByHerbService(herbId);

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
    const herbId = parseHerbId(req.params.herbId);
    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const data = await getAverageRatingService(herbId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
