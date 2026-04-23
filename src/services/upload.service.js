import { db, bucket, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";
import { createNumericDoc, toEntityId } from "../utils/firestore-id.js";

const uploadsCollection = db.collection("uploads");

/**
 * Upload a file to Firebase Storage and save metadata to Firestore
 */
export const uploadFileService = async (file, userId, folder = "herb-images") => {
  try {
    if (!file) {
      throw createHttpError(400, "No file provided");
    }

    // Generate unique filename
    const timestamp_ms = Date.now();
    const fileExtension = file.originalname.split(".").pop();
    const safeFileName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 100);
    const fileName = `${userId}_${timestamp_ms}_${safeFileName}`;
    const filePath = `${folder}/${fileName}`;

    // Get reference to storage
    const fileRef = bucket.file(filePath);

    // Upload file to Firebase Storage
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          uploadedAt: timestamp_ms.toString(),
          fileSize: file.size.toString(),
        },
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Save metadata to Firestore
    const uploadDoc = {
      fileName: fileName,
      originalName: file.originalname,
      filePath: filePath,
      fileUrl: publicUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId,
      folder: folder,
      createdAt: timestamp.now(),
      updatedAt: timestamp.now(),
    };

    const { ref: docRef } = await createNumericDoc("uploads", uploadDoc);

    return {
      id: toEntityId(await docRef.get(), docRef.id),
      ...uploadDoc,
    };
  } catch (error) {
    console.error("Upload service error:", error);
    throw createHttpError(500, `Upload failed: ${error.message}`);
  }
};

/**
 * Get file metadata by ID
 */
export const getFileService = async (fileId) => {
  const snapshot = await uploadsCollection.doc(fileId).get();

  if (!snapshot.exists) {
    throw createHttpError(404, "File not found");
  }

  const fileData = snapshot.data();
  return {
    id: toEntityId(snapshot, snapshot.id),
    ...fileData,
  };
};

/**
 * Get all files uploaded by a user
 */
export const getUserFilesService = async (userId, folder = null) => {
  let query = uploadsCollection.where("uploadedBy", "==", userId);
  
  if (folder) {
    query = query.where("folder", "==", folder);
  }
  
  const snapshot = await query.orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => ({
    id: toEntityId(doc, doc.id),
    ...doc.data(),
  }));
};

/**
 * Delete a file from storage and Firestore
 */
export const deleteFileService = async (fileId, userId) => {
  const fileData = await getFileService(fileId);

  // Check ownership
  if (fileData.uploadedBy !== userId) {
    throw createHttpError(403, "Unauthorized to delete this file");
  }

  // Delete from Firebase Storage
  const fileRef = bucket.file(fileData.filePath);
  await fileRef.delete();

  // Delete from Firestore
  await uploadsCollection.doc(fileId).delete();

  return { success: true, message: "File deleted successfully" };
};

/**
 * Update file metadata (e.g., for herb association)
 */
export const updateFileMetadataService = async (fileId, updates) => {
  const fileRef = uploadsCollection.doc(fileId);
  const snapshot = await fileRef.get();

  if (!snapshot.exists) {
    throw createHttpError(404, "File not found");
  }

  await fileRef.update({
    ...updates,
    updatedAt: timestamp.now(),
  });

  return getFileService(fileId);
};

/**
 * Associate file with a herb
 */
export const associateFileWithHerbService = async (fileId, herbId, userId) => {
  const fileData = await getFileService(fileId);

  if (fileData.uploadedBy !== userId) {
    throw createHttpError(403, "Unauthorized to associate this file");
  }

  await uploadsCollection.doc(fileId).update({
    herbId: herbId,
    updatedAt: timestamp.now(),
  });

  return getFileService(fileId);
};

/**
 * Get all files for a specific herb
 */
export const getHerbFilesService = async (herbId) => {
  const snapshot = await uploadsCollection
    .where("herbId", "==", herbId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: toEntityId(doc, doc.id),
    ...doc.data(),
  }));
};
