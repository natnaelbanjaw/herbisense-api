import admin from "firebase-admin";
import fs from "fs";
import env from "./env.js";

const buildCredentialError = () => {
  throw new Error(
    "Firebase credentials are missing. Provide one of: " +
      "FIREBASE_SERVICE_ACCOUNT_JSON, serviceAccountKey.json, or the split vars " +
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
  );
};

const normalizeServiceAccount = (serviceAccount) => {
  if (
    serviceAccount &&
    typeof serviceAccount.private_key === "string"
  ) {
    serviceAccount.private_key = serviceAccount.private_key
      .replace(/^"(.*)"$/s, "$1")
      .replace(/\\n/g, "\n");
  }

  return serviceAccount;
};

const resolveCredential = () => {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const rawValue = env.FIREBASE_SERVICE_ACCOUNT_JSON
      .replace(/^'(.*)'$/s, "$1")
      .replace(/^"(.*)"$/s, "$1");
    const serviceAccount = normalizeServiceAccount(JSON.parse(rawValue));

    return admin.credential.cert(serviceAccount);
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_PATH_EXISTS) {
    const serviceAccount = normalizeServiceAccount(
      JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"))
    );

    return admin.credential.cert(serviceAccount);
  }

  const decodedBase64Key = env.FIREBASE_PRIVATE_KEY_BASE64
    ? Buffer.from(env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString("utf8")
    : "";

  if (
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    (env.FIREBASE_PRIVATE_KEY || decodedBase64Key)
  ) {
    return admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY || decodedBase64Key
    });
  }

  return buildCredentialError();
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
