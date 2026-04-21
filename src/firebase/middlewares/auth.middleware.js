import { auth, db } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";

const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createHttpError(401, "Unauthorized - No Firebase token provided");
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    const userProfileSnapshot = await db.collection("users").doc(decoded.uid).get();
    const profile = userProfileSnapshot.exists ? userProfileSnapshot.data() : {};

    req.user = {
      id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email || profile.email || null,
      role: profile.role || decoded.role || "user",
      firebase: decoded
    };

    next();
  } catch (error) {
    next(
      error.status
        ? error
        : createHttpError(401, "Unauthorized - Invalid Firebase token")
    );
  }
};

export default firebaseAuthMiddleware;
