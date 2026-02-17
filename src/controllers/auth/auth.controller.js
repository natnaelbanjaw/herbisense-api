import {
  registerService,
  loginService
} from "../../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const result = await registerService(fullName, email, password);

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
    const { email, password } = req.body;

    const result = await loginService(email, password);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};
