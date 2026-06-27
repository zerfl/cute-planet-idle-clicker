import { CRAFTING_RECIPES, Recipe } from "./recipes";

export const BASE_RESOURCES: Record<string, { emoji: string; name: string; compact?: boolean }> = {
  life: { emoji: "💖", name: "Leben", compact: true },
  stars: { emoji: "⭐", name: "Sterne" },
  moons: { emoji: "🌙", name: "Monde" },
  glitter: { emoji: "✨", name: "Glitzerstaub" },
  lootboxes: { emoji: "🌠", name: "Lootboxen" },
};

// Canonical recipe per output item — first match wins (alt-producers ignored by auto-craft).
export const RECIPE_BY_RESULT = new Map<string, Recipe>();
for (const r of CRAFTING_RECIPES) {
  if (!RECIPE_BY_RESULT.has(r.result.id)) {
    RECIPE_BY_RESULT.set(r.result.id, r);
  }
}

export interface CraftItem {
  id: string;
  emoji: string;
  name: string;
  desc?: string;
  cat?: string;
  craftable: boolean;
  recipe?: Recipe;
}

export function getItem(id: string): CraftItem {
  if (BASE_RESOURCES[id]) {
    const b = BASE_RESOURCES[id];
    return { id, emoji: b.emoji, name: b.name, craftable: false };
  }
  const r = RECIPE_BY_RESULT.get(id);
  if (r) {
    return {
      id,
      emoji: r.result.emoji,
      name: r.result.name,
      desc: r.result.description,
      cat: r.category,
      craftable: true,
      recipe: r,
    };
  }
  return { id, emoji: "📦", name: id, craftable: false };
}

export interface GraphNode {
  uid: number;
  id: string;
  item: CraftItem;
  need: number;
  kind: "raw" | "craft";
  ops: number;
  yield: number;
  children: GraphNode[];
}

export function ingredientList(ing: Recipe["ingredients"]): Array<{ id: string; qty: number }> {
  const out: Array<{ id: string; qty: number }> = [];
  if (ing.life) out.push({ id: "life", qty: ing.life });
  if (ing.stars) out.push({ id: "stars", qty: ing.stars });
  if (ing.moons) out.push({ id: "moons", qty: ing.moons });
  if (ing.glitter) out.push({ id: "glitter", qty: ing.glitter });
  if (ing.lootboxes) out.push({ id: "lootboxes", qty: ing.lootboxes });
  if (ing.items) {
    for (const [id, qty] of Object.entries(ing.items)) {
      out.push({ id, qty });
    }
  }
  return out;
}

export function buildGraph(rootId: string, qty: number): { root: GraphNode } {
  let uid = 0;
  function rec(id: string, need: number): GraphNode {
    const u = uid++;
    const item = getItem(id);
    if (!item.craftable || !item.recipe) {
      return { uid: u, id, item, need, kind: "raw", ops: 0, yield: 0, children: [] };
    }
    const r = item.recipe;
    const ops = Math.ceil(need / r.result.quantity);
    const children = ingredientList(r.ingredients).map(({ id: cid, qty: cqty }) =>
      rec(cid, cqty * ops),
    );
    return { uid: u, id, item, need, kind: "craft", ops, yield: r.result.quantity, children };
  }
  return { root: rec(rootId, qty) };
}

export interface CraftStep {
  id: string;
  name: string;
  emoji: string;
  ops: number;
  produces: number;
  fromStock: number;
}

export interface ResolveResult {
  rawNeed: Record<string, number>;
  plan: CraftStep[];
  ok: boolean;
  shortfall: Record<string, number>;
}

// have map keys: "life", "stars", "moons", "glitter", "lootboxes", plus any craftedItem ids.
export function resolve(rootId: string, qty: number, have: Record<string, number>): ResolveResult {
  const stock = { ...have };
  const rawNeed: Record<string, number> = {};
  const plan: CraftStep[] = [];

  function rec(id: string, need: number, isRoot = false) {
    const item = getItem(id);
    if (!item.craftable || !item.recipe) {
      rawNeed[id] = (rawNeed[id] || 0) + need;
      return;
    }
    let use = 0;
    if (!isRoot) {
      const inStock = stock[id] || 0;
      use = Math.min(inStock, need);
      stock[id] = inStock - use;
    }
    const rem = need - use;
    if (rem <= 0) return;
    const r = item.recipe;
    const ops = Math.ceil(rem / r.result.quantity);
    ingredientList(r.ingredients).forEach(({ id: cid, qty: cqty }) => rec(cid, cqty * ops));
    plan.push({
      id,
      name: item.name,
      emoji: item.emoji,
      ops,
      produces: ops * r.result.quantity,
      fromStock: use,
    });
  }

  rec(rootId, qty, true);

  const shortfall: Record<string, number> = {};
  let ok = true;
  for (const [k, v] of Object.entries(rawNeed)) {
    const h = have[k] || 0;
    if (v > h) {
      ok = false;
      shortfall[k] = v - h;
    }
  }
  return { rawNeed, plan, ok, shortfall };
}
