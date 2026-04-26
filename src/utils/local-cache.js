import { existsSync, mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheDir = path.resolve(__dirname, "../../.cache");
const cacheFilePath = path.join(cacheDir, "service-cache.json");
const defaultTtlMs = 5 * 60 * 1000;

const cacheStore = new Map();
let persistPromise = null;
let persistTimer = null;

const cloneCacheValue = (value) => {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
};

const loadCacheFromDisk = () => {
  if (!existsSync(cacheFilePath)) {
    return;
  }

  try {
    const raw = readFileSync(cacheFilePath, "utf8");
    if (!raw.trim()) {
      return;
    }

    const parsed = JSON.parse(raw);
    const now = Date.now();

    for (const [key, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      if (entry.expiresAt && entry.expiresAt <= now) {
        continue;
      }

      cacheStore.set(key, entry);
    }
  } catch (error) {
    console.error("Failed to load local cache:", error);
  }
};

const flushCacheToDisk = async () => {
  persistTimer = null;
  mkdirSync(cacheDir, { recursive: true });

  const payload = Object.fromEntries(cacheStore.entries());
  persistPromise = writeFile(cacheFilePath, JSON.stringify(payload, null, 2), "utf8")
    .catch((error) => {
      console.error("Failed to persist local cache:", error);
    })
    .finally(() => {
      persistPromise = null;
    });

  await persistPromise;
};

const schedulePersist = () => {
  if (persistTimer) {
    return;
  }

  persistTimer = setTimeout(() => {
    flushCacheToDisk();
  }, 25);
};

const getEntry = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    schedulePersist();
    return null;
  }

  return entry;
};

loadCacheFromDisk();

export const withLocalCache = async (key, loader, options = {}) => {
  const ttlMs = options.ttlMs ?? defaultTtlMs;
  const cachedEntry = getEntry(key);

  if (cachedEntry) {
    return cloneCacheValue(cachedEntry.value);
  }

  const value = await loader();
  const normalizedValue = cloneCacheValue(value);

  cacheStore.set(key, {
    value: normalizedValue,
    expiresAt: Date.now() + ttlMs,
  });
  schedulePersist();

  return cloneCacheValue(normalizedValue);
};

export const invalidateLocalCache = async (prefixes = []) => {
  const values = Array.isArray(prefixes) ? prefixes : [prefixes];
  let removed = false;

  for (const key of [...cacheStore.keys()]) {
    if (values.some((prefix) => key.startsWith(prefix))) {
      cacheStore.delete(key);
      removed = true;
    }
  }

  if (removed) {
    schedulePersist();
  }
};

export const getLocalCacheFilePath = () => cacheFilePath;
