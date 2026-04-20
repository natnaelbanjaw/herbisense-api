import {
  saveHerbImageService,
  getHerbImagesService,
  deleteImageService,
  getHerbsService
} from "./upload.service.js";

const parsePositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

export const uploadImage = async (req, res, next) => {
  try {
    const herbId = parsePositiveInt(req.body?.herbId);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/herbs/${req.file.filename}`;
    const data = await saveHerbImageService(herbId, imageUrl);

    res.status(201).json({
      success: true,
      message: "Image uploaded",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getHerbs = async (req, res, next) => {
  try {
    // const herbId = parsePositiveInt();

    // if (!herbId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "herbId must be a positive integer"
    //   });
    // }

    const data = await getHerbsService();

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getHerbImages = async (req, res, next) => {
  try {
    const herbId = parsePositiveInt(req.params.herbId);

    if (!herbId) {
      return res.status(400).json({
        success: false,
        message: "herbId must be a positive integer"
      });
    }

    const data = await getHerbImagesService(herbId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteImageService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Image deleted"
    });
  } catch (error) {
    next(error);
  }
};
