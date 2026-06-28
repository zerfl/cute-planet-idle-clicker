import { createRogueliteMetaState } from "../roguelite/engine";

/**
 * localStorage save schema versioning with per-owner save slots.
 *
 * Guest progress lives under `cute_planet_save_guest`, authenticated users get
 * their own `cute_planet_save_user_<uid>` slots, and lightweight coordination
 * metadata lives in `cute_planet_save_meta`.
 */

export const LEGACY_SAVE_KEY = "cute_planet_save";
export const SAVE_KEY_PREFIX = "cute_planet_save";
export const SAVE_META_KEY = "cute_planet_save_meta";
export const SAVE_VERSION = 3;

export type SaveOwnerId = string | null;

export interface SaveMetadata {
  version: number;
  ownerId: SaveOwnerId;
  lastSavedAt: number;
  lastCloudUpdatedAt?: number | null;
}

export type RawSave = Record<string, unknown> & SaveMetadata;

export interface SaveMetaState {
  activeOwnerId: SaveOwnerId;
  legacyMigrated: boolean;
}

const DEFAULT_META: SaveMetaState = {
  activeOwnerId: null,
  legacyMigrated: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getNumericField = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function getSaveKey(ownerId: SaveOwnerId): string {
  return ownerId ? `${SAVE_KEY_PREFIX}_user_${ownerId}` : `${SAVE_KEY_PREFIX}_guest`;
}

export function normalizeCloudTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  if (isRecord(value)) {
    const maybeToMillis = value.toMillis;
    if (typeof maybeToMillis === "function") {
      const millis = maybeToMillis.call(value);
      return typeof millis === "number" && Number.isFinite(millis) ? millis : null;
    }

    const seconds = typeof value.seconds === "number" ? value.seconds : null;
    const nanoseconds = typeof value.nanoseconds === "number" ? value.nanoseconds : 0;
    if (seconds !== null) {
      return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    }
  }

  return null;
}

export function migrateSave(raw: unknown, ownerId: SaveOwnerId = null): RawSave | null {
  if (!isRecord(raw)) return null;

  let save: RawSave = raw as RawSave;
  const version = typeof save.version === "number" ? save.version : 0;

  if (version < 1) {
    save = { ...save, version: 1 } as RawSave;
  }

  if (save.version < 2) {
    save = {
      ...save,
      version: 2,
      ownerId,
      lastSavedAt: getNumericField(save.lastSavedAt, Date.now()),
      lastCloudUpdatedAt: normalizeCloudTimestamp(save.lastCloudUpdatedAt),
    };
  }

  if (save.version < 3) {
    const rogueliteMeta = createRogueliteMetaState();
    const legacyRogueliteMeta = isRecord(save.rogueliteMeta) ? save.rogueliteMeta : {};
    const { equippedRelicIds: _legacyEquippedRelics, ...sanitizedRogueliteMeta } =
      legacyRogueliteMeta;
    save = {
      ...save,
      version: 3,
      rogueliteMeta: {
        ...rogueliteMeta,
        ...sanitizedRogueliteMeta,
      },
      activeRogueliteRun: isRecord(save.activeRogueliteRun) ? save.activeRogueliteRun : null,
      activePlanetSkin:
        typeof save.activePlanetSkin === "string" ? save.activePlanetSkin : "default",
    };
  }

  return {
    ...save,
    version: SAVE_VERSION,
    ownerId: save.ownerId ?? ownerId ?? null,
    lastSavedAt: getNumericField(save.lastSavedAt, Date.now()),
    lastCloudUpdatedAt: normalizeCloudTimestamp(save.lastCloudUpdatedAt),
  };
}

export function withSaveVersion<T extends object>(
  save: T,
  ownerId: SaveOwnerId = null,
): T & SaveMetadata {
  const source = save as Partial<SaveMetadata>;
  return {
    ...save,
    version: SAVE_VERSION,
    ownerId,
    lastSavedAt: getNumericField(source.lastSavedAt, Date.now()),
    lastCloudUpdatedAt: normalizeCloudTimestamp(source.lastCloudUpdatedAt),
  };
}

export function readSave(ownerId: SaveOwnerId): RawSave | null {
  const raw = localStorage.getItem(getSaveKey(ownerId));
  if (!raw) return null;

  try {
    return migrateSave(JSON.parse(raw), ownerId);
  } catch (error) {
    console.error("Failed to parse save slot:", error);
    return null;
  }
}

export function writeSave<T extends object>(ownerId: SaveOwnerId, save: T): T & SaveMetadata {
  const stamped = withSaveVersion(save, ownerId);
  localStorage.setItem(getSaveKey(ownerId), JSON.stringify(stamped));
  return stamped;
}

export function removeSave(ownerId: SaveOwnerId) {
  localStorage.removeItem(getSaveKey(ownerId));
}

export function readMeta(): SaveMetaState {
  const raw = localStorage.getItem(SAVE_META_KEY);
  if (!raw) return DEFAULT_META;

  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return DEFAULT_META;
    }

    return {
      activeOwnerId: typeof parsed.activeOwnerId === "string" ? parsed.activeOwnerId : null,
      legacyMigrated: parsed.legacyMigrated === true,
    };
  } catch (error) {
    console.error("Failed to parse save metadata:", error);
    return DEFAULT_META;
  }
}

export function writeMeta(next: Partial<SaveMetaState>): SaveMetaState {
  const merged: SaveMetaState = {
    ...readMeta(),
    ...next,
  };
  localStorage.setItem(SAVE_META_KEY, JSON.stringify(merged));
  return merged;
}

export function migrateLegacyGlobalSave() {
  const meta = readMeta();
  if (meta.legacyMigrated) {
    return;
  }

  const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw);
      const migrated = migrateSave(parsed, null);
      if (migrated) {
        writeSave(null, migrated);
      }
      localStorage.removeItem(LEGACY_SAVE_KEY);
    } catch (error) {
      console.error("Failed to migrate legacy global save:", error);
    }
  }

  writeMeta({ legacyMigrated: true });
}
