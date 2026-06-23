import { describe, it, expect } from "vitest";
import { migrateSave, withSaveVersion, SAVE_VERSION } from "./persistence";

describe("migrateSave", () => {
  it("returns null for non-object input", () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave(undefined)).toBeNull();
    expect(migrateSave("nope")).toBeNull();
    expect(migrateSave(42)).toBeNull();
  });

  it("stamps version 1 on an unversioned (legacy) save without changing fields", () => {
    const legacy = { life: 123, starsCount: 4, purchasedUpgrades: ["upg-click-1"] };
    const migrated = migrateSave(legacy);
    expect(migrated).toEqual({ ...legacy, version: 1 });
    // Original object is not mutated.
    expect(legacy).not.toHaveProperty("version");
  });

  it("leaves an already-current save untouched", () => {
    const current = { version: SAVE_VERSION, life: 5 };
    expect(migrateSave(current)).toEqual(current);
  });
});

describe("withSaveVersion", () => {
  it("adds the current version to an outgoing payload", () => {
    const out = withSaveVersion({ life: 1, starsCount: 2 });
    expect(out).toEqual({ life: 1, starsCount: 2, version: SAVE_VERSION });
  });

  it("round-trips through migrateSave unchanged", () => {
    const out = withSaveVersion({ life: 9 });
    expect(migrateSave(out)).toEqual(out);
  });
});
