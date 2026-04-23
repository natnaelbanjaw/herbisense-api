import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { createNumericDoc } from "../utils/firestore-id.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Firebase
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

const setupCompleteFirestoreStructure = async () => {
  try {
    console.log("🔥 Starting complete Firebase migration...");

    // Create all collections by adding sample documents
    const collections = {
      users: null,
      herbs: null,
      conditions: null,
      ratings: null,
      recommendation_rules: null,
      language_translations: null,
      condition_translations: null,
      feedback: null,
      saved_herbs: null,
      favorites: null,
      herb_images: null,
      uploads: null
    };

    // 1. Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@herbisense.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
    
    let adminUid;
    try {
      const existingUser = await auth.getUserByEmail(adminEmail);
      adminUid = existingUser.uid;
      console.log(`✅ Admin user exists: ${adminEmail}`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        const userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: "System Administrator",
          emailVerified: true
        });
        adminUid = userRecord.uid;
        
        await auth.setCustomUserClaims(adminUid, {
          role: "super_admin",
          isSuperAdmin: true
        });
        
        console.log(`✅ Admin user created: ${adminEmail}`);
      } else {
        throw error;
      }
    }

    // Create user profile in Firestore
    await db.collection("users").doc(adminUid).set({
      fullName: "System Administrator",
      email: adminEmail,
      role: "super_admin",
      isVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log("✅ User profile created");

    // 2. Create sample condition
    const conditionData = {
      name: "Skin Inflammation",
      description: "Inflammatory skin conditions including rashes, irritation, and swelling",
      herbIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: conditionId, ref: conditionRef } = await createNumericDoc("conditions", conditionData);
    console.log(`✅ Condition created: ${conditionId}`);

    // 3. Create condition translation
    const conditionTranslationData = {
      conditionId: conditionId,
      language: "AM",
      translatedName: "የቆዳ በሽታ",
      translatedDescription: "የቆዳ ማበጥ፣ መቅላት እና መበሳጨትን የሚያካትት የቆዳ በሽታ",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: conditionTranslationId } = await createNumericDoc("condition_translations", conditionTranslationData);
    console.log(`✅ Condition translation created: ${conditionTranslationId}`);

    // 4. Create sample herb with source field
    const herbData = {
      name: "Aloe Vera",
      scientificName: "Aloe barbadensis miller",
      description: "A succulent plant widely used in traditional medicine for skin conditions",
      preparation: "Extract gel from fresh leaves and apply topically to affected area",
      safetyWarning: "Avoid if allergic to plants in the Liliaceae family. Do not ingest.",
      source: "Traditional medicine and scientific studies",
      status: "published",
      createdBy: adminUid,
      conditionIds: [conditionId],
      averageRating: 0,
      ratingCount: 0,
      imageUrl: "https://storage.googleapis.com/herbisense/herbs/aloe-vera.jpg",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: herbId, ref: herbRef } = await createNumericDoc("herbs", herbData);
    console.log(`✅ Herb created: ${herbId}`);

    // 5. Update condition with herb ID
    await conditionRef.update({
      herbIds: admin.firestore.FieldValue.arrayUnion(herbId)
    });
    console.log("✅ Condition updated with herb reference");

    // 6. Create herb image (subcollection)
    const herbImageData = {
      imageUrl: "https://storage.googleapis.com/herbisense/herbs/aloe-vera-leaf.jpg",
      isPrimary: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const herbImageRef = await db.collection("herbs").doc(String(herbId)).collection("images").add(herbImageData);
    console.log(`✅ Herb image created: ${herbImageRef.id}`);

    // 7. Create language translation with source field
    const translationData = {
      herbId: herbId,
      language: "AM",
      translatedName: "አሎ ቬራ",
      translatedUses: "ለቆዳ በሽታዎች፣ ለቃጠሎ እና ለቁስል ፈውስ ይጠቅማል",
      translatedPreparation: "ከቅጠሉ ጂል አውጥተው በተጎዳው ቦታ ላይ ይጠቀሙ",
      translatedSafety: "ከመጠቀምዎ በፊት የቆዳ ምርመራ ያድርጉ። አይውጡ",
      source: "Traditional Ethiopian medicine",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: translationId } = await createNumericDoc("language_translations", translationData);
    console.log(`✅ Language translation created: ${translationId}`);

    // 8. Create recommendation rule
    const ruleData = {
      herbId: herbId,
      conditionId: conditionId,
      priority: 10,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: ruleId, ref: ruleRef } = await createNumericDoc("recommendation_rules", ruleData);
    console.log(`✅ Recommendation rule created: ${ruleId}`);

    // 9. Create rating
    const ratingData = {
      userId: adminUid,
      herbId: herbId,
      ruleId: ruleId,
      rating: 5,
      ratingValue: 5,
      comment: "Excellent herb for skin conditions!",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: ratingId } = await createNumericDoc("ratings", ratingData);
    console.log(`✅ Rating created: ${ratingId}`);

    // 10. Create favorite (subcollection under user)
    const favoriteData = {
      herbId: herbId,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("users").doc(adminUid).collection("favorites").doc(String(herbId)).set(favoriteData);
    console.log("✅ Favorite created");

    // 11. Create saved herb
    const savedHerbData = {
      userId: adminUid,
      herbId: herbId,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: savedHerbId } = await createNumericDoc("saved_herbs", savedHerbData);
    console.log(`✅ Saved herb created: ${savedHerbId}`);

    // 12. Create feedback
    const feedbackData = {
      userId: adminUid,
      name: "System Administrator",
      email: adminEmail,
      message: "Firebase migration completed successfully. The system is now running on Firestore!",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: feedbackId } = await createNumericDoc("feedback", feedbackData);
    console.log(`✅ Feedback created: ${feedbackId}`);

    // 13. Create uploads collection structure
    const uploadData = {
      fileName: "sample-herb-image.jpg",
      originalName: "aloe-vera.jpg",
      fileUrl: "https://storage.googleapis.com/herbisense/uploads/sample.jpg",
      fileSize: 1024000,
      mimeType: "image/jpeg",
      uploadedBy: adminUid,
      herbId: herbId,
      folder: "herb-images",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const { id: uploadId } = await createNumericDoc("uploads", uploadData);
    console.log(`✅ Upload record created: ${uploadId}`);

    // 14. Update herb average rating
    await herbRef.update({
      averageRating: 5,
      ratingCount: 1
    });
    console.log("✅ Herb rating updated");

    // 15. Create metadata document
    await db.collection("_meta").doc("schema").set({
      version: "1.0.0",
      migratedFrom: "postgresql",
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      collections: Object.keys(collections),
      tables: [
        "users", "herbs", "conditions", "favorites", "recommendation_rules",
        "ratings", "language_translations", "herb_images", "feedback",
        "saved_herbs", "condition_translations", "uploads"
      ],
      adminUser: {
        uid: adminUid,
        email: adminEmail
      }
    });
    console.log("✅ Metadata created");

    console.log("\n🎉 Complete Firebase migration finished successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Collections created: ${Object.keys(collections).length}`);
    console.log(`   - Admin user: ${adminEmail}`);
    console.log(`   - Sample herb: ${herbId}`);
    console.log(`   - Sample condition: ${conditionId}`);
    console.log("\n📝 Next steps:");
    console.log("1. Deploy Firestore security rules");
    console.log("2. Create composite indexes in Firebase Console");
    console.log("3. Update your service files to use Firestore");
    console.log("4. Test all API endpoints");

    // Print required indexes
    console.log("\n🔧 Required Composite Indexes (Create in Firebase Console):");
    console.log(`
    Collection: herbs
    - Fields: status (Ascending), createdAt (Descending)
    - Fields: name (Ascending)
    
    Collection: ratings  
    - Fields: herbId (Ascending), rating (Descending)
    - Fields: userId (Ascending), createdAt (Descending)
    
    Collection: language_translations
    - Fields: herbId (Ascending), language (Ascending)
    
    Collection: condition_translations
    - Fields: conditionId (Ascending), language (Ascending)
    
    Collection: recommendation_rules
    - Fields: conditionId (Ascending), priority (Descending)
    
    Collection: feedback
    - Fields: userId (Ascending), createdAt (Descending)
    - Fields: email (Ascending), createdAt (Descending)
    
    Collection: saved_herbs
    - Fields: userId (Ascending), savedAt (Descending)
    `);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

setupCompleteFirestoreStructure();
