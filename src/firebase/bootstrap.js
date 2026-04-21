import env from "./config/env.js";
import { auth, db, timestamp } from "./config/firebase-admin.js";

const usersCollection = db.collection("users");
const metadataCollection = db.collection("_meta");

const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : "super_admin";

const ensureAdminUser = async () => {
  const email = env.FIREBASE_BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  const password = env.FIREBASE_BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = env.FIREBASE_BOOTSTRAP_ADMIN_NAME.trim();
  const role = normalizeRole(env.FIREBASE_BOOTSTRAP_ADMIN_ROLE);

  if (!email || !password || !fullName) {
    throw new Error(
      "Firebase bootstrap admin config is incomplete. " +
        "Set FIREBASE_BOOTSTRAP_ADMIN_EMAIL, FIREBASE_BOOTSTRAP_ADMIN_PASSWORD, and FIREBASE_BOOTSTRAP_ADMIN_NAME."
    );
  }

  let userRecord;
  let created = false;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    userRecord = await auth.createUser({
      displayName: fullName,
      email,
      password,
      emailVerified: true
    });
    created = true;
  }

  await auth.updateUser(userRecord.uid, {
    displayName: fullName,
    emailVerified: true
  });

  await auth.setCustomUserClaims(userRecord.uid, {
    role,
    isSuperAdmin: role === "super_admin"
  });

  const existingProfile = await usersCollection.doc(userRecord.uid).get();

  await usersCollection.doc(userRecord.uid).set(
    {
      fullName,
      email,
      role,
      isVerified: true,
      updatedAt: timestamp.now(),
      ...(existingProfile.exists ? {} : { createdAt: timestamp.now() })
    },
    { merge: true }
  );

  return {
    uid: userRecord.uid,
    email,
    role,
    created
  };
};

const writeBootstrapMetadata = async (adminResult) => {
  await metadataCollection.doc("bootstrap").set(
    {
      initialized: true,
      admin: adminResult,
      updatedAt: timestamp.now()
    },
    { merge: true }
  );
};

const runBootstrap = async () => {
  console.log("Starting Firebase bootstrap...");
  console.log(
    "Reminder: Firebase Authentication Email/Password sign-in must be enabled in the Firebase Console."
  );

  const adminResult = await ensureAdminUser();
  await writeBootstrapMetadata(adminResult);

  console.log(
    adminResult.created
      ? `Created Firebase admin user: ${adminResult.email}`
      : `Firebase admin user already exists: ${adminResult.email}`
  );
  console.log(`Admin uid: ${adminResult.uid}`);
  console.log(`Assigned role: ${adminResult.role}`);
  console.log("Firebase bootstrap completed successfully.");
};

runBootstrap().catch((error) => {
  console.error("Firebase bootstrap failed:", error);
  process.exit(1);
});
