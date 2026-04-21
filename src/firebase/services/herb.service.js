import { db, fieldValue, timestamp } from "../config/firebase-admin.js";
import { createHttpError } from "../utils/http-error.js";
import { mapDoc, normalizeArray, normalizeString } from "../utils/documents.js";

const herbsCollection = db.collection("herbs");
const conditionsCollection = db.collection("conditions");

const buildHerbPayload = (data = {}, userId = null) => {
  const name = normalizeString(data.name);

  if (!name) {
    throw createHttpError(400, "name is required");
  }

  return {
    name,
    scientificName: normalizeString(data.scientificName),
    description: normalizeString(data.description),
    preparation: normalizeString(data.preparation),
    safetyWarning: normalizeString(data.safetyWarning),
    source: normalizeString(data.source),
    status: normalizeString(data.status || "pending").toLowerCase() || "pending",
    conditionIds: normalizeArray(data.conditionIds || data.condition_ids),
    createdBy: userId,
    updatedAt: timestamp.now()
  };
};

const loadConditions = async (conditionIds = []) => {
  if (!conditionIds.length) {
    return [];
  }

  const snapshots = await Promise.all(
    conditionIds.map((conditionId) => conditionsCollection.doc(conditionId).get())
  );

  const missingIds = snapshots
    .filter((snapshot) => !snapshot.exists)
    .map((snapshot, index) => (snapshot.exists ? null : conditionIds[index]))
    .filter(Boolean);

  if (missingIds.length) {
    throw createHttpError(
      400,
      `conditionIds do not exist: ${missingIds.join(", ")}`
    );
  }

  return snapshots.map(mapDoc);
};

const syncConditionLinks = async (transaction, herbId, previousIds = [], nextIds = []) => {
  const previousSet = new Set(previousIds);
  const nextSet = new Set(nextIds);

  for (const conditionId of previousSet) {
    if (!nextSet.has(conditionId)) {
      transaction.set(
        conditionsCollection.doc(conditionId),
        {
          herbIds: fieldValue.arrayRemove(herbId),
          updatedAt: timestamp.now()
        },
        { merge: true }
      );
    }
  }

  for (const conditionId of nextSet) {
    transaction.set(
      conditionsCollection.doc(conditionId),
      {
        herbIds: fieldValue.arrayUnion(herbId),
        updatedAt: timestamp.now()
      },
      { merge: true }
    );
  }
};

export const createHerbService = async (data, userId) => {
  const payload = buildHerbPayload(data, userId);
  await loadConditions(payload.conditionIds);

  const herbRef = herbsCollection.doc();

  await db.runTransaction(async (transaction) => {
    transaction.set(herbRef, {
      ...payload,
      averageRating: 0,
      ratingCount: 0,
      createdAt: timestamp.now()
    });

    await syncConditionLinks(transaction, herbRef.id, [], payload.conditionIds);
  });

  return getHerbByIdService(herbRef.id);
};

export const getHerbByIdService = async (id) => {
  const snapshot = await herbsCollection.doc(String(id)).get();

  if (!snapshot.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const herb = mapDoc(snapshot);
  const conditions = await loadConditions(herb.conditionIds || []);

  return {
    ...herb,
    conditions
  };
};

export const getHerbsService = async ({ status, search, conditionId }) => {
  let query = herbsCollection.orderBy("createdAt", "desc");
  const normalizedStatus = normalizeString(status).toLowerCase();

  if (normalizedStatus) {
    query = query.where("status", "==", normalizedStatus);
  }

  const snapshot = await query.get();
  let herbs = snapshot.docs.map(mapDoc);

  if (conditionId) {
    herbs = herbs.filter((herb) => (herb.conditionIds || []).includes(String(conditionId)));
  }

  const normalizedSearch = normalizeString(search).toLowerCase();

  if (normalizedSearch) {
    herbs = herbs.filter((herb) => {
      const haystack = [
        herb.name,
        herb.scientificName,
        herb.description,
        herb.preparation
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }

  return herbs;
};

export const updateHerbService = async (id, data) => {
  const herbRef = herbsCollection.doc(String(id));
  const existingSnapshot = await herbRef.get();

  if (!existingSnapshot.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const existing = existingSnapshot.data();
  const payload = buildHerbPayload(
    {
      ...existing,
      ...data,
      conditionIds: data.conditionIds || data.condition_ids || existing.conditionIds
    },
    existing.createdBy || null
  );

  await loadConditions(payload.conditionIds);

  await db.runTransaction(async (transaction) => {
    transaction.set(
      herbRef,
      {
        ...payload,
        createdAt: existing.createdAt || timestamp.now()
      },
      { merge: true }
    );

    await syncConditionLinks(
      transaction,
      herbRef.id,
      existing.conditionIds || [],
      payload.conditionIds
    );
  });

  return getHerbByIdService(herbRef.id);
};

export const deleteHerbService = async (id) => {
  const herbRef = herbsCollection.doc(String(id));
  const snapshot = await herbRef.get();

  if (!snapshot.exists) {
    throw createHttpError(404, "Herb not found");
  }

  const herb = snapshot.data();

  await db.runTransaction(async (transaction) => {
    transaction.delete(herbRef);
    await syncConditionLinks(transaction, herbRef.id, herb.conditionIds || [], []);
  });

  return { id: herbRef.id };
};
