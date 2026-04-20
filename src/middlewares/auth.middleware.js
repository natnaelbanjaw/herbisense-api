import { verifyToken } from "../utils/jwt.js";
import { normalizeRole } from "../constants/roles.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw { status: 401, message: "Unauthorized - No token provided" };
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    req.user = {
      ...decoded,
      role: normalizeRole(decoded.role)
    };

    next();

  } catch (error) {
    next({ status: 401, message: "Unauthorized - Invalid token" });
  }
};

export default authMiddleware;
