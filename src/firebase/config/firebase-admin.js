import admin from "firebase-admin";
import fs from "fs";
import env from "./env.js";

const resolveCredential = () => {
  if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
    );

    return admin.credential.cert(serviceAccount);
  }

  return admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  });
};

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      credential: resolveCredential(),
      ...(env.FIREBASE_STORAGE_BUCKET
        ? { storageBucket: env.FIREBASE_STORAGE_BUCKET }
        : {})
    });

export const auth = admin.auth(app);
export const db = admin.firestore(app);
export const fieldValue = admin.firestore.FieldValue;
export const timestamp = admin.firestore.Timestamp;

export default app;
