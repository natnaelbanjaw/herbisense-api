import {
  createHerbService,
  deleteHerbService,
  getHerbByIdService,
  getHerbsService,
  getPendingHerbsService,
  getPublishedHerbsService,
  getRecommendedHerbsService,
  searchHerbsService,
  updateHerbService
  ,
  updateHerbStatusService
} from "../../services/herb.service.js";

export const createHerb = async (req, res, next) => {
  try {
    const data = await createHerbService(req.body || {}, req.user.uid);

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getHerbs = async (req, res, next) => {
  try {
    const data = await getHerbsService(req.query || {});

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getPublishedHerbs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await getPublishedHerbsService(page, limit);

    res.status(200).json({
      success: true,
      pagination: result.pagination,
      data: result.herbs
    });
  } catch (error) {
    next(error);
  }
};

export const getUnPublishedHerbs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await getPendingHerbsService(page, limit);

    res.status(200).json({
      success: true,
      pagination: result.pagination,
      data: result.herbs
    });
  } catch (error) {
    next(error);
  }
};

export const searchHerbs = async (req, res, next) => {
  try {
    const data = await searchHerbsService(req.query || {});

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getHerbById = async (req, res, next) => {
  try {
    const data = await getHerbByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const updateHerb = async (req, res, next) => {
  try {
    const data = await updateHerbService(req.params.id, req.body || {});

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const updateHerbStatus = async (req, res, next) => {
  try {
    const data = await updateHerbStatusService(req.params.id, req.body?.status);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHerb = async (req, res, next) => {
  try {
    const data = await deleteHerbService(req.params.id);

    res.status(200).json({
      success: true,
      message: "Herb deleted successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedHerbs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await getRecommendedHerbsService(req.user.uid, page, limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      data
    });
  } catch (error) {
    next(error);
  }
};
