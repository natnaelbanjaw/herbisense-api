import env from "./config/env.js";
import { auth, db, timestamp } from "./config/firebase-admin.js";

const usersCollection = db.collection("users");
const metadataCollection = db.collection("_meta");
const schemaCollectionsCollection = metadataCollection.doc("schema").collection("collections");

const collectionDefinitions = [
  {
    name: "users",
    type: "root_collection",
    source: "001_create_users_table.sql",
    fields: [
      "fullName",
      "email",
      "role",
      "isVerified",
      "createdAt",
      "updatedAt"
    ],
    notes: [
      "Firebase Auth is the source of truth for credentials",
      "Firestore stores profile and role data"
    ]
  },
  {
    name: "conditions",
    type: "root_collection",
    source: "004_create_conditions_table.sql",
    fields: ["name", "description", "herbIds", "createdAt", "updatedAt"]
  },
  {
    name: "herbs",
    type: "root_collection",
    source: "002_create_herbs_table.sql",
    fields: [
      "name",
      "scientificName",
      "description",
      "preparation",
      "safetyWarning",
      "source",
      "status",
      "createdBy",
      "conditionIds",
      "averageRating",
      "ratingCount",
      "createdAt",
      "updatedAt"
    ]
  },
  {
    name: "herb_conditions",
    type: "join_collection",
    source: "010_link_herbs_and_conditions_columns.sql",
    fields: ["herbId", "conditionId", "createdAt"],
    notes: ["Legacy compatibility mapping for many-to-many links"]
  },
  {
    name: "recommendation_rules",
    type: "root_collection",
    source: "005_create_recommendation_rules_table.sql",
    fields: ["herbId", "conditionId", "priority", "createdAt"]
  },
  {
    name: "ratings",
    type: "root_collection",
    source: "007_create_ratings_table.sql",
    fields: [
      "userId",
      "herbId",
      "ruleId",
      "rating",
      "ratingValue",
      "comment",
      "createdAt",
      "updatedAt"
    ]
  },
  {
    name: "language_translations",
    type: "root_collection",
    source: "008_create_language_translations_table.sql",
    fields: [
      "herbId",
      "language",
      "translatedName",
      "translatedUses",
      "translatedPreparation",
      "translatedSafety",
      "source",
      "createdAt",
      "updatedAt"
    ]
  },
  {
    name: "herb_images",
    type: "root_collection",
    source: "009_create_herb_images_table.sql",
    fields: ["herbId", "imageUrl", "createdAt", "updatedAt"]
  },
  {
    name: "feedback",
    type: "root_collection",
    source: "013_create_feedback_table.sql + 014_update_feedback_remove_herb_add_contact_fields.sql",
    fields: ["userId", "name", "email", "message", "createdAt"]
  },
  {
    name: "saved_herbs",
    type: "root_collection",
    source: "015_create_saved_herbs_table.sql",
    fields: ["userId", "herbId", "createdAt"]
  },
  {
    name: "condition_translations",
    type: "root_collection",
    source: "016_create_condition_translations_table.sql",
    fields: [
      "conditionId",
      "language",
      "translatedName",
      "translatedDescription",
      "createdAt",
      "updatedAt"
    ]
  },
  {
    name: "users/{uid}/favorites",
    type: "subcollection",
    source: "003_create_favorites_table.sql",
    fields: ["herbId", "createdAt"],
    notes: ["Firebase implementation stores favorites under the user document"]
  }
];

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

const writeSchemaManifest = async () => {
  const batch = db.batch();

  batch.set(
    metadataCollection.doc("schema"),
    {
      initialized: true,
      source: "firebase-bootstrap",
      migratedFrom: "postgresql",
      collectionCount: collectionDefinitions.length,
      collections: collectionDefinitions.map((definition) => definition.name),
      updatedAt: timestamp.now()
    },
    { merge: true }
  );

  collectionDefinitions.forEach((definition) => {
    batch.set(
      schemaCollectionsCollection.doc(definition.name.replaceAll("/", "__")),
      {
        ...definition,
        updatedAt: timestamp.now()
      },
      { merge: true }
    );
  });

  await batch.commit();
};

const runBootstrap = async () => {
  console.log("Starting Firebase bootstrap...");
  console.log(
    "Reminder: Firebase Authentication Email/Password sign-in must be enabled in the Firebase Console."
  );

  const adminResult = await ensureAdminUser();
  await writeBootstrapMetadata(adminResult);
  await writeSchemaManifest();

  console.log(
    adminResult.created
      ? `Created Firebase admin user: ${adminResult.email}`
      : `Firebase admin user already exists: ${adminResult.email}`
  );
  console.log(`Admin uid: ${adminResult.uid}`);
  console.log(`Assigned role: ${adminResult.role}`);
  console.log(
    `Registered Firebase schema metadata for ${collectionDefinitions.length} collections/subcollections.`
  );
  console.log("Firebase bootstrap completed successfully.");
};

runBootstrap().catch((error) => {
  console.error("Firebase bootstrap failed:", error);
  process.exit(1);
});
