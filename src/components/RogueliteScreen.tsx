import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Compass,
  Crown,
  Gift,
  Heart,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Telescope,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

import {
  ROGUELITE_BOSS_MUTATIONS,
  ROGUELITE_NODE_LABELS,
  ROGUELITE_RELICS,
} from "../roguelite/data";
import type {
  ActiveRogueliteRun,
  RogueliteChoice,
  RogueliteMetaState,
  RoguelitePathChoice,
  RogueliteRewardPackage,
} from "../roguelite/types";

interface RogueliteScreenProps {
  isOpen: boolean;
  meta: RogueliteMetaState;
  activeRun: ActiveRogueliteRun | null;
  onClose: () => void;
  onStartRun: () => void;
  onChooseEncounter: (choiceId: string) => void;
  onChoosePath: (pathId: string) => void;
  onRerollEncounter: () => void;
  onToggleEquipRelic: (relicId: string) => void;
  onClaimVictory: (selectedRelicId: string) => void;
  onClaimDefeat: () => void;
}

const ART = {
  backdrop: "/assets/roguelite/roguelite_background_full.png",
  particles: "/assets/roguelite/roguelite_particles_overlay.png",
  rewardChest: "/assets/roguelite/roguelite_reward_chest.png",
  bossComet: "/assets/roguelite/roguelite_boss_comet.png",
  logo: "/assets/roguelite/roguelite_logo.png",
  logoGlow: "/assets/roguelite/roguelite_logo_glow.png",
};

const dangerClasses: Record<string, string> = {
  low: "border-emerald-300/60 bg-emerald-400/15 text-emerald-50",
  medium: "border-sky-300/60 bg-sky-400/15 text-sky-50",
  high: "border-amber-300/60 bg-amber-400/20 text-amber-50",
  extreme: "border-rose-300/70 bg-rose-400/20 text-rose-50",
};

function panelStyle(extra?: string): string {
  return `overflow-hidden rounded-[2rem] border border-white/14 bg-[rgba(20,12,38,0.84)] shadow-[0_20px_60px_rgba(16,10,34,0.3)] backdrop-blur-xl ${extra ?? ""}`;
}

type FrameVariant = "soft" | "station" | "wide";

function FramePanel({
  className,
  children,
  variant = "soft",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: FrameVariant;
}) {
  const accentByVariant: Record<FrameVariant, string> = {
    soft: "from-white/8 via-white/4 to-transparent",
    station: "from-fuchsia-300/10 via-white/4 to-transparent",
    wide: "from-cyan-300/10 via-white/4 to-transparent",
  };
  return (
    <div className={`${panelStyle(className)} relative`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentByVariant[variant]}`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-black/15 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cosmic-accent-muted">
        {label}
      </div>
      <div className={`mt-1 text-sm font-black ${accent ?? "text-cosmic-text"}`}>{value}</div>
    </div>
  );
}

function PreviewBlock({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-[1.15rem] border px-3 py-2 ${tone}`}>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em]">{title}</div>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="text-xs leading-relaxed">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildDefeatPreview(run: ActiveRogueliteRun) {
  let glitterDust = 16;
  let shards = 0;
  if (run.completedStations >= 5) glitterDust += 10;
  if (run.completedStations >= 8) shards = 1;
  return {
    rewardLabel: run.completedStations >= 8 ? "Grosse Trosttruhe" : "Kleine Trosttruhe",
    glitterDust,
    shards,
  };
}

const RewardValueCard: React.FC<{
  label: string;
  value: string;
  accent: string;
}> = ({ label, value, accent }) => (
  <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-center">
    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
      {label}
    </div>
    <div className={`mt-2 text-lg font-black ${accent}`}>{value}</div>
  </div>
);

const RewardPanel: React.FC<{
  mode: "victory" | "defeat";
  rewardLabel: string;
  shards: number;
  glitterDust: number;
  rewardPackage?: RogueliteRewardPackage | null;
  selectedRelicId?: string;
  onSelectRelic?: (relicId: string) => void;
  onClaim: () => void;
}> = ({
  mode,
  rewardLabel,
  shards,
  glitterDust,
  rewardPackage,
  selectedRelicId,
  onSelectRelic,
  onClaim,
}) => {
  const isVictory = mode === "victory";
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(34,21,61,0.96),rgba(18,11,36,0.98))] px-4 py-5 shadow-[0_20px_60px_rgba(255,157,184,0.12)] sm:px-6">
      <img
        src={ART.particles}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="relative">
        <div className="mx-auto max-w-3xl rounded-[1.7rem] border border-white/12 bg-white/8 px-4 py-4 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cosmic-accent-muted">
            {isVictory ? "Siegestruhe" : "Trosttruhe"}
          </div>
          <h4 className="mt-2 text-lg font-black uppercase tracking-[0.14em] text-cosmic-text sm:text-xl">
            {rewardLabel}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-cosmic-text-muted">
            {isVictory
              ? "Hier liegt deine komplette Endbeute sichtbar vor dir, bevor du irgendetwas bestaetigst."
              : "Die Trosttruhe zeigt dir ruhig und eindeutig, was aus diesem Lauf erhalten bleibt."}
          </p>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[1.8rem] border border-white/12 bg-white/6 p-4">
            <img
              src={ART.rewardChest}
              alt={isVictory ? "Roguelite Siegestruhe" : "Roguelite Trosttruhe"}
              className="mx-auto w-full max-w-[18rem] object-contain drop-shadow-[0_16px_40px_rgba(255,167,197,0.22)]"
            />
            <p className="mt-3 text-center text-sm leading-relaxed text-cosmic-text-muted">
              {isVictory
                ? "Splitter, Glitzerstaub und deine Reliktwahl werden erst eingesammelt, wenn du zufrieden bist."
                : "Auch ein gefallener Run hinterlaesst dir noch etwas Sinnvolles statt nur Frust."}
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-white/12 bg-white/6 p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cosmic-accent-muted">
              Vorschau
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RewardValueCard label="Splitter" value={`${shards}`} accent="text-fuchsia-200" />
              <RewardValueCard
                label="Glitzerstaub"
                value={`${glitterDust}`}
                accent="text-cyan-200"
              />
            </div>

            {isVictory && rewardPackage && onSelectRelic && (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-cosmic-accent-muted">
                    Reliktwahl
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {rewardPackage.relicChoiceIds.map((relicId) => {
                    const relic = ROGUELITE_RELICS.find((entry) => entry.id === relicId);
                    if (!relic) return null;
                    const selected = selectedRelicId === relic.id;
                    return (
                      <button
                        key={relic.id}
                        onClick={() => onSelectRelic(relic.id)}
                        className={`relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition ${
                          selected
                            ? "border-cosmic-pink/60 bg-cosmic-pink/12"
                            : "border-white/12 bg-black/10 hover:border-cosmic-accent/45 hover:bg-black/15"
                        }`}
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(28,18,53,0.94), rgba(17,11,32,0.94))`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="relative">
                          <div className="text-sm font-black uppercase tracking-[0.12em] text-cosmic-text">
                            {relic.name}
                          </div>
                          <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.16em] text-cosmic-accent-muted">
                            {relic.shortLabel}
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-cosmic-text-muted">
                            {relic.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {!isVictory && (
              <div className="mt-5 rounded-[1.4rem] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
                Deine Route war nicht umsonst. Die Truhe zeigt dir exakt, was als Trost aus diesem
                Lauf uebrig bleibt, bevor du weitermachst.
              </div>
            )}

            <button
              onClick={onClaim}
              disabled={isVictory && !selectedRelicId}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[1.6rem] border px-4 py-4 text-sm font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isVictory
                  ? "border-cosmic-pink/60 bg-gradient-to-r from-cosmic-pink via-cosmic-accent to-cyan-400 text-[#0b0818] shadow-[0_20px_55px_rgba(202,165,254,0.3)]"
                  : "border-amber-400/45 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-[#2b1701] shadow-[0_20px_55px_rgba(245,158,11,0.22)]"
              }`}
            >
              <Gift className="h-4 w-4" />
              {isVictory ? "Belohnungen sichern" : "Trostbelohnung einsammeln"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChoiceCard: React.FC<{
  choice: RogueliteChoice;
  onClick: () => void;
}> = ({ choice, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded-[1.6rem] border border-white/15 bg-[linear-gradient(180deg,rgba(32,20,58,0.9),rgba(24,16,45,0.86))] p-4 text-left transition hover:-translate-y-0.5 hover:border-cosmic-pink/55 hover:shadow-[0_18px_48px_rgba(255,157,184,0.18)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.14em] text-cosmic-text">
            {choice.title}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-cosmic-text-muted">
            {choice.description}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-cosmic-accent-muted">
          {choice.effectLabel ?? choice.kind}
        </div>
      </div>

      {choice.preview && (
        <div className="mt-4 grid gap-2">
          <PreviewBlock
            title="Sofort"
            items={choice.preview.gains}
            tone="border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
          />
          <PreviewBlock
            title="Preis"
            items={choice.preview.costs}
            tone="border-amber-300/30 bg-amber-400/10 text-amber-50"
          />
          <PreviewBlock
            title="Risiko"
            items={choice.preview.risks}
            tone="border-rose-300/30 bg-rose-400/10 text-rose-50"
          />
          {(choice.preview.synergyHint || choice.preview.rewardPreview) && (
            <div className="rounded-[1.15rem] border border-white/12 bg-white/5 px-3 py-2">
              {choice.preview.synergyHint && (
                <div className="text-xs leading-relaxed text-cyan-100">
                  <span className="font-black uppercase tracking-[0.12em] text-cyan-200">
                    Run-Wert:
                  </span>{" "}
                  {choice.preview.synergyHint}
                </div>
              )}
              {choice.preview.rewardPreview && (
                <div className="mt-2 text-xs leading-relaxed text-fuchsia-100">
                  <span className="font-black uppercase tracking-[0.12em] text-fuchsia-200">
                    Reward:
                  </span>{" "}
                  {choice.preview.rewardPreview}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  );
};

const PathCard: React.FC<{
  pathChoice: RoguelitePathChoice;
  onClick: () => void;
}> = ({ pathChoice, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded-[1.7rem] border border-white/15 bg-[linear-gradient(180deg,rgba(35,23,64,0.92),rgba(24,16,45,0.88))] p-5 text-left transition hover:-translate-y-0.5 hover:border-cosmic-pink/60"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black uppercase tracking-[0.14em] text-cosmic-text">
          {pathChoice.node.label}
        </div>
        <div
          className={`rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] ${
            dangerClasses[pathChoice.node.danger] ?? dangerClasses.medium
          }`}
        >
          {pathChoice.node.danger}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-cosmic-text-muted">
        {pathChoice.node.description}
      </p>
      <div className="mt-4 space-y-2">
        <div className="rounded-[1rem] border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2 text-xs text-fuchsia-100">
          <span className="font-black uppercase tracking-[0.12em] text-fuchsia-200">Reward:</span>{" "}
          {pathChoice.rewardPreview}
        </div>
        <div className="rounded-[1rem] border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          <span className="font-black uppercase tracking-[0.12em] text-rose-200">Risiko:</span>{" "}
          {pathChoice.riskPreview}
        </div>
        <div className="rounded-[1rem] border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
          <span className="font-black uppercase tracking-[0.12em] text-cyan-200">Run-Wert:</span>{" "}
          {pathChoice.routeHint}
        </div>
      </div>
    </button>
  );
};

export const RogueliteScreen: React.FC<RogueliteScreenProps> = React.memo(
  ({
    isOpen,
    meta,
    activeRun,
    onClose,
    onStartRun,
    onChooseEncounter,
    onChoosePath,
    onRerollEncounter,
    onToggleEquipRelic,
    onClaimVictory,
    onClaimDefeat,
  }) => {
    const [selectedRelicId, setSelectedRelicId] = React.useState("");

    React.useEffect(() => {
      if (activeRun?.rewardPackage) {
        setSelectedRelicId(activeRun.rewardPackage.relicChoiceIds[0] ?? "");
      } else {
        setSelectedRelicId("");
      }
    }, [activeRun?.rewardPackage]);

    if (!isOpen) return null;

    const bossMutations = activeRun
      ? activeRun.boss.mutationIds
          .map((id) => ROGUELITE_BOSS_MUTATIONS.find((mutation) => mutation.id === id))
          .filter(Boolean)
      : [];

    const groupedBoons = activeRun
      ? activeRun.boons.reduce((acc: Record<string, number>, boon) => {
          acc[boon.category] = (acc[boon.category] ?? 0) + 1;
          return acc;
        }, {})
      : null;
    const defeatPreview = activeRun?.phase === "defeat" ? buildDefeatPreview(activeRun) : null;

    return (
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] overflow-y-auto text-cosmic-text"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(9,6,22,0.4), rgba(18,12,36,0.82)), url(${ART.particles}), url(${ART.backdrop})`,
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center, center",
          }}
        >
          <div className="relative min-h-screen px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 rounded-[2rem] bg-[rgba(18,10,34,0.78)] px-4 py-4 shadow-[0_18px_55px_rgba(24,7,44,0.28)] sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <img
                    src={ART.logoGlow}
                    alt="Roguelite"
                    className="h-14 w-auto shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-cosmic-accent-muted">
                      Dreamy Nebenmodus
                    </div>
                    <h2 className="mt-1 text-xl font-black uppercase tracking-[0.14em] text-cosmic-text sm:text-2xl">
                      Roguelite
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-cosmic-text-muted">
                      Kurze Laeufe, klare Entscheidungen und ein sichtbares Belohnungsfenster am
                      Ende.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatChip label="Siege" value={`${meta.wins}`} accent="text-fuchsia-200" />
                  <StatChip label="Niederlagen" value={`${meta.losses}`} accent="text-cyan-200" />
                  <StatChip
                    label="Splitter gesichert"
                    value={`${meta.shardRewardsClaimed}`}
                    accent="text-amber-200"
                  />
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/20 transition hover:border-cosmic-pink/70 hover:bg-black/30"
                title="Roguelite schliessen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!activeRun && (
              <div className="mx-auto mt-6 grid w-full max-w-7xl gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <FramePanel className="p-5 sm:p-6" variant="wide">
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-cosmic-pink/40 bg-cosmic-pink/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cosmic-pink">
                        <Compass className="h-3.5 w-3.5" />
                        Jeder Run bekommt einen eigenen unsichtbaren Seed
                      </div>
                      <h3 className="mt-4 text-2xl font-black uppercase tracking-[0.12em] text-cosmic-text sm:text-3xl">
                        Kein Lauf soll sich wie der letzte anfuehlen
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cosmic-text-muted">
                        Jeder Run baut seine Route neu. Du liest ruhige Karten, triffst klare Picks
                        und formst daraus einen kleinen Build bis zur Endtruhe.
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatChip
                          label="Hoechste Station"
                          value={`${meta.highestStation}/10`}
                          accent="text-cyan-200"
                        />
                        <StatChip
                          label="Freie Rerolls"
                          value={`${meta.bonusRerolls}`}
                          accent="text-amber-200"
                        />
                        <StatChip
                          label="Relikte"
                          value={`${meta.unlockedRelics.length}`}
                          accent="text-fuchsia-200"
                        />
                        <StatChip
                          label="Archivskins"
                          value={`${meta.unlockedPlanetSkins.length}`}
                          accent="text-emerald-200"
                        />
                      </div>

                      <div className="mt-8 rounded-[1.6rem] border border-white/12 bg-white/6 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                          So laeuft es ab
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div className="rounded-[1.2rem] border border-fuchsia-300/20 bg-fuchsia-400/10 p-3 text-sm text-fuchsia-100">
                            1. Sammle ueber 10 Stationen kleine Boni und forme damit deinen
                            temporaren Run-Build.
                          </div>
                          <div className="rounded-[1.2rem] border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                            2. Jede Wahl erklaert dir sofort Gewinn, Risiko und spaetere Richtung.
                          </div>
                          <div className="rounded-[1.2rem] border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                            3. Am Ende siehst du deine Belohnung komplett, bevor du sie einsammelst.
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={onStartRun}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[1.6rem] border border-cosmic-pink/60 bg-gradient-to-r from-cosmic-pink via-cosmic-accent to-cyan-400 px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#0b0818] shadow-[0_20px_55px_rgba(202,165,254,0.3)] transition hover:scale-[1.01]"
                      >
                        <Swords className="h-4 w-4" />
                        Neuen Run starten
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="rounded-[1.8rem] border border-white/12 bg-white/6 p-5">
                        <div className="flex items-center justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,rgba(255,192,203,0.18),transparent_65%)] px-4 py-4">
                          <img
                            src={ART.bossComet}
                            alt="Roguelite Boss-Komet"
                            className="h-32 w-auto object-contain drop-shadow-[0_18px_45px_rgba(255,164,201,0.2)]"
                          />
                        </div>
                        <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/10 px-4 py-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                            Was diesen Modus besonders macht
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-cosmic-text-muted">
                            Kleine, gut lesbare Entscheidungen statt riesiger Infowand. Du sollst
                            schnell verstehen, was ein Pick bringt und warum er suess oder riskant
                            ist.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                          Belohnungen
                        </div>
                        <div className="mt-3 space-y-3 text-sm leading-relaxed text-cosmic-text-muted">
                          <div>
                            <span className="font-black uppercase tracking-[0.12em] text-fuchsia-200">
                              Sieg:
                            </span>{" "}
                            Reliktwahl, Dust und Splitter in einem klaren Reward-Fenster.
                          </div>
                          <div>
                            <span className="font-black uppercase tracking-[0.12em] text-cyan-200">
                              Waehle bewusst:
                            </span>{" "}
                            Karten sagen dir, was sie sofort tun und welche Richtung sie staerken.
                          </div>
                          <div>
                            <span className="font-black uppercase tracking-[0.12em] text-amber-200">
                              Niederlage:
                            </span>{" "}
                            Selbst ein verlorener Run gibt dir noch eine sichtbare Trostbelohnung.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </FramePanel>

                <FramePanel className="p-5 sm:p-6" variant="soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                        Ausgeruestete Relikte
                      </div>
                      <h4 className="mt-1 text-lg font-black uppercase tracking-[0.14em] text-cosmic-text">
                        Maximal 2 aktiv pro Run
                      </h4>
                    </div>
                    <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-fuchsia-200">
                      {meta.equippedRelicIds.length}/2 aktiv
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {ROGUELITE_RELICS.map((relic) => {
                      const isUnlocked = meta.unlockedRelics.includes(relic.id);
                      const isEquipped = meta.equippedRelicIds.includes(relic.id);
                      return (
                        <button
                          key={relic.id}
                          onClick={() => isUnlocked && onToggleEquipRelic(relic.id)}
                          disabled={!isUnlocked}
                          className={`rounded-[1.45rem] border p-4 text-left transition ${
                            isEquipped
                              ? "border-cosmic-pink/65 bg-cosmic-pink/10 shadow-[0_0_35px_rgba(255,157,184,0.16)]"
                              : isUnlocked
                                ? "border-white/12 bg-black/15 hover:border-cosmic-accent/55 hover:bg-black/20"
                                : "border-white/5 bg-black/10 opacity-45"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-black uppercase tracking-[0.12em] text-cosmic-text">
                                {relic.name}
                              </div>
                              <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cosmic-accent-muted">
                                {relic.shortLabel}
                              </div>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-cosmic-text-muted">
                              {isUnlocked ? (isEquipped ? "Aktiv" : "Bereit") : "Gesperrt"}
                            </div>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-cosmic-text-muted">
                            {relic.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </FramePanel>
              </div>
            )}

            {activeRun && (
              <div className="mx-auto mt-6 grid w-full max-w-7xl gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <FramePanel className="p-5 sm:p-6" variant="soft">
                    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-100">
                          <Telescope className="h-3.5 w-3.5" />
                          {activeRun.runArchetype.title}
                        </div>
                        <h3 className="mt-4 text-2xl font-black uppercase tracking-[0.14em] text-cosmic-text">
                          Station{" "}
                          {Math.min(
                            10,
                            activeRun.completedStations +
                              (activeRun.phase === "path" ? 1 : 0) +
                              (activeRun.phase === "boss" ? 10 : 0),
                          )}{" "}
                          / 10
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-cosmic-text-muted">
                          {activeRun.runArchetype.description} {activeRun.runArchetype.playstyle}
                        </p>
                        <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-relaxed text-cosmic-text-muted">
                          Lies zuerst die grosse Ueberschrift und dann nur die hervorgehobenen Boxen
                          darunter. So bleibt jede Station schnell erfassbar statt ueberfuellt.
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <StatChip
                            label="Run-Leben"
                            value={`${Math.round(activeRun.stats.runLife)} / ${Math.round(activeRun.stats.maxLife)}`}
                            accent="text-rose-200"
                          />
                          <StatChip
                            label="Schild"
                            value={`${Math.round(activeRun.stats.runShield)}`}
                            accent="text-sky-200"
                          />
                          <StatChip
                            label="Klicks"
                            value={`${Math.round(activeRun.stats.runClicks)}`}
                            accent="text-cosmic-pink"
                          />
                          <StatChip
                            label="Passiv"
                            value={`${Math.round(activeRun.stats.runPassive)}`}
                            accent="text-emerald-200"
                          />
                          <StatChip
                            label="Crit"
                            value={`${Math.round(activeRun.stats.runCritChance * 100)}% • x${activeRun.stats.runCritPower.toFixed(2)}`}
                            accent="text-amber-200"
                          />
                          <StatChip
                            label="Bossschaden"
                            value={`${Math.round(activeRun.stats.bossDamage)}`}
                            accent="text-fuchsia-200"
                          />
                          <StatChip
                            label="Rerolls"
                            value={`${activeRun.stats.rerolls}`}
                            accent="text-cyan-200"
                          />
                          <StatChip
                            label="Kristallstaub"
                            value={`${Math.round(activeRun.stats.crystalDust)}`}
                            accent="text-purple-200"
                          />
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={ART.bossComet}
                            alt="Boss-Komet"
                            className="h-16 w-16 object-contain"
                          />
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                              Aktive Run-Regeln
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-cosmic-text-muted">
                              Diese kleinen Modifikatoren bestimmen, worauf dein Lauf gerade am
                              liebsten spielt.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {activeRun.runModifiers.map((modifier) => (
                            <div
                              key={modifier.id}
                              className="rounded-[1rem] border border-white/10 bg-black/10 px-3 py-2"
                            >
                              <div className="text-xs font-black uppercase tracking-[0.12em] text-cosmic-text">
                                {modifier.title}
                              </div>
                              <div className="mt-1 text-[11px] leading-relaxed text-cosmic-text-muted">
                                {modifier.effectLabel}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FramePanel>

                  <FramePanel className="p-5 sm:p-6" variant="wide">
                    {activeRun.phase === "path" && (
                      <>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-200">
                          <Compass className="h-3.5 w-3.5" />
                          Weggabelung
                        </div>
                        <h4 className="mt-4 text-xl font-black uppercase tracking-[0.14em] text-cosmic-text">
                          Waehl die Route mit dem besseren Gesamtwert
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-cosmic-text-muted">
                          Jede Karte zeigt dir jetzt nicht nur das Thema, sondern auch den
                          wahrscheinlichen Reward, den Preis und wofuer sich die Route im Rest des
                          Runs eignet.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          {activeRun.pathChoices.map((pathChoice) => (
                            <PathCard
                              key={pathChoice.id}
                              pathChoice={pathChoice}
                              onClick={() => onChoosePath(pathChoice.id)}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {(activeRun.phase === "node" ||
                      activeRun.phase === "event" ||
                      activeRun.phase === "boss" ||
                      activeRun.phase === "victory_rewards" ||
                      activeRun.phase === "defeat") && (
                      <>
                        {activeRun.currentEncounter &&
                          activeRun.phase !== "victory_rewards" &&
                          activeRun.phase !== "defeat" && (
                            <>
                              <div
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] ${
                                  dangerClasses[activeRun.currentEncounter.danger] ??
                                  dangerClasses.medium
                                }`}
                              >
                                {activeRun.phase === "boss" ? (
                                  <Crown className="h-3.5 w-3.5" />
                                ) : (
                                  <Zap className="h-3.5 w-3.5" />
                                )}
                                {activeRun.phase === "boss"
                                  ? "Boss-Kollision"
                                  : activeRun.currentEncounter.nodeType === "event"
                                    ? "Kosmischer Moment"
                                    : "Aktuelle Station"}
                              </div>
                              <h4 className="mt-4 text-xl font-black uppercase tracking-[0.14em] text-cosmic-text">
                                {activeRun.currentEncounter.title}
                              </h4>
                              <p className="mt-3 text-sm leading-relaxed text-cosmic-text-muted">
                                {activeRun.currentEncounter.description}
                              </p>
                              {activeRun.currentEncounter.rewardHint && (
                                <div className="mt-4 rounded-[1.25rem] border border-fuchsia-300/20 bg-fuchsia-400/10 px-4 py-3 text-xs leading-relaxed text-fuchsia-100">
                                  {activeRun.currentEncounter.rewardHint}
                                </div>
                              )}
                              <div className="mt-5 grid gap-3">
                                {activeRun.currentEncounter.choices.map((choice) => (
                                  <ChoiceCard
                                    key={choice.id}
                                    choice={choice}
                                    onClick={() => onChooseEncounter(choice.id)}
                                  />
                                ))}
                              </div>
                              {activeRun.phase === "node" &&
                                activeRun.stats.rerolls > 0 &&
                                activeRun.currentEncounter.nodeType === "boon" && (
                                  <button
                                    onClick={onRerollEncounter}
                                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-500/15"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Angebote rerollen ({activeRun.stats.rerolls})
                                  </button>
                                )}
                            </>
                          )}

                        {activeRun.phase === "victory_rewards" && activeRun.rewardPackage && (
                          <RewardPanel
                            mode="victory"
                            rewardLabel={activeRun.rewardPackage.rewardLabel}
                            shards={activeRun.rewardPackage.shards}
                            glitterDust={activeRun.rewardPackage.glitterDust}
                            rewardPackage={activeRun.rewardPackage}
                            selectedRelicId={selectedRelicId}
                            onSelectRelic={setSelectedRelicId}
                            onClaim={() => onClaimVictory(selectedRelicId)}
                          />
                        )}

                        {activeRun.phase === "defeat" && defeatPreview && (
                          <RewardPanel
                            mode="defeat"
                            rewardLabel={defeatPreview.rewardLabel}
                            shards={defeatPreview.shards}
                            glitterDust={defeatPreview.glitterDust}
                            onClaim={onClaimDefeat}
                          />
                        )}
                      </>
                    )}
                  </FramePanel>
                </div>

                <div className="space-y-6">
                  <FramePanel className="p-5 sm:p-6" variant="station">
                    <div className="flex items-center gap-3">
                      <img
                        src={ART.logo}
                        alt="Roguelite Logo"
                        className="h-10 w-auto object-contain"
                      />
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                          Bossvorschau
                        </div>
                        <h4 className="mt-1 text-lg font-black uppercase tracking-[0.14em] text-cosmic-text">
                          {activeRun.boss.bossId.replaceAll("_", " ")}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[1.5rem] border border-rose-300/20 bg-rose-400/10 p-4">
                      <img
                        src={ART.bossComet}
                        alt="Bossvorschau Komet"
                        className="mx-auto mb-4 h-40 w-auto object-contain"
                      />
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-rose-100">
                        <Shield className="h-4 w-4" />
                        Mutationen
                      </div>
                      <div className="mt-3 grid gap-2">
                        {bossMutations.map((mutation) => (
                          <div
                            key={mutation?.id}
                            className="rounded-[1.1rem] border border-white/10 bg-black/15 px-3 py-3"
                          >
                            <div className="text-xs font-black uppercase tracking-[0.12em] text-cosmic-text">
                              {activeRun.boss.telegraphRevealed ? mutation?.name : "Verborgen"}
                            </div>
                            <div className="mt-1 text-[11px] leading-relaxed text-cosmic-text-muted">
                              {activeRun.boss.telegraphRevealed
                                ? mutation?.description
                                : "Wird erst durch Bosswissen, Relikte oder Vorzeichen sauber lesbar."}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FramePanel>

                  <FramePanel className="p-5 sm:p-6" variant="soft">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                      Build-Form
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {groupedBoons && Object.keys(groupedBoons).length > 0 ? (
                        (Object.entries(groupedBoons) as Array<[string, number]>).map(
                          ([category, count]) => (
                            <div
                              key={category}
                              className="rounded-[1.1rem] border border-white/10 bg-black/15 px-3 py-3"
                            >
                              <div className="text-xs font-black uppercase tracking-[0.12em] text-cosmic-text">
                                {category}
                              </div>
                              <div className="mt-1 text-[11px] leading-relaxed text-cosmic-text-muted">
                                {count} Pick{count > 1 ? "s" : ""} in dieser Linie
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="rounded-[1.1rem] border border-white/10 bg-black/10 px-3 py-3 text-sm text-cosmic-text-muted">
                          Noch keine Boni im Run.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      {activeRun.boons.slice(-6).map((boon) => (
                        <div
                          key={boon.id}
                          className="rounded-[1.1rem] border border-white/10 bg-black/10 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-black uppercase tracking-[0.12em] text-cosmic-text">
                              {boon.title}
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-cosmic-accent-muted">
                              {boon.category}
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] leading-relaxed text-cosmic-text-muted">
                            {boon.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FramePanel>

                  <FramePanel className="p-5 sm:p-6" variant="soft">
                    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-cosmic-accent-muted">
                      Routenchronik
                    </div>
                    <div className="mt-4 grid gap-2">
                      {activeRun.history.length === 0 && (
                        <div className="rounded-[1.1rem] border border-white/10 bg-black/10 px-3 py-3 text-sm text-cosmic-text-muted">
                          Der Run ist noch ganz frisch.
                        </div>
                      )}
                      {activeRun.history.slice(-6).map((node) => (
                        <div
                          key={node.id}
                          className="rounded-[1.1rem] border border-white/10 bg-black/10 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-black uppercase tracking-[0.12em] text-cosmic-text">
                              {node.label}
                            </div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-cosmic-accent-muted">
                              Station {node.station}
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] leading-relaxed text-cosmic-text-muted">
                            {ROGUELITE_NODE_LABELS[node.type].description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </FramePanel>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </AnimatePresence>
    );
  },
);

RogueliteScreen.displayName = "RogueliteScreen";
