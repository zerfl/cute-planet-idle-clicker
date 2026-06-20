import { describe, it, expect } from "vitest";
import { buildGraph, resolve } from "./craftingGraph";

// ---------------------------------------------------------------------------
// buildGraph
// ---------------------------------------------------------------------------

describe("buildGraph", () => {
  it("mat_stardust is a leaf craft node with no children", () => {
    const { root } = buildGraph("mat_stardust", 1);
    expect(root.kind).toBe("craft");
    expect(root.need).toBe(1);
    expect(root.ops).toBe(1);
    expect(root.yield).toBe(1);
    expect(root.children).toHaveLength(1); // only 'life' ingredient
    expect(root.children[0].kind).toBe("raw");
    expect(root.children[0].id).toBe("life");
  });

  it("scales ops with qty", () => {
    const { root } = buildGraph("mat_stardust", 3);
    expect(root.ops).toBe(3);
    expect(root.need).toBe(3);
    const life = root.children.find((c) => c.id === "life");
    expect(life?.need).toBe(3 * 50000);
  });

  it("mat_meteor_splitter has craft child mat_stardust and raw life+stars", () => {
    const { root } = buildGraph("mat_meteor_splitter", 1);
    expect(root.kind).toBe("craft");
    expect(root.ops).toBe(1);
    const dustNode = root.children.find((c) => c.id === "mat_stardust");
    expect(dustNode).toBeDefined();
    expect(dustNode?.kind).toBe("craft");
    const lifeNode = root.children.find((c) => c.id === "life");
    const starsNode = root.children.find((c) => c.id === "stars");
    expect(lifeNode?.kind).toBe("raw");
    expect(starsNode?.kind).toBe("raw");
  });

  it("mat_supernova_core has mat_meteor_splitter which has mat_stardust", () => {
    const { root } = buildGraph("mat_supernova_core", 1);
    const splitter = root.children.find((c) => c.id === "mat_meteor_splitter");
    expect(splitter?.kind).toBe("craft");
    const dust = splitter?.children.find((c) => c.id === "mat_stardust");
    expect(dust?.kind).toBe("craft");
  });
});

// ---------------------------------------------------------------------------
// resolve
// ---------------------------------------------------------------------------

describe("resolve — root never drawn from stock (#4 regression)", () => {
  it("always crafts the root even when stock has enough", () => {
    // Bug: before fix, resolve with mat_stardust:5 in stock returned an empty plan (ok:true)
    const result = resolve("mat_stardust", 1, { life: 1e9, mat_stardust: 5 });
    expect(result.ok).toBe(true);
    expect(result.plan).toHaveLength(1);
    expect(result.plan[0].id).toBe("mat_stardust");
    expect(result.plan[0].produces).toBe(1);
    expect(result.rawNeed.life).toBe(50000);
  });
});

describe("resolve — intermediates consumed from stock", () => {
  it("does NOT craft mat_stardust when 2 are in stock (splitter needs exactly 2)", () => {
    const result = resolve("mat_meteor_splitter", 1, {
      life: 1e9,
      stars: 1e9,
      mat_stardust: 2,
    });
    expect(result.ok).toBe(true);
    const dustStep = result.plan.find((s) => s.id === "mat_stardust");
    expect(dustStep).toBeUndefined();
    expect(result.rawNeed.mat_stardust).toBeUndefined();
    expect(result.rawNeed.life).toBe(100000);
    expect(result.rawNeed.stars).toBe(2);
  });

  it("partially uses stardust from stock when only 1 is available", () => {
    const result = resolve("mat_meteor_splitter", 1, {
      life: 1e9,
      stars: 1e9,
      mat_stardust: 1,
    });
    expect(result.ok).toBe(true);
    const dustStep = result.plan.find((s) => s.id === "mat_stardust");
    expect(dustStep).toBeDefined();
    expect(dustStep?.ops).toBe(1);
    expect(dustStep?.fromStock).toBe(1);
  });
});

describe("resolve — recursive auto-craft (no intermediates in stock)", () => {
  it("crafts stardust then splitter when no stardust in stock", () => {
    const result = resolve("mat_meteor_splitter", 1, { life: 1e9, stars: 1e9 });
    expect(result.ok).toBe(true);
    const ids = result.plan.map((s) => s.id);
    const dustIdx = ids.indexOf("mat_stardust");
    const splitterIdx = ids.indexOf("mat_meteor_splitter");
    expect(dustIdx).toBeGreaterThanOrEqual(0);
    expect(splitterIdx).toBeGreaterThan(dustIdx); // deepest-first: stardust before splitter
    expect(result.rawNeed.life).toBe(200000); // splitter 100k + stardust×2 2×50k
    expect(result.rawNeed.stars).toBe(2);
  });
});

describe("resolve — shortfall", () => {
  it("reports ok:false and shortfall when raws are insufficient", () => {
    const result = resolve("mat_meteor_splitter", 1, { life: 0, stars: 0 });
    expect(result.ok).toBe(false);
    expect(result.shortfall.life).toBeGreaterThan(0);
    expect(result.shortfall.stars).toBeGreaterThan(0);
  });

  it("shortfall is the deficit amount, not the total needed", () => {
    const result = resolve("mat_stardust", 1, { life: 10000 });
    expect(result.ok).toBe(false);
    expect(result.shortfall.life).toBe(50000 - 10000);
  });
});

describe("resolve — yield surplus", () => {
  it("mat_nebula_gas (yield 2): crafting 3 requires ops:2, produces:4", () => {
    const result = resolve("mat_nebula_gas", 3, { life: 1e9, moons: 2 });
    expect(result.ok).toBe(true);
    const step = result.plan.find((s) => s.id === "mat_nebula_gas");
    expect(step).toBeDefined();
    expect(step?.ops).toBe(2);
    expect(step?.produces).toBe(4);
  });
});
