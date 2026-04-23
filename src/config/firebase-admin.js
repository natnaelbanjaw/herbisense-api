import admin from "firebase-admin";
import env from "./env.js";

// Initialize Firebase Admin SDK
let serviceAccount;

// Check if we have service account JSON in env
if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    // Parse the JSON string from .env
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("✅ Firebase service account loaded from env");
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    console.error("Make sure the JSON is properly formatted in your .env file");
    process.exit(1);
  }
} else {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is required in .env file");
  console.error("Please add your Firebase service account JSON to the .env file");
  process.exit(1);
}

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
const timestamp = admin.firestore.Timestamp;
const fieldValue = admin.firestore.FieldValue;

export { db, auth, bucket, timestamp, fieldValue };
