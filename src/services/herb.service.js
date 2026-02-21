import {
  createHerbQuery,
  findHerbByNameOrScientificNameQuery,
  getHerbByIdQuery,
  updateHerbQuery,
  deleteHerbQuery,
  updateHerbStatusQuery,
  getPublishedHerbsQuery
} from "../database/queries/herb.query.js";

export const createHerbService = async (data, userId) => {
  const existingHerb = await findHerbByNameOrScientificNameQuery(
    data.name,
    data.scientificName
  );

  if (existingHerb) {
    throw { status: 400, message: "Herb already exists" };
  }

  return await createHerbQuery(
    data.name,
    data.scientificName,
    data.description,
    data.preparation,
    data.safetyWarning,
    userId
  );
};

export const updateHerbService = async (id, data) => {
  const herb = await getHerbByIdQuery(id);

  if (!herb) {
    throw { status: 404, message: "Herb not found" };
  }

  return await updateHerbQuery(
    id,
    data.name,
    data.scientificName,
    data.description,
    data.preparation,
    data.safetyWarning
  );
};

export const deleteHerbService = async (id) => {
  const herb = await getHerbByIdQuery(id);

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

  return await getPublishedHerbsQuery(limit, offset);
};

import { searchHerbsQuery } from "../database/queries/herb.query.js";

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
