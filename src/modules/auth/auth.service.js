import { auth, db, timestamp } from "../../config/firebase-admin.js";
import env from "../../config/env.js";
import { createHttpError } from "../../utils/http-error.js";

const getFirebaseAuthUrl = (action) => {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw createHttpError(
      500,
      "FIREBASE_WEB_API_KEY is required for Firebase email/password authentication"
    );
  }

  return `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${env.FIREBASE_WEB_API_KEY}`;
};

const signInWithEmailAndPassword = async (email, password) => {
  const response = await fetch(getFirebaseAuthUrl("signInWithPassword"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const firebaseMessage = data?.error?.message;
    if (
      firebaseMessage === "EMAIL_NOT_FOUND" ||
      firebaseMessage === "INVALID_PASSWORD" ||
      firebaseMessage === "INVALID_LOGIN_CREDENTIALS"
    ) {
      throw createHttpError(401, "Invalid credentials");
    }

    throw createHttpError(401, "Firebase sign-in failed");
  }

  return data;
};

export const loginService = async (email, password) => {
  try {
    const signInResult = await signInWithEmailAndPassword(email, password);
    const userRecord = await auth.getUser(signInResult.localId);

    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    return {
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        fullName: userData.fullName || userRecord.displayName,
        role: userData.role || "user",
        isVerified: userRecord.emailVerified,
      },
      token: signInResult.idToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (error.status) {
      throw error;
    }
    throw createHttpError(401, "Invalid credentials");
  }
};

export const registerService = async (email, password, fullName) => {
  try {
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        throw createHttpError(409, "User already exists");
      }
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }
    
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: fullName,
      emailVerified: false,
    });
    
    await db.collection("users").doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: "user",
      isVerified: false,
      createdAt: timestamp.now(),
      updatedAt: timestamp.now(),
    });
    
    const signInResult = await signInWithEmailAndPassword(email, password);

    return {
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        fullName: fullName,
        role: "user",
        isVerified: false,
      },
      token: signInResult.idToken,
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error.status) {
      throw error;
    }
    throw createHttpError(400, error.message);
  }
};

export const verifyTokenService = async (token) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    return {
      id: userRecord.uid,
      email: userRecord.email,
      fullName: userData.fullName || userRecord.displayName,
      role: userData.role || "user",
      isVerified: userRecord.emailVerified,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    throw createHttpError(401, "Invalid token");
  }
};
