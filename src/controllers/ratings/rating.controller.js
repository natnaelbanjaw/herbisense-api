import { rateHerbService } from "../../services/rating.service.js";

export const rateHerb = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { herbId } = req.params;
    const { rating } = req.body;

    const result = await rateHerbService(userId, herbId, rating);

    res.status(200).json({
      success: true,
      message: "Rating submitted",
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const getHerbRatingSummary = async (req, res, next) => {
  try {
    const { herbId } = req.params;

    const summary = await getHerbRatingSummaryService(herbId);

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    next(error);
  }
};

export const getHerbRatings = async (req, res, next) => {
  try {
    const { herbId } = req.params;

    const ratings = await getHerbRatingsService(herbId);

    res.status(200).json({
      success: true,
      data: ratings
    });

  } catch (error) {
    next(error);
  }
};

export const getMyRatingForHerb = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { herbId } = req.params;

    const rating = await getUserRatingForHerbService(userId, herbId);

    res.status(200).json({
      success: true,
      data: rating || null
    });

  } catch (error) {
    next(error);
  }
};