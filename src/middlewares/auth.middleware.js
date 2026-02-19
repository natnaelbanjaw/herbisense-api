import { verifyToken } from "../utils/jwt.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw { status: 401, message: "Unauthorized - No token provided" };
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    req.user = decoded; // attach user payload to request

    next();

  } catch (error) {
    next({ status: 401, message: "Unauthorized - Invalid token" });
  }
};

export default authMiddleware;
