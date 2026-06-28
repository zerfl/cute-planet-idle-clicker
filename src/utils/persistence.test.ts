import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_SAVE_KEY,
  SAVE_META_KEY,
  SAVE_VERSION,
  getSaveKey,
  migrateLegacyGlobalSave,
  migrateSave,
  normalizeCloudTimestamp,
  readMeta,
  readSave,
  withSaveVersion,
  writeMeta,
  writeSave,
} from "./persistence";

describe("migrateSave", () => {
  it("returns null for non-object input", () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave(undefined)).toBeNull();
    expect(migrateSave("nope")).toBeNull();
    expect(migrateSave(42)).toBeNull();
  });

  it("upgrades an older save with owner metadata and roguelite defaults", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T10:00:00.000Z"));

    const legacyV1 = {
      version: 1,
      life: 123,
      starsCount: 4,
      purchasedUpgrades: ["upg-click-1"],
    };

    const migrated = migrateSave(legacyV1, "user-123");

    expect(migrated).toEqual({
      ...legacyV1,
      version: SAVE_VERSION,
      ownerId: "user-123",
      lastSavedAt: Date.now(),
      lastCloudUpdatedAt: null,
      activePlanetSkin: "default",
      activeRogueliteRun: null,
      rogueliteMeta: {
        totalRuns: 0,
        wins: 0,
        losses: 0,
        highestStation: 0,
        unlockedRelics: ["kometenherz", "pfotenkompass"],
        unlockedPlanetSkins: [],
        seenBosses: [],
        shardRewardsClaimed: 0,
        bonusRerolls: 0,
        lastRunSummary: null,
      },
    });
    expect(legacyV1).not.toHaveProperty("ownerId");
    vi.useRealTimers();
  });

  it("normalizes current saves without changing meaningful fields", () => {
    const current = {
      version: SAVE_VERSION,
      ownerId: "user-123",
      life: 5,
      lastSavedAt: 12345,
      lastCloudUpdatedAt: "67890",
    };

    expect(migrateSave(current, "user-123")).toEqual({
      ...current,
      lastCloudUpdatedAt: 67890,
    });
  });
});

describe("save slots", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("builds guest and per-user save keys", () => {
    expect(getSaveKey(null)).toBe("cute_planet_save_guest");
    expect(getSaveKey("abc")).toBe("cute_planet_save_user_abc");
  });

  it("round-trips a slot through writeSave and readSave", () => {
    const stamped = writeSave("user-123", { life: 9, starsCount: 2, lastSavedAt: 555 });

    expect(stamped).toEqual({
      life: 9,
      starsCount: 2,
      version: SAVE_VERSION,
      ownerId: "user-123",
      lastSavedAt: 555,
      lastCloudUpdatedAt: null,
    });

    expect(readSave("user-123")).toEqual(stamped);
  });

  it("moves the legacy global save into the guest slot exactly once", () => {
    localStorage.setItem(
      LEGACY_SAVE_KEY,
      JSON.stringify({ version: 1, life: 77, totalLifeEarned: 99, lastSavedAt: 123 }),
    );

    migrateLegacyGlobalSave();

    expect(localStorage.getItem(LEGACY_SAVE_KEY)).toBeNull();
    expect(readSave(null)).toMatchObject({
      version: SAVE_VERSION,
      ownerId: null,
      life: 77,
      totalLifeEarned: 99,
      lastSavedAt: 123,
    });
    expect(readMeta()).toEqual({ activeOwnerId: null, legacyMigrated: true });

    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify({ version: 1, life: 999 }));
    migrateLegacyGlobalSave();

    expect(readSave(null)).toMatchObject({ life: 77 });
    expect(localStorage.getItem(LEGACY_SAVE_KEY)).toBeTruthy();
  });

  it("merges metadata writes without dropping existing fields", () => {
    localStorage.setItem(
      SAVE_META_KEY,
      JSON.stringify({ activeOwnerId: "guest?", legacyMigrated: false }),
    );

    expect(writeMeta({ activeOwnerId: "user-123" })).toEqual({
      activeOwnerId: "user-123",
      legacyMigrated: false,
    });
  });
});

describe("normalizeCloudTimestamp", () => {
  it("supports firestore-like timestamps, dates, strings, and numbers", () => {
    expect(normalizeCloudTimestamp({ toMillis: () => 1234 })).toBe(1234);
    expect(normalizeCloudTimestamp({ seconds: 2, nanoseconds: 500000000 })).toBe(2500);
    expect(normalizeCloudTimestamp(new Date("2026-06-27T10:00:00.000Z"))).toBe(
      Date.parse("2026-06-27T10:00:00.000Z"),
    );
    expect(normalizeCloudTimestamp("4567")).toBe(4567);
    expect(normalizeCloudTimestamp(8910)).toBe(8910);
    expect(normalizeCloudTimestamp("not-a-date")).toBeNull();
  });
});

describe("withSaveVersion", () => {
  it("adds the current slot metadata to an outgoing payload", () => {
    const out = withSaveVersion({ life: 1, starsCount: 2 }, null);
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.ownerId).toBeNull();
    expect(out.lastCloudUpdatedAt).toBeNull();
  });
});
