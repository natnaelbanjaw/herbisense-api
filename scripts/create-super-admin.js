import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    process.exit(1);
  }
} else {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

const createSuperAdmin = async () => {
  try {
    const email = "superadmin@herbisense.com";
    const password = "SuperAdmin123!";
    const fullName = "Super Administrator";

    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Super admin already exists: ${email}`);
      
      // Update custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: "super_admin",
        isSuperAdmin: true,
      });
      
      // Update Firestore
      await db.collection("users").doc(userRecord.uid).set({
        fullName: fullName,
        email: email,
        role: "super_admin",
        isVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log(`✅ Super admin role updated`);
      console.log(`\n📝 Login with:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      return;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create super admin
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: fullName,
      emailVerified: true,
    });

    console.log(`✅ Super admin user created: ${email}`);

    // Set custom claims for super admin
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "super_admin",
      isSuperAdmin: true,
    });

    console.log(`✅ Super admin role assigned`);

    // Create user profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      fullName: fullName,
      email: email,
      role: "super_admin",
      isVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Firestore profile created`);
    console.log(`\n📝 Super Admin Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n🔑 You can now login and create other admins using the /api/admin/create-admin endpoint`);

  } catch (error) {
    console.error("❌ Error creating super admin:", error.message);
    process.exit(1);
  }
};

createSuperAdmin().then(() => process.exit(0));
