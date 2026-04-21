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

const buildLegacyUserPayload = (uid, data = {}) => ({
  id: uid,
  full_name: data.fullName || "",
  email: data.email || "",
  role: data.role || "user"
});

const signInWithPassword = async ({ email, password, apiKey }) => {
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

  return payload;
};

export const registerService = async ({ fullName, email, password, apiKey }) => {
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
  const signInPayload = await signInWithPassword({ email, password, apiKey });

  return {
    user: buildLegacyUserPayload(userRecord.uid, userData),
    token: signInPayload.idToken
  };
};

export const loginService = async ({ email, password, apiKey }) => {
  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }
  const payload = await signInWithPassword({ email, password, apiKey });

  const userSnapshot = await usersCollection.doc(payload.localId).get();
  const userProfile = userSnapshot.exists
    ? buildUserProfile(payload.localId, userSnapshot.data())
    : null;

  return {
    user: buildLegacyUserPayload(payload.localId, userProfile || {}),
    token: payload.idToken
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

    return buildLegacyUserPayload(uid, {
      ...fallbackData,
      createdAt: null,
      updatedAt: null
    });
  }

  return buildLegacyUserPayload(uid, snapshot.data());
};
