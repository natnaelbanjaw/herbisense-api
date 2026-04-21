import env from "../../config/env.js";
import {
  getCurrentUserService,
  loginService,
  registerService
} from "../../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerService(req.body || {});

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginService({
      ...req.body,
      apiKey: env.FIREBASE_WEB_API_KEY
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getCurrentUserService(req.user.uid);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
