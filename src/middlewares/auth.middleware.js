import { auth, db } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";

const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createHttpError(401, "No token provided");
    }
    
    const token = authHeader.slice(7).trim();

    if (!token) {
      throw createHttpError(401, "No token provided");
    }
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Attach user to request
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      fullName: userData.fullName || decodedToken.name,
      role: userData.role || decodedToken.role || "user",
      isVerified: decodedToken.email_verified,
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token"
    });
  }
};

export default firebaseAuthMiddleware;
