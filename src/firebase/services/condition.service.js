import { db, fieldValue, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";
import { mapDoc, normalizeArray, normalizeString } from "../utils/documents.js";

const conditionsCollection = db.collection("conditions");
const herbsCollection = db.collection("herbs");

const buildConditionPayload = (data = {}) => {
  const name = normalizeString(data.name);

  if (!name) {
    throw createHttpError(400, "name is required");
  }

  return {
    name,
    description: normalizeString(data.description),
    herbIds: normalizeArray(data.herbIds),
    updatedAt: timestamp.now()
  };
};

const loadHerbs = async (herbIds = []) => {
  if (!herbIds.length) {
    return [];
  }

  const snapshots = await Promise.all(
    herbIds.map((herbId) => herbsCollection.doc(herbId).get())
  );

  const missingIds = snapshots
    .filter((snapshot) => !snapshot.exists)
    .map((snapshot, index) => (snapshot.exists ? null : herbIds[index]))
    .filter(Boolean);

  if (missingIds.length) {
    throw createHttpError(400, `herbIds do not exist: ${missingIds.join(", ")}`);
  }

  return snapshots.map(mapDoc);
};

const syncHerbLinks = async (transaction, conditionId, previousIds = [], nextIds = []) => {
  const previousSet = new Set(previousIds);
  const nextSet = new Set(nextIds);

  for (const herbId of previousSet) {
    if (!nextSet.has(herbId)) {
      transaction.set(
        herbsCollection.doc(herbId),
        {
          conditionIds: fieldValue.arrayRemove(conditionId),
          updatedAt: timestamp.now()
        },
        { merge: true }
      );
    }
  }

  for (const herbId of nextSet) {
    transaction.set(
      herbsCollection.doc(herbId),
      {
        conditionIds: fieldValue.arrayUnion(conditionId),
        updatedAt: timestamp.now()
      },
      { merge: true }
    );
  }
};

export const createConditionService = async (data) => {
  const payload = buildConditionPayload(data);
  await loadHerbs(payload.herbIds);

  const conditionRef = conditionsCollection.doc();

  await db.runTransaction(async (transaction) => {
    transaction.set(conditionRef, {
      ...payload,
      createdAt: timestamp.now()
    });

    await syncHerbLinks(transaction, conditionRef.id, [], payload.herbIds);
  });

  return getConditionByIdService(conditionRef.id);
};

export const getConditionsService = async () => {
  const snapshot = await conditionsCollection.orderBy("name", "asc").get();
  return snapshot.docs.map(mapDoc);
};

export const getConditionByIdService = async (id) => {
  const snapshot = await conditionsCollection.doc(String(id)).get();

  if (!snapshot.exists) {
    throw createHttpError(404, "Condition not found");
  }

  const condition = mapDoc(snapshot);
  const herbs = await loadHerbs(condition.herbIds || []);

  return {
    ...condition,
    herbs
  };
};

export const updateConditionService = async (id, data) => {
  const conditionRef = conditionsCollection.doc(String(id));
  const existingSnapshot = await conditionRef.get();

  if (!existingSnapshot.exists) {
    throw createHttpError(404, "Condition not found");
  }

  const existing = existingSnapshot.data();
  const payload = buildConditionPayload({
    ...existing,
    ...data,
    herbIds: data.herbIds || existing.herbIds
  });

  await loadHerbs(payload.herbIds);

  await db.runTransaction(async (transaction) => {
    transaction.set(
      conditionRef,
      {
        ...payload,
        createdAt: existing.createdAt || timestamp.now()
      },
      { merge: true }
    );

    await syncHerbLinks(
      transaction,
      conditionRef.id,
      existing.herbIds || [],
      payload.herbIds
    );
  });

  return getConditionByIdService(conditionRef.id);
};

export const deleteConditionService = async (id) => {
  const conditionRef = conditionsCollection.doc(String(id));
  const snapshot = await conditionRef.get();

  if (!snapshot.exists) {
    throw createHttpError(404, "Condition not found");
  }

  const condition = snapshot.data();

  await db.runTransaction(async (transaction) => {
    transaction.delete(conditionRef);
    await syncHerbLinks(transaction, conditionRef.id, condition.herbIds || [], []);
  });

  return { id: conditionRef.id };
};
