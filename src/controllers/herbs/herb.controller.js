import {
  createHerbService,
  updateHerbService,
  deleteHerbService,
  updateHerbStatusService,
  getPublishedHerbsService
} from "../../services/herb.service.js";

export const createHerb = async (req, res, next) => {
  try {
    const herb = await createHerbService(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: herb
    });

  } catch (error) {
    next(error);
  }
};

export const getHerbs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const herbs = await getPublishedHerbsService(page, limit);

    res.status(200).json({
      success: true,
      data: herbs
    });

  } catch (error) {
    next(error);
  }
};

