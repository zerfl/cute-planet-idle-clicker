import { describe, it, expect } from "vitest";
import { formatCompactNumber } from "./format";

describe("formatCompactNumber", () => {
  it("returns '0' for 0, NaN, and nullish input", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(NaN)).toBe("0");
    expect(formatCompactNumber(undefined as unknown as number)).toBe("0");
    expect(formatCompactNumber(null as unknown as number)).toBe("0");
  });

  it("renders sub-thousand integers plainly and fractions to 1 dp", () => {
    expect(formatCompactNumber(42)).toBe("42");
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(12.34)).toBe("12.3");
  });

  it("applies K/M/B/T suffixes with trailing-zero cleanup", () => {
    expect(formatCompactNumber(1000)).toBe("1K");
    expect(formatCompactNumber(1200)).toBe("1.2K");
    expect(formatCompactNumber(1_000_000)).toBe("1M");
    expect(formatCompactNumber(2_500_000_000)).toBe("2.5B");
    expect(formatCompactNumber(1e12)).toBe("1T");
  });

  it("reaches the high-tier suffixes", () => {
    expect(formatCompactNumber(1e15)).toBe("1Qa");
    expect(formatCompactNumber(1e45)).toBe("1Qad");
  });
});
