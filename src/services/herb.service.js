import {
  getRecommendedHerbsQuery,
  searchHerbsQuery
} from "../database/queries/herb.query.js";
import { getConditionByIdQuery } from "../database/queries/condition.query.js";
import { db, timestamp } from "../config/firebase-admin.js";
import {
  createNumericDoc,
  getNextNumericId,
  parseNumericId,
  resolveDocByNumericId,
  toEntityId,
} from "../utils/firestore-id.js";
import { invalidateLocalCache, withLocalCache } from "../utils/local-cache.js";

const herbsCollection = db.collection("herbs");
const conditionsCollection = db.collection("conditions");

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return value;
};

const ensureNumericEntityId = async (collectionName, doc) => {
  const currentId = toEntityId(doc, null);
  if (currentId) {
    if (doc.data()?.id !== currentId) {
      await doc.ref.set({ id: currentId }, { merge: true });
    }
    return currentId;
  }

  const generatedId = await getNextNumericId(collectionName);
  await doc.ref.set(
    {
      id: generatedId,
      legacyId: doc.id,
    },
    { merge: true }
  );
  return generatedId;
};

const formatCondition = async (doc) => {
  const data = doc.data() || {};
  const entityId = await ensureNumericEntityId("conditions", doc);

  return {
    id: entityId,
    name: data.name || null,
    description: data.description || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
  };
};

const formatHerbDocument = async (doc) => {
  const data = doc.data();
  const herbId = await ensureNumericEntityId("herbs", doc);
  const conditionIds = Array.isArray(data.conditionIds)
    ? data.conditionIds
        .map((value) => parseNumericId(value))
        .filter(Boolean)
    : [];

  const conditionDocs = conditionIds.length
    ? await Promise.all(
        conditionIds.map(async (conditionId) => {
          const conditionDoc = await resolveDocByNumericId("conditions", conditionId);
          return conditionDoc?.exists
            ? await formatCondition(conditionDoc)
            : null;
        })
      )
    : [];

  const conditions = conditionDocs.filter(Boolean);
  const primaryCondition = conditions[0] || null;

  return {
    id: herbId,
    name: data.name || null,
    scientific_name: data.scientificName || null,
    description: data.description || null,
    preparation: data.preparation || null,
    safety_warning: data.safetyWarning || null,
    source: data.source || null,
    status: data.status || "pending",
    created_by: parseNumericId(data.createdBy) ?? data.createdBy ?? null,
    condition_id: primaryCondition?.id || null,
    average_rating: data.averageRating || 0,
    rating_count: data.ratingCount || 0,
    image_url: data.imageUrl || null,
    created_at: toDate(data.createdAt) || toDate(data.created_at),
    updated_at: toDate(data.updatedAt) || toDate(data.updated_at),
    condition: primaryCondition,
    conditions,
  };
};

const resolveFirestoreConditionIds = async (data) => {
  const rawConditionIds = data?.conditionIds ?? data?.condition_ids;

  if (rawConditionIds === undefined || rawConditionIds === null || rawConditionIds === "") {
    return [];
  }

  const conditionIds = [...new Set(
    (Array.isArray(rawConditionIds) ? rawConditionIds : [rawConditionIds])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => parseNumericId(value))
      .filter(Boolean)
  )];

  if (!conditionIds.length) {
    return [];
  }

  const docs = await Promise.all(
    conditionIds.map((conditionId) => resolveDocByNumericId("conditions", conditionId))
  );
  const missingConditionIds = conditionIds.filter((_, index) => !docs[index].exists);

  if (missingConditionIds.length) {
    throw {
      status: 400,
      message: `conditionIds do not exist: ${missingConditionIds.join(", ")}`
    };
  }

  return conditionIds;
};

const findExistingFirestoreHerb = async (name, scientificName) => {
  const snapshot = await herbsCollection.get();
  const normalizedName = name?.trim().toLowerCase();
  const normalizedScientificName = scientificName?.trim().toLowerCase();

  return snapshot.docs.find((doc) => {
    const herb = doc.data();
    const herbName = herb.name?.trim().toLowerCase();
    const herbScientificName = herb.scientificName?.trim().toLowerCase();

    return (
      (normalizedName && herbName === normalizedName) ||
      (normalizedScientificName && herbScientificName === normalizedScientificName)
    );
  });
};

const getFirestoreHerbDocById = async (id) => {
  const doc = await resolveDocByNumericId("herbs", id);
  if (!doc || !doc.exists) {
    throw { status: 404, message: "Herb not found" };
  }

  return doc;
};

const getHerbsByStatusFromFirestore = async (status, page = 1, limit = 10) => {
  const normalizedStatus = String(status).toLowerCase();
  const snapshot = await herbsCollection.get();

  const matchingDocs = snapshot.docs.filter((doc) => {
    const herbStatus = String(doc.data()?.status || "").toLowerCase();
    return herbStatus === normalizedStatus;
  });

  const sortedDocs = matchingDocs.sort((left, right) => {
    const leftTime = toDate(left.data()?.createdAt)?.getTime?.() || 0;
    const rightTime = toDate(right.data()?.createdAt)?.getTime?.() || 0;
    return rightTime - leftTime;
  });

  const total = sortedDocs.length;
  const offset = (page - 1) * limit;
  const paginatedDocs = sortedDocs.slice(offset, offset + limit);
  const herbs = await Promise.all(paginatedDocs.map((doc) => formatHerbDocument(doc)));

  return {
    herbs,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

const resolveConditionIds = async (data) => {
  const rawConditionIds =
    data?.conditionIds ??
    data?.condition_ids;

  if (rawConditionIds === undefined || rawConditionIds === null || rawConditionIds === "") {
    return [];
  }

  const rawValues = (Array.isArray(rawConditionIds) ? rawConditionIds : [rawConditionIds])
    .filter((value) => value !== null && value !== undefined && value !== "");

  if (!rawValues.length) {
    return [];
  }

  const conditionIds = [...new Set(rawValues.map((value) => {
    const conditionId = Number(value);
    if (!Number.isInteger(conditionId) || conditionId <= 0) {
      throw {
        status: 400,
        message: "conditionIds must contain only positive integers"
      };
    }

    return conditionId;
  }))];

  if (!conditionIds.length) {
    return [];
  }

  const conditions = await Promise.all(
    conditionIds.map((conditionId) => getConditionByIdQuery(conditionId))
  );
  const missingConditionIds = conditionIds.filter((_, index) => !conditions[index]);

  if (missingConditionIds.length) {
    throw {
      status: 400,
      message: `conditionIds do not exist: ${missingConditionIds.join(", ")}`
    };
  }

  return conditionIds;
};

export const createHerbService = async (data, userId) => {
  const existingHerb = await findExistingFirestoreHerb(
    data.name,
    data.scientificName
  );

  if (existingHerb) {
    throw { status: 400, message: "Herb already exists" };
  }

  const conditionIds = await resolveFirestoreConditionIds(data);
  const herbPayload = {
    name: data.name,
    scientificName: data.scientificName || null,
    description: data.description || null,
    preparation: data.preparation || null,
    safetyWarning: data.safetyWarning || null,
    source: data.source ?? null,
    status: (data.status || "pending").toLowerCase(),
    createdBy: userId,
    conditionIds,
    averageRating: 0,
    ratingCount: 0,
    createdAt: timestamp.now(),
    updatedAt: timestamp.now(),
  };

  const { ref: herbRef } = await createNumericDoc("herbs", herbPayload);
  const herbDoc = await herbRef.get();
  await invalidateLocalCache([
    "herbs:",
    "uploads:",
    "favorites:",
    "saved-herbs:",
    "conditions:",
    "translations:",
    "ratings:",
  ]);
  return await formatHerbDocument(herbDoc);
};

export const getHerbByIdService = async (id) => {
  return await withLocalCache(`herbs:id:${id}`, async () => {
    const herbDoc = await getFirestoreHerbDocById(id);
    return await formatHerbDocument(herbDoc);
  });
};

export const updateHerbService = async (id, data) => {
  const herbDoc = await getFirestoreHerbDocById(id);
  const conditionIds = await resolveFirestoreConditionIds(data);

  await herbDoc.ref.set(
    {
      name: data.name,
      scientificName: data.scientificName || null,
      description: data.description || null,
      preparation: data.preparation || null,
      safetyWarning: data.safetyWarning || null,
      source: data.source ?? null,
      conditionIds,
      updatedAt: timestamp.now(),
    },
    { merge: true }
  );

  const updatedDoc = await herbDoc.ref.get();
  await invalidateLocalCache([
    "herbs:",
    "uploads:",
    "favorites:",
    "saved-herbs:",
    "conditions:",
    "translations:",
    "ratings:",
  ]);
  return await formatHerbDocument(updatedDoc);
};

export const deleteHerbService = async (id) => {
  const herbDoc = await getFirestoreHerbDocById(id);
  await herbDoc.ref.delete();
  await invalidateLocalCache([
    "herbs:",
    "uploads:",
    "favorites:",
    "saved-herbs:",
    "conditions:",
    "translations:",
    "ratings:",
  ]);
};

export const updateHerbStatusService = async (id, status) => {
  const herbDoc = await getFirestoreHerbDocById(id);

  await herbDoc.ref.set(
    {
      status: String(status).toLowerCase(),
      updatedAt: timestamp.now(),
    },
    { merge: true }
  );

  const updatedDoc = await herbDoc.ref.get();
  await invalidateLocalCache([
    "herbs:",
    "uploads:",
    "favorites:",
    "saved-herbs:",
    "conditions:",
    "translations:",
    "ratings:",
  ]);
  return await formatHerbDocument(updatedDoc);
};

export const getPublishedHerbsService = async (page = 1, limit = 10) => {
  return await withLocalCache(`herbs:published:${page}:${limit}`, async () => {
    return await getHerbsByStatusFromFirestore("published", page, limit);
  });
};

export const getPendingHerbsService = async (page = 1, limit = 10) => {
  return await withLocalCache(`herbs:pending:${page}:${limit}`, async () => {
    return await getHerbsByStatusFromFirestore("pending", page, limit);
  });
};

export const searchHerbsService = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;
  const sort = queryParams.sort || "created_at";
  const search = queryParams.search || "";
  const conditionId = queryParams.conditionId || "";

  return await withLocalCache(
    `herbs:search:${search}:${conditionId}:${page}:${limit}:${sort}`,
    async () => {
      return await searchHerbsQuery({
        search,
        conditionId,
        limit,
        offset,
        sort
      });
    }
  );
};

export const getRecommendedHerbsService = async (
  userId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  return await withLocalCache(`herbs:recommended:${userId}:${page}:${limit}`, async () => {
    return await getRecommendedHerbsQuery(
      userId,
      limit,
      offset
    );
  });
};
