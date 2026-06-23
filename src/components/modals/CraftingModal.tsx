import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "../ui/Modal";
import { CRAFTING_RECIPES } from "../../data/recipes";
import {
  buildGraph,
  resolve,
  getItem,
  GraphNode,
  BASE_RESOURCES,
  ResolveResult,
  CraftItem,
} from "../../data/craftingGraph";
import { useGameState } from "../../contexts/GameStateContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  craftedItems: Record<string, number>;
  onCraftRecursive: (targetItemId: string, count?: number) => void;
  formatCompactNumber: (num: number) => string;
}

function nodeStatus(
  node: GraphNode,
  have: Record<string, number>,
  isRoot = false,
): "ok" | "short" | "make" | "have" {
  const owned = have[node.id] || 0;
  if (node.kind === "raw") return owned >= node.need ? "ok" : "short";
  if (!isRoot && owned >= node.need) return "have";
  const r = resolve(node.id, node.need, have);
  return r.ok ? "make" : "short";
}

interface LeafChipProps {
  key?: React.Key | null;
  node: GraphNode;
  have: Record<string, number>;
  formatNum: (n: number) => string;
}
function LeafChip({ node, have, formatNum }: LeafChipProps) {
  const ok = (have[node.id] || 0) >= node.need;
  return (
    <div
      className={`pk-craft-leafchip pk-craft-leafchip--${ok ? "ok" : "short"}`}
      data-uid={node.uid}
    >
      <span className="pk-craft-leafchip__em">{node.item.emoji}</span>
      <span className="pk-craft-leafchip__nm">{node.item.name}</span>
      <span className="pk-craft-leafchip__amt" style={{ color: ok ? "#a3e635" : "#fb7185" }}>
        {formatNum(node.need)}
      </span>
    </div>
  );
}

interface NodeGroupProps {
  key?: React.Key | null;
  node: GraphNode;
  have: Record<string, number>;
  isRoot?: boolean;
  onDrill: (id: string) => void;
  formatNum: (n: number) => string;
}
function NodeGroup({ node, have, isRoot, onDrill, formatNum }: NodeGroupProps) {
  const status = nodeStatus(node, have, isRoot);
  const owned = have[node.id] || 0;

  const rawKids = node.children.filter((c) => c.kind === "raw");
  const craftKids = node.children.filter((c) => c.kind === "craft");

  const pillCls = { ok: "pill--ok", make: "pill--make", short: "pill--short", have: "pill--have" }[
    status
  ];
  const pillTxt =
    node.kind === "raw"
      ? status === "ok"
        ? "vorhanden"
        : "fehlt"
      : status === "have"
        ? "im Lager ✓"
        : status === "make"
          ? `schmieden ×${node.ops}`
          : "Engpass";
  const nodeCls = [
    "pk-craft-node",
    `pk-craft-node--${node.kind}`,
    `pk-craft-node--${status}`,
    isRoot ? "pk-craft-node--root" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pk-ng">
      {node.children.length > 0 && (
        <div className="pk-ng__kids">
          {craftKids.map((c) => (
            <NodeGroup key={c.uid} node={c} have={have} onDrill={onDrill} formatNum={formatNum} />
          ))}
          {rawKids.length > 0 && (
            <div className="pk-craft-leafcol">
              {rawKids.map((c) => (
                <LeafChip key={c.uid} node={c} have={have} formatNum={formatNum} />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="pk-ng__box">
        <div
          className={nodeCls}
          data-uid={node.uid}
          onClick={node.kind === "craft" && !isRoot ? () => onDrill(node.id) : undefined}
          title={
            node.kind === "craft" && !isRoot ? "Als Ziel öffnen — zur Quelle springen" : undefined
          }
        >
          <div className="pk-craft-node__top">
            <span className="pk-craft-node__em">{node.item.emoji}</span>
            <span className="pk-craft-node__nm">{node.item.name}</span>
          </div>
          <div className="pk-craft-node__meta">
            <span className="pk-craft-node__need">×{formatNum(node.need)}</span>
            <span className={`pk-craft-pill ${pillCls}`}>{pillTxt}</span>
          </div>
          {node.kind === "craft" && (
            <div className="pk-craft-node__stock">
              Lager {owned} · Ausbeute {node.yield}/Synthese
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EdgeGeo {
  d: string;
  childUid: number;
}

// ---------------------------------------------------------------------------
// Module-level sub-components — defined outside render to prevent remounting
// ---------------------------------------------------------------------------

interface SummaryContentProps {
  target: CraftItem;
  qty: number;
  setQty: React.Dispatch<React.SetStateAction<number>>;
  plan: ResolveResult;
  have: Record<string, number>;
  fmtNum: (id: string, n: number) => string;
  maxQty: number;
  showPlan: boolean;
}

const SummaryContent = React.memo(function SummaryContent({
  target,
  qty,
  setQty,
  plan,
  have,
  fmtNum,
  maxQty,
  showPlan,
}: SummaryContentProps) {
  return (
    <div className="pk-craft-sum__scroll">
      <div className="pk-craft-hero">
        <span className="pk-craft-hero__em">{target.emoji}</span>
        <span className={`pk-craft-cat-pill pk-craft-cat-pill--${target.cat ?? "materials"}`}>
          {target.cat === "materials" ? "Rohstoff / Zutat" : "Aktivierbares Item"}
        </span>
        <span className="pk-craft-hero__nm">{target.name}</span>
        <span className="pk-craft-hero__desc">{target.desc ?? ""}</span>
      </div>

      <div className="pk-craft-qty">
        <span className="pk-craft-qty__lbl">🏭 Anzahl</span>
        <div className="pk-craft-qty__ctl">
          <button
            className="pk-craft-stepper"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            －
          </button>
          <span className="pk-craft-qty__val">{qty}</span>
          <button
            className="pk-craft-stepper"
            disabled={qty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          >
            ＋
          </button>
        </div>
      </div>

      <div className={`pk-craft-ready pk-craft-ready--${plan.ok ? "ok" : "no"}`}>
        <span className="pk-craft-ready__em">{plan.ok ? "✅" : "⚠️"}</span>
        <div>
          <div className="pk-craft-ready__t" style={{ color: plan.ok ? "#6ee7b7" : "#fda4af" }}>
            {plan.ok ? "Alle Rohstoffe vorhanden" : "Rohstoffe fehlen"}
          </div>
          <div className="pk-craft-ready__s">
            {plan.ok
              ? `${plan.plan.length} Vorstufe(n) werden automatisch geschmiedet`
              : `Fehlt: ${Object.entries(plan.shortfall)
                  .map(([k, v]) => `${getItem(k).emoji} ${fmtNum(k, v)}`)
                  .join(" · ")}`}
          </div>
        </div>
      </div>

      {showPlan && (
        <>
          <div>
            <div className="pk-craft-sec-lbl" style={{ marginBottom: 7 }}>
              ⚒ Auto-Schmiede-Plan
            </div>
            <div className="pk-craft-plan">
              {plan.plan.length === 0 && (
                <div className="pk-craft-planempty">
                  Keine Vorstufen nötig — direkt herstellbar.
                </div>
              )}
              {plan.plan.map((s, i) => (
                <div className="pk-craft-planrow" key={s.id + i}>
                  <span className="pk-craft-planrow__n">{i + 1}</span>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span className="pk-craft-planrow__nm">{s.name}</span>
                  <span className="pk-craft-planrow__pr">
                    +{s.produces}
                    {s.fromStock ? `  ·  ${s.fromStock} ⌂` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="pk-craft-sec-lbl" style={{ marginBottom: 7 }}>
              🧾 Rohstoff-Verbrauch (gesamt)
            </div>
            <div className="pk-craft-costs">
              {Object.keys(plan.rawNeed).length === 0 && (
                <div className="pk-craft-planempty">—</div>
              )}
              {Object.entries(plan.rawNeed).map(([k, v]) => {
                const it = getItem(k);
                const ok = (have[k] || 0) >= v;
                return (
                  <div className="pk-craft-costrow" key={k}>
                    <span className="pk-craft-costrow__k">
                      {it.emoji} {it.name}
                    </span>
                    <span
                      className="pk-craft-costrow__v"
                      style={{ color: ok ? "#a3e635" : "#fb7185" }}
                    >
                      {fmtNum(k, v)} / {fmtNum(k, have[k] || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

interface CraftButtonProps {
  planOk: boolean;
  qty: number;
  onCraft: () => void;
}

const CraftButton = React.memo(function CraftButton({ planOk, qty, onCraft }: CraftButtonProps) {
  return (
    <button
      className={`pk-craft-craftbtn ${planOk ? "pk-craft-craftbtn--go" : "pk-craft-craftbtn--off"}`}
      onClick={onCraft}
      disabled={!planOk}
    >
      <span>
        {planOk ? `🔨 Alles schmieden ×${qty}` : "🔒 Schmiede gesperrt"}
        <span className="pk-craft-craftbtn__sub">
          {planOk
            ? "Vorstufen werden automatisch erstellt & Material abgezogen"
            : "Sammle die fehlenden Rohstoffe"}
        </span>
      </span>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const CraftingModal: React.FC<CraftingModalProps> = React.memo(
  ({ isOpen, onClose, craftedItems, onCraftRecursive, formatCompactNumber }) => {
    const { life, starsCount, moonsCount, glitterDust, shootingStarsCount } = useGameState();

    const [cat, setCat] = useState<"materials" | "consumables">("materials");
    const [search, setSearch] = useState("");
    const [stack, setStack] = useState<string[]>(() => {
      const first = CRAFTING_RECIPES.find((r) => r.category === "materials");
      return first ? [first.result.id] : [CRAFTING_RECIPES[0].result.id];
    });
    const [qty, setQty] = useState(1);
    const isMobile = useIsMobile();
    const [mobileRecipeOpen, setMobileRecipeOpen] = useState(false);
    const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

    const targetId = stack[stack.length - 1];
    const target = useMemo(() => getItem(targetId), [targetId]);

    const have = useMemo(
      () => ({
        life,
        stars: starsCount,
        moons: moonsCount,
        glitter: glitterDust,
        lootboxes: shootingStarsCount,
        ...craftedItems,
      }),
      [life, starsCount, moonsCount, glitterDust, shootingStarsCount, craftedItems],
    );

    const { root } = useMemo(() => buildGraph(targetId, qty), [targetId, qty]);
    const plan = useMemo(() => resolve(targetId, qty, have), [targetId, qty, have]);

    const uniqueRecipes = useMemo(() => {
      const seen = new Set<string>();
      return CRAFTING_RECIPES.filter((r) => {
        if (seen.has(r.result.id)) return false;
        seen.add(r.result.id);
        return true;
      });
    }, []);

    const filteredList = useMemo(
      () =>
        uniqueRecipes.filter(
          (r) =>
            r.category === cat &&
            (r.result.name.toLowerCase().includes(search.toLowerCase()) ||
              r.description.toLowerCase().includes(search.toLowerCase())),
        ),
      [cat, search, uniqueRecipes],
    );

    // --- viewport refs ---
    const graphScrollRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });
    const s0Ref = useRef(1);
    const maxScaleRef = useRef(1.6);
    const natSizeRef = useRef({ w: 0, h: 0 });
    const dragRef = useRef({
      active: false,
      startX: 0,
      startY: 0,
      startTx: 0,
      startTy: 0,
      moved: false,
    });
    const draggedRef = useRef(false);
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const pinchRef = useRef({
      active: false,
      initDist: 0,
      initScale: 1,
      initTx: 0,
      initTy: 0,
      initMidX: 0,
      initMidY: 0,
    });

    // Edge geometry: stable per targetId+qty, re-measured on layout
    const [edgeGeo, setEdgeGeo] = useState<{ paths: EdgeGeo[]; w: number; h: number }>({
      paths: [],
      w: 0,
      h: 0,
    });

    // Edge colors: reactive to have without re-measuring geometry
    const statusByUid = useMemo(() => {
      const map = new Map<number, "ok" | "short" | "make" | "have">();
      function traverse(node: GraphNode, isNodeRoot: boolean) {
        map.set(node.uid, nodeStatus(node, have, isNodeRoot));
        for (const child of node.children) traverse(child, false);
      }
      traverse(root, true);
      return map;
    }, [root, have]);

    const applyView = useCallback(() => {
      const inner = innerRef.current;
      if (!inner) return;
      const { scale, tx, ty } = viewRef.current;
      inner.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    }, []);

    const fitToView = useCallback(() => {
      const g = graphScrollRef.current;
      if (!g) return;
      const { w: natW, h: natH } = natSizeRef.current;
      if (!natW || !natH) return;
      const cw = g.clientWidth;
      const ch = g.clientHeight;
      const s0 = Math.min(cw / natW, ch / natH, 1);
      s0Ref.current = s0;
      maxScaleRef.current = Math.max(s0, 1.6);
      const tx = Math.max(0, (cw - natW * s0) / 2);
      const ty = Math.max(0, (ch - natH * s0) / 2);
      viewRef.current = { scale: s0, tx, ty };
      applyView();
    }, [applyView]);

    const zoomBy = useCallback(
      (factor: number) => {
        const g = graphScrollRef.current;
        if (!g) return;
        const cw = g.clientWidth;
        const ch = g.clientHeight;
        const { scale, tx, ty } = viewRef.current;
        const newScale = Math.max(s0Ref.current, Math.min(maxScaleRef.current, scale * factor));
        const ratio = newScale / scale;
        viewRef.current = {
          scale: newScale,
          tx: cw / 2 - ratio * (cw / 2 - tx),
          ty: ch / 2 - ratio * (ch / 2 - ty),
        };
        applyView();
      },
      [applyView],
    );

    // Re-measure geometry and fit-to-view when target or qty changes
    useLayoutEffect(() => {
      if (isMobile) return;
      const raf = requestAnimationFrame(() => {
        const g = graphScrollRef.current;
        const inner = innerRef.current;
        if (!g || !inner) return;

        inner.style.transform = "none";

        const natW = inner.scrollWidth;
        const natH = inner.scrollHeight;
        if (!natW || !natH) return;

        natSizeRef.current = { w: natW, h: natH };

        const cw = g.clientWidth;
        const ch = g.clientHeight;
        const s0 = Math.min(cw / natW, ch / natH, 1);
        s0Ref.current = s0;
        maxScaleRef.current = Math.max(s0, 1.6);

        const tx = Math.max(0, (cw - natW * s0) / 2);
        const ty = Math.max(0, (ch - natH * s0) / 2);
        viewRef.current = { scale: s0, tx, ty };

        // Measure edge paths in natural coordinates (transform = "none")
        const base = inner.getBoundingClientRect();
        const paths: EdgeGeo[] = [];

        Array.from(inner.querySelectorAll(".pk-ng")).forEach((ngEl) => {
          const ng = ngEl as HTMLElement;
          const parentBox = ng.querySelector(
            ":scope > .pk-ng__box > .pk-craft-node",
          ) as HTMLElement | null;
          const kids = ng.querySelector(":scope > .pk-ng__kids") as HTMLElement | null;
          if (!parentBox || !kids) return;

          const p = parentBox.getBoundingClientRect();
          const px = p.left - base.left;
          const py = p.top - base.top + p.height / 2;

          const childEls = [
            ...Array.from(kids.querySelectorAll(":scope > .pk-ng > .pk-ng__box > .pk-craft-node")),
            ...Array.from(kids.querySelectorAll(":scope > .pk-craft-leafcol > .pk-craft-leafchip")),
          ] as HTMLElement[];

          childEls.forEach((ce) => {
            const c = ce.getBoundingClientRect();
            const cx = c.right - base.left;
            const cy = c.top - base.top + c.height / 2;
            const mid = (cx + px) / 2;
            const uid = Number(ce.dataset.uid);
            paths.push({
              d: `M ${cx} ${cy} C ${mid} ${cy}, ${mid} ${py}, ${px} ${py}`,
              childUid: uid,
            });
          });
        });

        setEdgeGeo({ paths, w: natW, h: natH });
        applyView();
      });
      return () => cancelAnimationFrame(raf);
    }, [targetId, qty, applyView, isMobile]);

    // Refit on resize
    useLayoutEffect(() => {
      if (isMobile) return;
      window.addEventListener("resize", fitToView);
      return () => window.removeEventListener("resize", fitToView);
    }, [fitToView, isMobile]);

    // Non-passive wheel listener (React's onWheel is passive since React 17)
    useEffect(() => {
      if (isMobile) return;
      const g = graphScrollRef.current;
      if (!g) return;
      const handler = (e: WheelEvent) => {
        e.preventDefault();
        const inner = innerRef.current;
        if (!inner) return;
        const rect = g.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { scale, tx, ty } = viewRef.current;
        const s0 = s0Ref.current;
        const maxS = maxScaleRef.current;
        const factor = e.deltaMode === 1 ? 30 : 1;
        const delta = -e.deltaY * factor * 0.001;
        const newScale = Math.max(s0, Math.min(maxS, scale * (1 + delta)));
        const ratio = newScale / scale;
        const newTx = mouseX - ratio * (mouseX - tx);
        const newTy = mouseY - ratio * (mouseY - ty);
        viewRef.current = { scale: newScale, tx: newTx, ty: newTy };
        inner.style.transform = `translate(${newTx}px,${newTy}px) scale(${newScale})`;
      };
      g.addEventListener("wheel", handler, { passive: false });
      return () => g.removeEventListener("wheel", handler);
    }, [isMobile]);

    // Drag-pan + pinch-zoom handlers
    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest("button") || tgt.closest("input")) return;

      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const pointers = pointersRef.current;

      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const g = graphScrollRef.current;
        if (!g) return;
        const rect = g.getBoundingClientRect();
        const { tx: initTx, ty: initTy, scale: initScale } = viewRef.current;
        const initMidX = (pts[0].x + pts[1].x) / 2 - rect.left;
        const initMidY = (pts[0].y + pts[1].y) / 2 - rect.top;
        pinchRef.current = {
          active: true,
          initDist: dist,
          initScale,
          initTx,
          initTy,
          initMidX,
          initMidY,
        };
        dragRef.current.active = false;
        draggedRef.current = true;
      } else {
        pinchRef.current.active = false;
        dragRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          startTx: viewRef.current.tx,
          startTy: viewRef.current.ty,
          moved: false,
        };
        draggedRef.current = false;
      }
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pointers = pointersRef.current;

      if (pointers.size >= 2 && pinchRef.current.active) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const g = graphScrollRef.current;
        const inner = innerRef.current;
        if (!g || !inner) return;
        const rect = g.getBoundingClientRect();
        const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
        const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
        const { initDist, initScale, initTx, initTy, initMidX, initMidY } = pinchRef.current;
        const newScale = Math.max(
          s0Ref.current,
          Math.min(maxScaleRef.current, initScale * (dist / initDist)),
        );
        const newTx = midX - ((initMidX - initTx) / initScale) * newScale;
        const newTy = midY - ((initMidY - initTy) / initScale) * newScale;
        viewRef.current = { scale: newScale, tx: newTx, ty: newTy };
        inner.style.transform = `translate(${newTx}px,${newTy}px) scale(${newScale})`;
        draggedRef.current = true;
        return;
      }

      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(dx, dy) > 5) {
        dragRef.current.moved = true;
        draggedRef.current = true;
      }
      if (!dragRef.current.moved) return;
      const inner = innerRef.current;
      const g = graphScrollRef.current;
      if (!inner || !g) return;

      const { w: natW, h: natH } = natSizeRef.current;
      const { scale } = viewRef.current;
      const cw = g.clientWidth;
      const ch = g.clientHeight;
      const margin = 80;
      const newTx = Math.max(
        margin - natW * scale,
        Math.min(cw - margin, dragRef.current.startTx + dx),
      );
      const newTy = Math.max(
        margin - natH * scale,
        Math.min(ch - margin, dragRef.current.startTy + dy),
      );
      viewRef.current.tx = newTx;
      viewRef.current.ty = newTy;
      inner.style.transform = `translate(${newTx}px,${newTy}px) scale(${scale})`;
    }, []);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.delete(e.pointerId);
      const pointers = pointersRef.current;

      if (pointers.size < 2) pinchRef.current.active = false;

      if (pointers.size === 1) {
        const pt = [...pointers.values()][0];
        dragRef.current = {
          active: true,
          startX: pt.x,
          startY: pt.y,
          startTx: viewRef.current.tx,
          startTy: viewRef.current.ty,
          moved: false,
        };
        draggedRef.current = true;
      } else if (pointers.size === 0) {
        dragRef.current.active = false;
        setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }
    }, []);

    // Navigation
    const pick = useCallback((id: string) => {
      setStack([id]);
      setQty(1);
      setMobileRecipeOpen(false);
    }, []);

    const drill = useCallback((id: string) => {
      if (draggedRef.current) return;
      setStack((s) => [...s, id]);
      setQty(1);
    }, []);

    const crumbTo = useCallback((i: number) => {
      setStack((s) => s.slice(0, i + 1));
      setQty(1);
    }, []);

    const fmtNum = useCallback(
      (id: string, n: number) => (BASE_RESOURCES[id]?.compact ? formatCompactNumber(n) : String(n)),
      [formatCompactNumber],
    );

    const auraItem = (key: string, label: string, val: number, color: string) => (
      <span key={key} style={{ color: "#cfc8ec", whiteSpace: "nowrap" }}>
        {BASE_RESOURCES[key]?.emoji} {label}: <b style={{ color }}>{fmtNum(key, val)}</b>
      </span>
    );

    const handleCraft = useCallback(() => {
      if (!plan.ok) return;
      onCraftRecursive(targetId, qty);
      setToast({ id: Date.now(), text: `✨ ${qty}× ${target.name} geschmiedet!` });
    }, [plan.ok, onCraftRecursive, targetId, qty, target.name]);

    useEffect(() => {
      if (!toast) return;
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }, [toast?.id]);

    const maxQty = 99;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="pk-craft-panel flex flex-col"
        backdropClassName="fixed inset-0 z-50 flex items-center justify-center p-4 max-[900px]:p-0 bg-gray-950/65 backdrop-blur-sm"
      >
        {/* In-modal toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className="pk-craft-toast"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="pk-craft-hd">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🔨</span>
            <div>
              <div className="pk-craft-hd__eyebrow">Kosmische Synthese</div>
              <div className="pk-craft-hd__title">Sternen-Schmiede &amp; Alchemie</div>
            </div>
          </div>
          <button className="pk-craft-hd__close" onClick={onClose} title="Schließen">
            ✕
          </button>
        </div>

        {/* Resource aura bar */}
        <div className="pk-craft-aura">
          {auraItem("life", "Leben", life, "#fff")}
          {auraItem("stars", "Sterne", starsCount, "#fef08a")}
          {auraItem("moons", "Monde", moonsCount, "#caa5fe")}
          {auraItem("glitter", "Glitzerstaub", glitterDust, "#e879f9")}
          {auraItem("lootboxes", "Lootboxen", shootingStarsCount, "#fcd34d")}
        </div>

        {isMobile ? (
          /* ── Mobile layout: recipe picker + scrollable plan + pinned craft btn ── */
          <>
            {/* Recipe picker trigger */}
            <button
              className="pk-craft-mobile-recipe-btn"
              onClick={() => setMobileRecipeOpen(true)}
            >
              <span>{target.emoji}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{target.name}</span>
              <span style={{ opacity: 0.5 }}>▼</span>
            </button>

            {/* Recipe overlay */}
            <AnimatePresence>
              {mobileRecipeOpen && (
                <motion.div
                  className="pk-craft-mobile-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setMobileRecipeOpen(false)}
                >
                  <motion.div
                    className="pk-craft-mobile-overlay__panel"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 38 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="pk-craft-tabs" style={{ padding: "11px 11px 4px" }}>
                      <button
                        className={`pk-craft-tab ${cat === "materials" ? "pk-craft-tab--on" : ""}`}
                        onClick={() => setCat("materials")}
                      >
                        ▦ Rohstoffe
                      </button>
                      <button
                        className={`pk-craft-tab ${cat === "consumables" ? "pk-craft-tab--on" : ""}`}
                        onClick={() => setCat("consumables")}
                      >
                        📦 Elixiere/Boxen
                      </button>
                    </div>
                    <div className="pk-craft-search" style={{ padding: "0 11px 8px" }}>
                      <input
                        placeholder="Rezept suchen… 🔎"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="pk-craft-list" style={{ maxHeight: "55vh" }}>
                      {filteredList.map((r) => {
                        const recipeHave = resolve(r.result.id, 1, have);
                        const isOn = targetId === r.result.id;
                        return (
                          <div
                            key={r.result.id}
                            className={`pk-craft-rrow ${isOn ? "pk-craft-rrow--on" : ""}`}
                            onClick={() => pick(r.result.id)}
                          >
                            <span className="pk-craft-rrow__em">{r.result.emoji}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="pk-craft-rrow__nm">{r.result.name}</div>
                              <div className="pk-craft-rrow__sub">{r.description}</div>
                            </div>
                            <span
                              className="pk-craft-dot"
                              style={{ background: recipeHave.ok ? "#34d399" : "#5b5680" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable plan */}
            <div className="pk-craft-mobile-plan">
              <SummaryContent
                target={target}
                qty={qty}
                setQty={setQty}
                plan={plan}
                have={have}
                fmtNum={fmtNum}
                maxQty={maxQty}
                showPlan
              />
            </div>

            {/* Pinned craft button */}
            <div className="pk-craft-mobile-foot">
              <CraftButton planOk={plan.ok} qty={qty} onCraft={handleCraft} />
            </div>
          </>
        ) : (
          /* ── Desktop layout: rail + graph stage + summary column ── */
          <div className="pk-craft-body">
            {/* Left rail */}
            <div className="pk-craft-rail">
              <div className="pk-craft-tabs">
                <button
                  className={`pk-craft-tab ${cat === "materials" ? "pk-craft-tab--on" : ""}`}
                  onClick={() => setCat("materials")}
                >
                  ▦ Rohstoffe
                </button>
                <button
                  className={`pk-craft-tab ${cat === "consumables" ? "pk-craft-tab--on" : ""}`}
                  onClick={() => setCat("consumables")}
                >
                  📦 Elixiere/Boxen
                </button>
              </div>
              <div className="pk-craft-search">
                <input
                  placeholder="Rezept suchen… 🔎"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="pk-craft-list">
                {filteredList.map((r) => {
                  const recipeHave = resolve(r.result.id, 1, have);
                  const isOn = targetId === r.result.id;
                  return (
                    <div
                      key={r.result.id}
                      className={`pk-craft-rrow ${isOn ? "pk-craft-rrow--on" : ""}`}
                      onClick={() => pick(r.result.id)}
                    >
                      <span className="pk-craft-rrow__em">{r.result.emoji}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="pk-craft-rrow__nm">{r.result.name}</div>
                        <div className="pk-craft-rrow__sub">{r.description}</div>
                      </div>
                      <span
                        className="pk-craft-dot"
                        style={{ background: recipeHave.ok ? "#34d399" : "#5b5680" }}
                        title={recipeHave.ok ? "schmiedbar" : "fehlende Materialien"}
                      />
                    </div>
                  );
                })}
                {filteredList.length === 0 && (
                  <div
                    className="pk-craft-planempty"
                    style={{ textAlign: "center", padding: "24px 0" }}
                  >
                    Keine Rezepte gefunden
                  </div>
                )}
              </div>
            </div>

            {/* Graph stage */}
            <div className="pk-craft-stage">
              <div className="pk-craft-crumb">
                {stack.map((id, i) => {
                  const it = getItem(id);
                  const cur = i === stack.length - 1;
                  return (
                    <React.Fragment key={id + i}>
                      {i > 0 && <span style={{ color: "#6f6a99" }}>▸</span>}
                      <span
                        className={`pk-craft-crumb__seg ${cur ? "pk-craft-crumb__seg--cur" : ""}`}
                        onClick={cur ? undefined : () => crumbTo(i)}
                      >
                        {it.emoji} {it.name}
                      </span>
                    </React.Fragment>
                  );
                })}
                <span className="pk-craft-crumb__hint">
                  Klicke ein schmiedbares Teil, um zu seiner Quelle zu springen ↗
                </span>
              </div>

              <div
                className="pk-craft-graph"
                ref={graphScrollRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div className="pk-craft-zoom">
                  <button
                    className="pk-craft-zoom__btn"
                    onClick={() => zoomBy(1.25)}
                    title="Einzoomen"
                  >
                    ＋
                  </button>
                  <button className="pk-craft-zoom__btn" onClick={fitToView} title="Alles zeigen">
                    ⟳
                  </button>
                  <button
                    className="pk-craft-zoom__btn"
                    onClick={() => zoomBy(0.8)}
                    title="Auszoomen"
                  >
                    －
                  </button>
                </div>
                <div
                  ref={innerRef}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    transformOrigin: "0 0",
                  }}
                >
                  <svg
                    className="pk-craft-edges"
                    width={edgeGeo.w}
                    height={edgeGeo.h}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      pointerEvents: "none",
                      overflow: "visible",
                    }}
                  >
                    {edgeGeo.paths.map((p, i) => {
                      const status = statusByUid.get(p.childUid);
                      const isShort = status === "short";
                      const isOk = status === "ok" || status === "have";
                      const isMake = status === "make";
                      const color = isShort
                        ? "rgba(251,113,133,.55)"
                        : isOk
                          ? "rgba(52,211,153,.5)"
                          : "rgba(202,165,254,.55)";
                      return (
                        <path
                          key={i}
                          d={p.d}
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className={isMake ? "edge--make" : ""}
                        />
                      );
                    })}
                  </svg>
                  <NodeGroup
                    node={root}
                    have={have}
                    isRoot
                    onDrill={drill}
                    formatNum={(n) => String(n)}
                  />
                </div>
              </div>
            </div>

            {/* Right summary */}
            <div className="pk-craft-sum">
              <SummaryContent
                target={target}
                qty={qty}
                setQty={setQty}
                plan={plan}
                have={have}
                fmtNum={fmtNum}
                maxQty={maxQty}
                showPlan
              />
              <div className="pk-craft-sum__foot">
                <CraftButton planOk={plan.ok} qty={qty} onCraft={handleCraft} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    );
  },
);

CraftingModal.displayName = "CraftingModal";
