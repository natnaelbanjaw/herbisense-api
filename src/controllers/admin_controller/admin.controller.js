import { auth, db, timestamp } from "../../config/firebase-admin.js";
import { normalizeRole, ROLES } from "../../constants/roles.js";

export const createAdmin = async (req, res, next) => {
  try {
    if (normalizeRole(req.user.role) !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only super_admin can create admins"
      });
    }

    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required"
      });
    }

    // Check if user exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      // If we get here, user exists
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    } catch (error) {
      // User not found - this is what we want
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create user in Firebase Auth
    userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: fullName,
      emailVerified: true,
    });

    // Set custom claims for admin role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: ROLES.ADMIN,
      isAdmin: true,
    });

    // Create user profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: ROLES.ADMIN,
      isVerified: true,
      createdAt: timestamp.now(),
      updatedAt: timestamp.now(),
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: userRecord.uid,
        full_name: fullName,
        email: email,
        role: ROLES.ADMIN
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    next(error);
  }
};