import { db } from "../config/firebase-admin.js";

const countersCollection = db.collection("_counters");

export const parseNumericId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const toEntityId = (docOrId, fallback = null) => {
  const rawId = typeof docOrId === "object" && docOrId !== null
    ? docOrId.data()?.id ?? docOrId.id
    : docOrId;

  const numericId = parseNumericId(rawId);
  return numericId ?? fallback;
};

export const getNextNumericId = async (collectionName) => {
  const counterRef = countersCollection.doc(collectionName);

  const nextId = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentValue = snapshot.exists ? Number(snapshot.data()?.value) || 0 : 0;
    const nextValue = currentValue + 1;

    transaction.set(
      counterRef,
      {
        value: nextValue,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return nextValue;
  });

  return nextId;
};

export const createNumericDoc = async (collectionName, payload) => {
  const id = await getNextNumericId(collectionName);
  const docRef = db.collection(collectionName).doc(String(id));

  await docRef.set({
    ...payload,
    id,
  });

  return {
    id,
    ref: docRef,
  };
};

export const resolveDocByNumericId = async (collectionName, id) => {
  const numericId = parseNumericId(id);
  if (!numericId) {
    return null;
  }

  const directDoc = await db.collection(collectionName).doc(String(numericId)).get();
  if (directDoc.exists) {
    return directDoc;
  }

  const snapshot = await db.collection(collectionName)
    .where("id", "==", numericId)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0];
};
