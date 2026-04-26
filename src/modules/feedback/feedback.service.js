import { db, timestamp } from "../../config/firebase-admin.js";
import { createNumericDoc, resolveDocByNumericId, toEntityId } from "../../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../../utils/local-cache.js";

const feedbackCollection = db.collection("feedback");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const formatFeedback = async (doc) => {
  const data = doc.data() || {};
  const userDoc = data.userId ? await db.collection("users").doc(String(data.userId)).get() : null;
  const userData = userDoc?.exists ? userDoc.data() || {} : {};

  return {
    id: toEntityId(doc, doc.id),
    name: data.name || null,
    email: data.email || null,
    message: data.message || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    user_id: data.userId || null,
    account_email: userData.email || null,
  };
};

export const createFeedbackService = async (userId, name, email, message) => {
  const now = timestamp.now();
  const { ref } = await createNumericDoc("feedback", {
    userId: String(userId),
    name,
    email,
    message,
    createdAt: now,
    updatedAt: now,
  });

  const createdDoc = await ref.get();
  await invalidateLocalCache(["feedback:"]);
  return await formatFeedback(createdDoc);
};

export const getMyFeedbackService = async (userId) => {
  return await withLocalCache(`feedback:user:${userId}`, async () => {
    const snapshot = await feedbackCollection
      .where("userId", "==", String(userId))
      .get();

    const feedback = await Promise.all(snapshot.docs.map((doc) => formatFeedback(doc)));

    feedback.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime() || 0;
      const rightTime = new Date(right.created_at).getTime() || 0;
      return rightTime - leftTime;
    });

    return feedback.map(({ account_email, ...item }) => item);
  });
};

export const getAllFeedbackService = async () => {
  return await withLocalCache("feedback:all", async () => {
    const snapshot = await feedbackCollection.get();
    const feedback = await Promise.all(snapshot.docs.map((doc) => formatFeedback(doc)));

    feedback.sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime() || 0;
      const rightTime = new Date(right.created_at).getTime() || 0;
      return rightTime - leftTime;
    });

    return feedback;
  });
};

export const deleteFeedbackService = async (id) => {
  const feedbackDoc = await resolveDocByNumericId("feedback", id);

  if (!feedbackDoc?.exists) {
    return null;
  }

  const formatted = await formatFeedback(feedbackDoc);
  await feedbackDoc.ref.delete();
  await invalidateLocalCache(["feedback:"]);
  return formatted;
};
