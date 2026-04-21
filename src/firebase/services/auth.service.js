import { auth, db, fieldValue, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";

const usersCollection = db.collection("users");

const buildUserProfile = (uid, data = {}) => ({
  id: uid,
  uid,
  fullName: data.fullName || "",
  email: data.email || "",
  role: data.role || "user",
  isVerified: Boolean(data.isVerified),
  createdAt: data.createdAt || null,
  updatedAt: data.updatedAt || null
});

export const registerService = async ({ fullName, email, password }) => {
  if (!fullName || !email || !password) {
    throw createHttpError(400, "fullName, email and password are required");
  }

  let userRecord;

  try {
    userRecord = await auth.createUser({
      displayName: fullName,
      email,
      password
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      throw createHttpError(409, "Email already registered");
    }

    throw error;
  }

  const userData = {
    fullName,
    email,
    role: "user",
    isVerified: userRecord.emailVerified,
    createdAt: timestamp.now(),
    updatedAt: timestamp.now()
  };

  await auth.setCustomUserClaims(userRecord.uid, { role: "user" });
  await usersCollection.doc(userRecord.uid).set(userData);

  const customToken = await auth.createCustomToken(userRecord.uid, { role: "user" });

  return {
    user: buildUserProfile(userRecord.uid, userData),
    customToken
  };
};

export const loginService = async ({ email, password, apiKey }) => {
  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }

  if (!apiKey) {
    throw createHttpError(
      500,
      "Missing FIREBASE_WEB_API_KEY for email/password login"
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw createHttpError(401, payload?.error?.message || "Invalid credentials");
  }

  const userSnapshot = await usersCollection.doc(payload.localId).get();
  const userProfile = userSnapshot.exists
    ? buildUserProfile(payload.localId, userSnapshot.data())
    : null;

  return {
    user: userProfile,
    token: {
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      expiresIn: payload.expiresIn
    }
  };
};

export const getCurrentUserService = async (uid) => {
  const snapshot = await usersCollection.doc(uid).get();

  if (!snapshot.exists) {
    const userRecord = await auth.getUser(uid);
    const fallbackData = {
      fullName: userRecord.displayName || "",
      email: userRecord.email || "",
      role: "user",
      isVerified: userRecord.emailVerified,
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp()
    };

    await usersCollection.doc(uid).set(fallbackData, { merge: true });

    return buildUserProfile(uid, {
      ...fallbackData,
      createdAt: null,
      updatedAt: null
    });
  }

  return buildUserProfile(uid, snapshot.data());
};
