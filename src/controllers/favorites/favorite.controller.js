import {
  addFavoriteService,
  removeFavoriteService,
  getUserFavoritesService
} from "../../services/favorite.service.js";

export const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { herbId } = req.body;

    const favorite = await addFavoriteService(userId, herbId);

    res.status(201).json({
      success: true,
      data: favorite
    });

  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { herbId } = req.params;

    await removeFavoriteService(userId, herbId);

    res.status(200).json({
      success: true,
      message: "Removed from favorites"
    });

  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const favorites = await getUserFavoritesService(userId);

    res.status(200).json({
      success: true,
      data: favorites
    });

  } catch (error) {
    next(error);
  }
};