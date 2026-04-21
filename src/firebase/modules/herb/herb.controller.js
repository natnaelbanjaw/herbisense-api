import {
  createHerbService,
  deleteHerbService,
  getHerbByIdService,
  getHerbsService,
  updateHerbService
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

export const deleteHerb = async (req, res, next) => {
  try {
    const data = await deleteHerbService(req.params.id);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
