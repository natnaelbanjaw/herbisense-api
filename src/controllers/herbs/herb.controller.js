import {
  createHerbService,
  updateHerbService,
  deleteHerbService,
  updateHerbStatusService,
  getPublishedHerbsService,
  searchHerbsService
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

export const searchHerbs = async (req, res, next) => {
  try {
    const herbs = await searchHerbsService(req.query);

    res.status(200).json({
      success: true,
      data: herbs
    });

  } catch (error) {
    next(error);
  }
};

export const updateHerb = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedHerb = await updateHerbService(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedHerb
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Admin: Delete Herb
 */
export const deleteHerb = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteHerbService(id);

    res.status(200).json({
      success: true,
      message: "Herb deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Admin: Update Herb Status
 */
export const updateHerbStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await updateHerbStatusService(id, status);

    res.status(200).json({
      success: true,
      data: updated
    });

  } catch (error) {
    next(error);
  }
};
