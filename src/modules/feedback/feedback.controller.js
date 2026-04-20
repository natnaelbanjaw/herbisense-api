import {
  createFeedbackService,
  getMyFeedbackService,
  getAllFeedbackService,
  deleteFeedbackService
} from "./feedback.service.js";
import { validateCreateFeedback, parseFeedbackId } from "./feedback.validation.js";

export const createFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validation = validateCreateFeedback(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(", ")
      });
    }

    const { name, email, message } = validation.value;
    const data = await createFeedbackService(userId, name, email, message);

    res.status(201).json({
      success: true,
      message: "Feedback submitted",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getMyFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await getMyFeedbackService(userId);

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFeedback = async (req, res, next) => {
  try {
    const data = await getAllFeedbackService();

    res.status(200).json({
      success: true,
      results: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req, res, next) => {
  try {
    const id = parseFeedbackId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer"
      });
    }

    const deleted = await deleteFeedbackService(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback deleted"
    });
  } catch (error) {
    next(error);
  }
};
