import React from "react";
import { motion } from "motion/react";
import { Coins, Gem, Crown, Frown, Sparkles } from "lucide-react";

import { ROGUELITE_ACT_BOSS_STATIONS, ROGUELITE_TOTAL_STATIONS } from "../../roguelite/engine";
import { ROGUELITE_BOSSES } from "../../roguelite/data";
import type { ActiveRogueliteRun, RogueliteRewardPackage } from "../../roguelite/types";
import { RelicCard } from "./RelicCard";
import {
  CATEGORY_VISUALS,
  Eyebrow,
  Panel,
  PrimaryButton,
  cx,
  usePrefersReducedMotion,
} from "./theme";

const REWARD_CHEST = "/assets/roguelite/roguelite_reward_chest.webp";

export function buildDefeatPreview(run: ActiveRogueliteRun) {
  let glitterDust = 24;
  let shards = 0;
  let rewardLabel = "Kleine Trosttruhe";
  if (run.completedStations >= ROGUELITE_ACT_BOSS_STATIONS[0]) {
    glitterDust += 18;
    shards = 1;
    rewardLabel = "Mittlere Trosttruhe";
  }
  if (run.completedStations >= ROGUELITE_ACT_BOSS_STATIONS[1]) {
    glitterDust += 22;
    shards = 2;
    rewardLabel = "Tiefe Trosttruhe";
  }
  return { rewardLabel, glitterDust, shards };
}

function RewardCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Coins;
  label: string;
  value: number;
  tone: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
    >
      <div
        className={cx(
          "flex size-10  items-center justify-center rounded-2xl border bg-black/25",
          tone,
        )}
      >
        <Icon className="size-5 " />
      </div>
      <div>
        <div className="text-2xl font-black leading-none text-cosmic-text">{value}</div>
        <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cosmic-accent-muted">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function BuildRecap({ activeRun }: { activeRun: ActiveRogueliteRun }) {
  const grouped = activeRun.boons.reduce<Record<string, number>>((acc, boon) => {
    acc[boon.category] = (acc[boon.category] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(grouped);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <Eyebrow>Dein Build</Eyebrow>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-black text-cosmic-text">{activeRun.boons.length} Boni</span>
        <span className="text-[12px] text-cosmic-text-muted">
          · Station {Math.min(activeRun.completedStations, ROGUELITE_TOTAL_STATIONS)}/
          {ROGUELITE_TOTAL_STATIONS}
        </span>
      </div>
      {entries.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entries.map(([category, count]) => {
            const cat = CATEGORY_VISUALS[category as keyof typeof CATEGORY_VISUALS];
            if (!cat) return null;
            const Icon = cat.icon;
            return (
              <span
                key={category}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  cat.soft,
                  cat.text,
                )}
              >
                <Icon className="size-3 " />
                {cat.label} ×{count}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-cosmic-text-muted">Ein schneller, schlanker Lauf.</p>
      )}
    </div>
  );
}

export const Results: React.FC<{
  mode: "victory" | "defeat";
  activeRun: ActiveRogueliteRun;
  rewardLabel: string;
  shards: number;
  glitterDust: number;
  rewardPackage?: RogueliteRewardPackage | null;
  selectedRelicId?: string;
  onSelectRelic?: (relicId: string) => void;
  onClaim: () => void;
}> = ({
  mode,
  activeRun,
  rewardLabel,
  shards,
  glitterDust,
  rewardPackage,
  selectedRelicId,
  onSelectRelic,
  onClaim,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const isVictory = mode === "victory";
  const boss = ROGUELITE_BOSSES.find((entry) => entry.id === activeRun.boss.bossId);

  return (
    <Panel className="mx-auto flex size-full  max-w-5xl flex-col overflow-hidden p-5 sm:p-6">
      {/* Banner */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cx(
          "flex items-center gap-4 rounded-3xl border p-5",
          isVictory
            ? "border-cosmic-yellow/35 bg-[linear-gradient(120deg,rgba(254,240,138,0.12),rgba(202,165,254,0.1))]"
            : "border-rose-300/25 bg-[linear-gradient(120deg,rgba(244,114,182,0.08),rgba(27,25,53,0.4))]",
        )}
      >
        <div
          className={cx(
            "flex size-16  shrink-0 items-center justify-center rounded-2xl border",
            isVictory
              ? "border-cosmic-yellow/45 bg-cosmic-yellow/15 shadow-[0_0_28px_rgba(254,240,138,0.5)]"
              : "border-rose-300/35 bg-rose-400/12",
          )}
        >
          {isVictory ? (
            <Crown className="size-8  text-cosmic-yellow" />
          ) : (
            <Frown className="size-8  text-rose-200" />
          )}
        </div>
        <div className="min-w-0">
          <Eyebrow className={isVictory ? "text-cosmic-yellow" : "text-rose-200"}>
            {isVictory ? "Lauf gewonnen" : "Lauf beendet"}
          </Eyebrow>
          <h2 className="mt-1 text-3xl font-black tracking-[0.01em] text-cosmic-text sm:text-4xl">
            {isVictory ? "Sieg!" : "Niederlage"}
          </h2>
          <p className="mt-1 text-[13px] text-cosmic-text-muted">
            {rewardLabel}
            {isVictory && boss ? ` · ${boss.name} bezwungen` : ""}
          </p>
        </div>
      </motion.div>

      <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: recap + rewards */}
        <div className="flex flex-col gap-3">
          <BuildRecap activeRun={activeRun} />
          <div className="grid grid-cols-2 gap-3">
            <RewardCard
              icon={Gem}
              label="Splitter"
              value={shards}
              tone="border-fuchsia-300/35 text-fuchsia-200"
            />
            <RewardCard
              icon={Coins}
              label="Glitzerstaub"
              value={glitterDust}
              tone="border-pink-300/35 text-pink-200"
            />
          </div>
          {isVictory && (
            <img
              src={REWARD_CHEST}
              alt="Roguelite Siegestruhe"
              className="mx-auto hidden w-full max-w-48 object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] lg:block"
            />
          )}
        </div>

        {/* Right: relic pick (victory) or message (defeat) */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-black/20 p-4">
          {isVictory && rewardPackage && onSelectRelic ? (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4  text-cosmic-accent" />
                <Eyebrow className="text-cosmic-accent">Reliktwahl</Eyebrow>
              </div>
              <p className="mt-1 text-[12.5px] text-cosmic-text-muted">
                Wähle ein Relikt, das du für kommende Läufe freischaltest.
              </p>
              <div className="mt-3 grid min-h-0 flex-1 gap-3 overflow-y-auto -mx-1 px-1 pt-1 pb-3 sm:grid-cols-3">
                {rewardPackage.relicChoiceIds.map((relicId) => (
                  <RelicCard
                    key={relicId}
                    relicId={relicId}
                    selected={selectedRelicId === relicId}
                    onClick={() => onSelectRelic(relicId)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <img
                src={REWARD_CHEST}
                alt="Roguelite Trosttruhe"
                className="w-full max-w-44 object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
              />
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-cosmic-text-muted">
                Auch ein verlorener Lauf lässt dir noch etwas Sinnvolles – sichere deine Trostbeute
                und starte den nächsten Versuch.
              </p>
            </div>
          )}

          <PrimaryButton
            onClick={onClaim}
            disabled={isVictory && !selectedRelicId}
            className="mt-4 w-full py-3.5"
          >
            {isVictory ? "Belohnungen sichern" : "Trostbelohnung einsammeln"}
          </PrimaryButton>
        </div>
      </div>
    </Panel>
  );
};
