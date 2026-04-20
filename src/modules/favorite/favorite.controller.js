import {
  addFavoriteService,
  getFavoritesService,
  removeFavoriteService
} from "./favorite.service.js";

const parseHerbId = (value) => {
  const herbId = Number(value);
  return Number.isInteger(herbId) && herbId > 0 ? herbId : null;
};

const parseLanguage = (value) => {
  const language = String(value ?? "").trim().toUpperCase();
  return language || "EN";
};

export const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const herbId = parseHerbId(req.body?.herbId);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const data = await addFavoriteService(userId, herbId);

    res.status(201).json({
      success: true,
      message: data ? "Added to favorites" : "Already in favorites",
      data
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid herbId"
      });
    }
    next(error);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const language = parseLanguage(req.query.lang);
    const data = await getFavoritesService(userId, language);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const herbId = parseHerbId(req.params.herbId);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const deleted = await removeFavoriteService(userId, herbId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Removed from favorites"
    });
  } catch (error) {
    next(error);
  }
};
