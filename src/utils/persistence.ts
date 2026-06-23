/**
 * localStorage save schema versioning (Vercel client-localstorage-schema).
 *
 * Saves now carry a `version` field so the shape can evolve safely. Loads run
 * through `migrateSave`, which upgrades older payloads to the current version.
 * Pre-versioning saves are treated as v1 with no field changes, so existing
 * players lose nothing.
 */

export const SAVE_KEY = "cute_planet_save";
export const SAVE_VERSION = 1;

export type RawSave = Record<string, unknown>;

/**
 * Normalize a parsed save object to the current schema version. Returns `null`
 * for anything that isn't a usable object. Future migrations chain off the
 * detected version.
 */
export function migrateSave(raw: unknown): RawSave | null {
  if (!raw || typeof raw !== "object") return null;
  let save = raw as RawSave;

  const version = typeof save.version === "number" ? save.version : 0;

  // v0 (unversioned) -> v1: no field changes; just stamp the version.
  if (version < 1) {
    save = { ...save, version: 1 };
  }

  // (future) if (save.version < 2) { … }

  return save;
}

/** Stamp the current schema version onto an outgoing save payload. */
export function withSaveVersion<T extends object>(save: T): T & { version: number } {
  return { ...save, version: SAVE_VERSION };
}
