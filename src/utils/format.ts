/**
 * Canonical number formatter for the game UI. Previously duplicated verbatim in
 * `src/data.ts` and `src/game/achievements.ts`; both now re-export this.
 */

// Hoisted to module scope so the table isn't re-allocated on every call.
const SUFFIXES = [
  { value: 1e3, symbol: "K" },
  { value: 1e6, symbol: "M" },
  { value: 1e9, symbol: "B" },
  { value: 1e12, symbol: "T" },
  { value: 1e15, symbol: "Qa" },
  { value: 1e18, symbol: "Qi" },
  { value: 1e21, symbol: "Sx" },
  { value: 1e24, symbol: "Sp" },
  { value: 1e27, symbol: "Oc" },
  { value: 1e30, symbol: "No" },
  { value: 1e33, symbol: "Dc" },
  { value: 1e36, symbol: "Ud" },
  { value: 1e39, symbol: "Dd" },
  { value: 1e42, symbol: "Td" },
  { value: 1e45, symbol: "Qad" },
] as const;

/**
 * Compact, human-readable number: small values render plainly (integers as-is,
 * fractions to 1 dp); large values use K/M/B/T/… suffixes with trailing-zero
 * cleanup. Returns "0" for null/undefined/NaN.
 */
export function formatCompactNumber(num: number): string {
  if (num === null || isNaN(num)) return "0";
  if (num < 1000) {
    if (num === 0) return "0";
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  }

  for (let i = SUFFIXES.length - 1; i >= 0; i--) {
    if (num >= SUFFIXES[i].value) {
      const formatted = (num / SUFFIXES[i].value).toFixed(2);
      // Clean up trivial trailing decimals (e.g. 1.20 -> 1.2, 1.00 -> 1)
      return parseFloat(formatted) + SUFFIXES[i].symbol;
    }
  }
  return num.toString();
}

/**
 * Human-readable playtime from a second count, German units. Shows the two most
 * significant non-zero units (e.g. "3 Tage 4 Std", "12 Std 30 Min", "45 Min").
 * Returns "0 Min" for null/undefined/NaN/negative.
 */
export function formatPlaytime(seconds: number): string {
  if (seconds === null || isNaN(seconds) || seconds <= 0) return "0 Min";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "Tag" : "Tage"}`);
  if (hours > 0) parts.push(`${hours} Std`);
  if (minutes > 0) parts.push(`${minutes} Min`);
  if (parts.length === 0) return "< 1 Min";

  return parts.slice(0, 2).join(" ");
}
