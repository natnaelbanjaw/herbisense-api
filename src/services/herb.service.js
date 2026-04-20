import {
  createHerbQuery,
  findHerbByNameOrScientificNameQuery,
  getHerbByIdQuery,
  replaceHerbConditionLinksQuery,
  updateHerbQuery,
  deleteHerbQuery,
  updateHerbStatusQuery,
  getPublishedHerbsQuery, countPublishedHerbsQuery,
  getPendingHerbsQuery, countPendingHerbsQuery,
  getRecommendedHerbsQuery,
  searchHerbsQuery
} from "../database/queries/herb.query.js";
import { getConditionByIdQuery } from "../database/queries/condition.query.js";
import pool from "../database/db.js";

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
  const existingHerb = await findHerbByNameOrScientificNameQuery(
    data.name,
    data.scientificName
  );

  if (existingHerb) {
    throw { status: 400, message: "Herb already exists" };
  }

  const conditionIds = await resolveConditionIds(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const herb = await createHerbQuery(
      data.name,
      data.scientificName,
      data.description,
      data.preparation,
      data.safetyWarning,
      data.source ?? null,
      userId,
      null,
      client
    );

    await replaceHerbConditionLinksQuery(herb.id, conditionIds, client);

    const createdHerb = await getHerbByIdQuery(herb.id, client, false);

    await client.query("COMMIT");
    return createdHerb;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

export const getHerbByIdService = async (id) => {
  const herb = await getHerbByIdQuery(id);

  if (!herb) {
    throw { status: 404, message: "Herb not found" };
  }

  return herb;
};

export const updateHerbService = async (id, data) => {
  const herb = await getHerbByIdQuery(id, pool, false);

  if (!herb) {
    throw { status: 404, message: "Herb not found" };
  }

  const conditionIds = await resolveConditionIds(data);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await updateHerbQuery(
      id,
      data.name,
      data.scientificName,
      data.description,
      data.preparation,
      data.safetyWarning,
      data.source ?? null,
      null,
      client
    );

    await replaceHerbConditionLinksQuery(id, conditionIds, client);

    const updatedHerb = await getHerbByIdQuery(id, client, false);

    await client.query("COMMIT");
    return updatedHerb;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

export const deleteHerbService = async (id) => {
  const herb = await getHerbByIdQuery(id, pool, false);

  if (!herb) {
    throw { status: 404, message: "Herb not found" };
  }

  await deleteHerbQuery(id);
};

export const updateHerbStatusService = async (id, status) => {
  return await updateHerbStatusQuery(id, status);
};

export const getPublishedHerbsService = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const herbs = await getPublishedHerbsQuery(limit, offset);
  const total = await countPublishedHerbsQuery();
  const totalPages = Math.ceil(total / limit);

  return {
    herbs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

export const getPendingHerbsService = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const herbs = await getPendingHerbsQuery(limit, offset);
  const total = await countPendingHerbsQuery();
  const totalPages = Math.ceil(total / limit);

  return {
    herbs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

export const searchHerbsService = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  return await searchHerbsQuery({
    search: queryParams.search,
    conditionId: queryParams.conditionId,
    limit,
    offset,
    sort: queryParams.sort || "created_at"
  });
};

export const getRecommendedHerbsService = async (
  userId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;

  return await getRecommendedHerbsQuery(
    userId,
    limit,
    offset
  );
};
