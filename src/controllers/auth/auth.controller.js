import { loginService, registerService, verifyTokenService } from "../../modules/auth/auth.service.js";
import { createHttpError } from "../../utils/http-error.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw createHttpError(400, "Email and password are required");
    }
    
    const result = await loginService(email, password);
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      throw createHttpError(400, "Email, password, and fullName are required");
    }
    
    const result = await registerService(email, password, fullName);
    
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      throw createHttpError(401, "No token provided");
    }
    
    const user = await verifyTokenService(token);
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
