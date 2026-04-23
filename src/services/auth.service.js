import { auth, db } from "../config/firebase-admin.js";
import env from "../config/env.js";

const getFirebaseAuthUrl = (action) => {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw new Error("FIREBASE_WEB_API_KEY is required for Firebase email/password authentication");
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
      throw new Error("Invalid credentials");
    }

    throw new Error("Firebase sign-in failed");
  }

  return data;
};

export const loginService = async (email, password) => {
  try {
    const signInResult = await signInWithEmailAndPassword(email, password);
    const userRecord = await auth.getUser(signInResult.localId);

    // Get user data from Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.data() || {};

    return {
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        fullName: userData.fullName || userRecord.displayName,
        role: userData.role || "user",
        isVerified: userRecord.emailVerified
      },
      token: signInResult.idToken
    };
  } catch (error) {
    console.error("Login service error:", error);
    throw new Error("Invalid credentials");
  }
};

export const verifyToken = async (token) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(decodedToken.uid);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data() || {};
    
    return {
      id: userRecord.uid,
      email: userRecord.email,
      fullName: userData.fullName || userRecord.displayName,
      role: userData.role || "user",
      isVerified: userRecord.emailVerified
    };
  } catch (error) {
    console.error("Token verification error:", error);
    throw new Error("Invalid token");
  }
};
