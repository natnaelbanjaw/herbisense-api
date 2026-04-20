import { getRecommendedHerbsService } from "../../services/herb.service.js";

export const getRecommendedHerbs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const herbs = await getRecommendedHerbsService(page, limit);

    res.status(200).json({
      success: true,
      data: herbs
    });

  } catch (error) {
    next(error);
  }
};
