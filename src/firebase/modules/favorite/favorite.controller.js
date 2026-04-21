import {
  addFavoriteService,
  getFavoritesService,
  removeFavoriteService
} from "../../services/favorite.service.js";
import { createHttpError } from "../../utils/http-error.js";

export const addFavorite = async (req, res, next) => {
  try {
    const herbId = String(req.body?.herbId || "").trim();

    if (!herbId) {
      throw createHttpError(400, "herbId is required");
    }

    const data = await addFavoriteService(req.user.uid, herbId);

    res.status(201).json({
      success: true,
      message: data ? "Added to favorites" : "Already in favorites",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const data = await getFavoritesService(req.user.uid);

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
    const deleted = await removeFavoriteService(req.user.uid, req.params.herbId);

    if (!deleted) {
      throw createHttpError(404, "Favorite not found");
    }

    res.status(200).json({
      success: true,
      message: "Removed from favorites"
    });
  } catch (error) {
    next(error);
  }
};
