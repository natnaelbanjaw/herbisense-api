import { auth, db, timestamp } from "../../config/firebase-admin.js";
import { normalizeRole, ROLES } from "../../constants/roles.js";
import { createHttpError } from "../../utils/http-error.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatAdminProfile = (id, profile = {}) => ({
  id,
  full_name: profile.fullName || null,
  email: profile.email || null,
  role: profile.role || ROLES.ADMIN,
  is_verified: Boolean(profile.isVerified),
  created_at: toIsoString(profile.createdAt),
  updated_at: toIsoString(profile.updatedAt),
});

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

    await invalidateLocalCache(["admins:"]);

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

export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await withLocalCache("admins:all", async () => {
      const snapshot = await db
        .collection("users")
        .where("role", "in", [ROLES.ADMIN, ROLES.SUPER_ADMIN])
        .get();

      return snapshot.docs
        .map((doc) => formatAdminProfile(doc.id, doc.data()))
        .sort((left, right) => {
          const leftTime = Date.parse(left.created_at || "") || 0;
          const rightTime = Date.parse(right.created_at || "") || 0;
          return rightTime - leftTime;
        });
    });

    res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    next(error);
  }
};

export const getAdminProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "Admin id is required");
    }

    const admin = await withLocalCache(`admins:${id}`, async () => {
      const adminDoc = await db.collection("users").doc(id).get();

      if (!adminDoc.exists) {
        throw createHttpError(404, "Admin not found");
      }

      const adminData = adminDoc.data() || {};
      const adminRole = normalizeRole(adminData.role);

      if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(adminRole)) {
        throw createHttpError(404, "Admin not found");
      }

      return formatAdminProfile(adminDoc.id, adminData);
    });

    res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    next(error);
  }
};
