import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Compass,
  Crown,
  Gift,
  Heart,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Telescope,
  X,
  Zap,
} from "lucide-react";

import {
  ROGUELITE_ACT_BOSS_STATIONS,
  ROGUELITE_STATIONS_PER_ACT,
  ROGUELITE_TOTAL_STATIONS,
  hasRenderableRoguelitePrimaryState,
} from "../roguelite/engine";
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
  RogueliteViewState,
} from "../roguelite/types";

interface RogueliteScreenProps {
  isOpen: boolean;
  viewState: RogueliteViewState;
  meta: RogueliteMetaState;
  activeRun: ActiveRogueliteRun | null;
  onClose: () => void;
  onBeginRunSetup: () => void;
  onBackToIntro: () => void;
  onOpenArchive: () => void;
  onCloseArchive: () => void;
  onStartRun: (selectedRelicIds: string[]) => void;
  onChooseEncounter: (choiceId: string) => void;
  onChoosePath: (pathId: string) => void;
  onRerollEncounter: () => void;
  onClaimVictory: (selectedRelicId: string) => void;
  onClaimDefeat: () => void;
}

const ART = {
  backdrop: "/assets/roguelite/roguelite_background_full.png",
  particles: "/assets/roguelite/roguelite_particles_overlay.png",
  rewardChest: "/assets/roguelite/roguelite_reward_chest.png",
  bossComet: "/assets/roguelite/roguelite_boss_comet.png",
};

const dangerClasses: Record<string, string> = {
  low: "border-emerald-300/40 bg-emerald-400/12 text-emerald-50",
  medium: "border-violet-300/40 bg-violet-400/12 text-violet-50",
  high: "border-pink-300/45 bg-pink-400/12 text-pink-50",
  extreme: "border-fuchsia-300/45 bg-fuchsia-400/14 text-fuchsia-50",
};

function shellPanel(extra?: string) {
  return `rounded-[1.75rem] border border-fuchsia-100/12 bg-[rgba(26,14,42,0.88)] shadow-[0_24px_70px_rgba(19,8,34,0.46)] backdrop-blur-xl ${extra ?? ""}`;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

const primaryButtonClass =
  "rounded-[1.35rem] border border-pink-200/55 bg-[linear-gradient(135deg,rgba(255,188,227,0.98),rgba(232,188,255,0.98)_48%,rgba(185,196,255,0.98))] px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-[#341432] shadow-[0_18px_45px_rgba(243,171,221,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(243,171,221,0.35)] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass =
  "rounded-[1.1rem] border border-fuchsia-200/16 bg-[linear-gradient(180deg,rgba(255,209,239,0.08),rgba(255,255,255,0.03))] px-3.5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-pink-50 transition hover:border-pink-200/28 hover:bg-[linear-gradient(180deg,rgba(255,209,239,0.12),rgba(255,255,255,0.05))]";
const mobileTypeScale = {
  runTitle: "text-[1.3rem] sm:text-[1.55rem] lg:text-[1.85rem]",
  sectionTitle: "text-[1.05rem] sm:text-[1.2rem] lg:text-[1.45rem]",
  choiceTitle: "text-[0.82rem] sm:text-[0.9rem] lg:text-[0.96rem]",
};

function FramePanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`${shellPanel(className)} relative overflow-hidden`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,240,250,0.07),transparent_30%,rgba(245,168,255,0.08)_72%,rgba(187,168,255,0.09)_100%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[0.95rem] border border-white/8 bg-black/20 px-2.5 py-1.5">
      <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-fuchsia-100/60">
        {label}
      </div>
      <div className={`mt-1 text-[0.88rem] font-black leading-none ${accent ?? "text-slate-50"}`}>
        {value}
      </div>
    </div>
  );
}

function PreviewBlock({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-[0.85rem] border px-2 py-1.5 ${tone}`}>
      <div className="text-[9px] font-mono uppercase tracking-[0.16em]">{title}</div>
      <div className="mt-1 space-y-0.5">
        {items.slice(0, 2).map((item) => (
          <div key={item} className="text-[10px] leading-snug">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
        active
          ? "border-pink-200/45 bg-pink-300/14 text-pink-50"
          : "border-fuchsia-100/10 bg-white/5 text-fuchsia-100/55"
      }`}
    >
      {label}
    </div>
  );
}

function RelicCard({
  relicId,
  selected,
  locked,
  onClick,
}: {
  relicId: string;
  selected: boolean;
  locked: boolean;
  onClick?: () => void;
}) {
  const relic = ROGUELITE_RELICS.find((entry) => entry.id === relicId);
  if (!relic) return null;
  return (
    <button
      type="button"
      disabled={locked || !onClick}
      onClick={onClick}
      className={`rounded-[1.3rem] border p-4 text-left transition ${
        locked
          ? "cursor-default border-white/6 bg-black/20 opacity-45"
          : selected
            ? "border-pink-200/55 bg-[linear-gradient(180deg,rgba(255,192,230,0.16),rgba(216,183,255,0.12))] shadow-[0_0_30px_rgba(244,173,226,0.18)]"
            : "border-fuchsia-100/10 bg-[linear-gradient(180deg,rgba(43,24,68,0.9),rgba(25,14,41,0.96))] hover:border-pink-200/35 hover:bg-[linear-gradient(180deg,rgba(55,30,86,0.94),rgba(29,16,48,1))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-50">
            {relic.name}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-fuchsia-100/65">
            {relic.shortLabel}
          </div>
        </div>
        <div className="rounded-full border border-fuchsia-100/12 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-pink-50/85">
          {locked ? "Gesperrt" : selected ? "Ausgewaehlt" : "Bereit"}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-300">{relic.description}</p>
    </button>
  );
}

function buildDefeatPreview(run: ActiveRogueliteRun) {
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

const RewardValueCard: React.FC<{
  label: string;
  value: string;
  accent: string;
}> = ({ label, value, accent }) => (
  <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-center">
    <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">{label}</div>
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
    <FramePanel className="h-full p-5 sm:p-6">
      <div className="grid h-full gap-5 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
            {isVictory ? "Siegestruhe" : "Trosttruhe"}
          </div>
          <h4 className="mt-2 text-xl font-black uppercase tracking-[0.14em] text-slate-50">
            {rewardLabel}
          </h4>
          <img
            src={ART.rewardChest}
            alt={isVictory ? "Roguelite Siegestruhe" : "Roguelite Trosttruhe"}
            className="mx-auto mt-6 w-full max-w-[16rem] object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.4)]"
          />
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            {isVictory
              ? "Deine komplette Endbeute liegt hier offen, bevor du sie sicherst."
              : "Auch ein verlorener Lauf laesst dir noch etwas Sinnvolles da."}
          </p>
        </div>

        <div className="flex min-h-0 flex-col rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <RewardValueCard label="Splitter" value={`${shards}`} accent="text-fuchsia-200" />
            <RewardValueCard label="Glitzerstaub" value={`${glitterDust}`} accent="text-pink-200" />
          </div>

          {isVictory && rewardPackage && onSelectRelic ? (
            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-fuchsia-100/60">
                Reliktwahl
              </div>
              <div className="mt-4 grid min-h-0 flex-1 gap-3 md:grid-cols-3">
                {rewardPackage.relicChoiceIds.map((relicId) => (
                  <div key={relicId}>
                    <RelicCard
                      relicId={relicId}
                      selected={selectedRelicId === relicId}
                      locked={false}
                      onClick={() => onSelectRelic(relicId)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.2rem] border border-pink-200/20 bg-pink-300/10 px-4 py-3 text-sm leading-relaxed text-pink-100">
              Die Trosttruhe zeigt ruhig und klar, was aus diesem Run erhalten bleibt.
            </div>
          )}

          <button
            type="button"
            onClick={onClaim}
            disabled={isVictory && !selectedRelicId}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-[1.4rem] border px-4 py-4 text-sm font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isVictory
                ? "border-pink-200/55 bg-[linear-gradient(135deg,rgba(255,188,227,0.98),rgba(232,188,255,0.98)_48%,rgba(185,196,255,0.98))] text-[#341432] shadow-[0_18px_45px_rgba(243,171,221,0.28)]"
                : "border-fuchsia-200/35 bg-[linear-gradient(135deg,rgba(252,211,255,0.92),rgba(248,195,235,0.92)_52%,rgba(255,227,190,0.92))] text-[#4a2346] shadow-[0_18px_45px_rgba(243,171,221,0.18)]"
            }`}
          >
            <Gift className="h-4 w-4" />
            {isVictory ? "Belohnungen sichern" : "Trostbelohnung einsammeln"}
          </button>
        </div>
      </div>
    </FramePanel>
  );
};

const ChoiceCard: React.FC<{
  choice: RogueliteChoice;
  onClick: () => void;
}> = ({ choice, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="roguelite-choice-card"
    className="rounded-[1.05rem] border border-fuchsia-100/12 bg-[linear-gradient(180deg,rgba(67,35,93,0.95),rgba(29,17,46,0.98))] p-2.5 text-left shadow-[0_10px_20px_rgba(31,14,46,0.22)] transition hover:-translate-y-0.5 hover:border-pink-200/35 hover:bg-[linear-gradient(180deg,rgba(83,44,116,0.98),rgba(39,21,60,1))] hover:shadow-[0_14px_24px_rgba(61,27,79,0.26)]"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <div
          className={`${mobileTypeScale.choiceTitle} font-black uppercase tracking-[0.12em] text-slate-50`}
        >
          {choice.title}
        </div>
        <p className="mt-1 text-[0.78rem] leading-snug text-slate-300">{choice.description}</p>
      </div>
      <div className="rounded-full border border-fuchsia-100/12 bg-white/5 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] text-pink-50/80">
        {choice.effectLabel ?? choice.kind}
      </div>
    </div>

    {choice.preview && (
      <div className="mt-2 grid gap-1.5">
        <PreviewBlock
          title="Sofort"
          items={choice.preview.gains}
          tone="border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
        />
        <PreviewBlock
          title="Preis"
          items={choice.preview.costs}
          tone="border-amber-300/25 bg-amber-400/10 text-amber-100"
        />
        <PreviewBlock
          title="Risiko"
          items={choice.preview.risks}
          tone="border-rose-300/25 bg-rose-400/10 text-rose-100"
        />
        {(choice.preview.synergyHint || choice.preview.rewardPreview) && (
          <div className="rounded-[0.85rem] border border-white/10 bg-white/5 px-2 py-1.5">
            {choice.preview.synergyHint && (
              <div className="text-[10px] leading-snug text-pink-100">
                <span className="font-black uppercase tracking-[0.12em] text-pink-200">
                  Run-Wert:
                </span>{" "}
                {choice.preview.synergyHint}
              </div>
            )}
            {choice.preview.rewardPreview && (
              <div className="mt-1 text-[10px] leading-snug text-fuchsia-100">
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

const PathCard: React.FC<{
  pathChoice: RoguelitePathChoice;
  onClick: () => void;
}> = ({ pathChoice, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid="roguelite-path-card"
    className="rounded-[1.05rem] border border-fuchsia-100/12 bg-[linear-gradient(180deg,rgba(67,35,93,0.95),rgba(29,17,46,0.98))] p-2.5 text-left shadow-[0_10px_20px_rgba(31,14,46,0.22)] transition hover:-translate-y-0.5 hover:border-pink-200/35 hover:bg-[linear-gradient(180deg,rgba(83,44,116,0.98),rgba(39,21,60,1))]"
  >
    <div className="flex items-center justify-between gap-3">
      <div
        className={`${mobileTypeScale.choiceTitle} font-black uppercase tracking-[0.12em] text-slate-50`}
      >
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
    <p className="mt-1.5 text-[0.78rem] leading-snug text-slate-300">
      {pathChoice.node.description}
    </p>
    <div className="mt-2 grid gap-1.5">
      <div className="rounded-[0.85rem] border border-pink-200/20 bg-pink-300/10 px-2 py-1.5 text-[10px] text-pink-100">
        <span className="font-black uppercase tracking-[0.12em] text-pink-200">Reward:</span>{" "}
        {pathChoice.rewardPreview}
      </div>
      <div className="rounded-[0.85rem] border border-rose-300/20 bg-rose-400/10 px-2 py-1.5 text-[10px] text-rose-100">
        <span className="font-black uppercase tracking-[0.12em] text-rose-200">Risiko:</span>{" "}
        {pathChoice.riskPreview}
      </div>
      <div className="rounded-[0.85rem] border border-violet-200/20 bg-violet-300/10 px-2 py-1.5 text-[10px] text-violet-100">
        <span className="font-black uppercase tracking-[0.12em] text-violet-200">Run-Wert:</span>{" "}
        {pathChoice.routeHint}
      </div>
    </div>
  </button>
);

function IntroView({
  meta,
  onBeginRunSetup,
}: {
  meta: RogueliteMetaState;
  onBeginRunSetup: () => void;
}) {
  return (
    <FramePanel className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center p-6 sm:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-pink-100/65">
          Dunkler Roguelite Lauf
        </div>
        <h2 className="mt-4 text-3xl font-black uppercase tracking-[0.14em] text-slate-50 sm:text-5xl">
          30 Stationen. 3 Akte. Ein neuer Build pro Run.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          Du startest mit drei Relikten, kaempfst dich durch drei Akte und triffst in jeder Station
          klare Entscheidungen. Der aktive Run bekommt die ganze Buehne, nicht mehr das Drumherum.
        </p>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-4xl gap-4 lg:grid-cols-3">
        <StatChip
          label="Hoechste Station"
          value={`${meta.highestStation}/${ROGUELITE_TOTAL_STATIONS}`}
          accent="text-pink-200"
        />
        <StatChip label="Siege" value={`${meta.wins}`} accent="text-emerald-200" />
        <StatChip
          label="Freigeschaltete Relikte"
          value={`${meta.unlockedRelics.length}`}
          accent="text-violet-200"
        />
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-4xl gap-4 lg:grid-cols-3">
        <div className="rounded-[1.3rem] border border-pink-200/12 bg-[linear-gradient(180deg,rgba(255,192,230,0.08),rgba(255,255,255,0.03))] p-4 text-sm leading-relaxed text-slate-200">
          Akt 1 bringt dich in den Run und laesst dich die ersten Linien formen.
        </div>
        <div className="rounded-[1.3rem] border border-fuchsia-200/12 bg-[linear-gradient(180deg,rgba(240,190,255,0.08),rgba(255,255,255,0.03))] p-4 text-sm leading-relaxed text-slate-200">
          Akt 2 macht die Routen schaerfer und stellt deinen Build an die erste Wand.
        </div>
        <div className="rounded-[1.3rem] border border-violet-200/12 bg-[linear-gradient(180deg,rgba(205,191,255,0.08),rgba(255,255,255,0.03))] p-4 text-sm leading-relaxed text-slate-200">
          Akt 3 ist nur noch Druck, Synergie und die finale Kollision.
        </div>
      </div>

      <button
        type="button"
        onClick={onBeginRunSetup}
        className={`mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-2 ${primaryButtonClass}`}
      >
        <Swords className="h-4 w-4" />
        Start
      </button>
    </FramePanel>
  );
}

function RelicSelectView({
  meta,
  selectedRelicIds,
  onToggleRelic,
  onBackToIntro,
  onOpenArchive,
  onStartRun,
}: {
  meta: RogueliteMetaState;
  selectedRelicIds: string[];
  onToggleRelic: (relicId: string) => void;
  onBackToIntro: () => void;
  onOpenArchive: () => void;
  onStartRun: () => void;
}) {
  const maxSelectableRelics = Math.min(3, meta.unlockedRelics.length);
  const canStartRun = selectedRelicIds.length > 0 && selectedRelicIds.length <= maxSelectableRelics;
  return (
    <FramePanel className="mx-auto flex h-full w-full max-w-6xl flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-pink-100/65">
            Reliktwahl
          </div>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.14em] text-slate-50">
            Waehle bis zu 3 Start-Relikte
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Deine freigeschalteten Relikte praegen den ganzen Lauf von der ersten Station an.
          </p>
        </div>
        <div className="rounded-full border border-pink-200/25 bg-pink-300/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-pink-100">
          {selectedRelicIds.length}/3 gesetzt
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {selectedRelicIds.map((relicId, index) => (
          <div
            key={`${relicId}_${index}`}
            className="rounded-[1.2rem] border border-pink-200/25 bg-[linear-gradient(180deg,rgba(255,192,230,0.14),rgba(222,184,255,0.09))] px-4 py-3"
          >
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-pink-200">
              Slot {index + 1}
            </div>
            <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-slate-50">
              {ROGUELITE_RELICS.find((relic) => relic.id === relicId)?.name ?? relicId}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid min-h-0 flex-1 gap-3 overflow-hidden md:grid-cols-3">
        {meta.unlockedRelics.map((relicId) => (
          <div key={relicId}>
            <RelicCard
              relicId={relicId}
              selected={selectedRelicIds.includes(relicId)}
              locked={false}
              onClick={() => onToggleRelic(relicId)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={onBackToIntro} className={secondaryButtonClass}>
            Zurueck
          </button>
          <button
            type="button"
            onClick={onOpenArchive}
            className={`flex items-center gap-2 ${secondaryButtonClass}`}
          >
            <BookOpen className="h-4 w-4" />
            Archiv
          </button>
        </div>

        <button
          type="button"
          onClick={onStartRun}
          disabled={!canStartRun}
          className={primaryButtonClass}
        >
          Run starten
        </button>
      </div>
    </FramePanel>
  );
}

function ArchiveView({
  meta,
  onCloseArchive,
}: {
  meta: RogueliteMetaState;
  onCloseArchive: () => void;
}) {
  const unlocked = new Set(meta.unlockedRelics);
  return (
    <FramePanel className="mx-auto flex h-full w-full max-w-6xl flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-pink-100/65">
            Reliktarchiv
          </div>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.14em] text-slate-50">
            Sammlung und spaetere Wachstumshooks
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Hier kann der Modus spaeter weiterwachsen: Sets, Synergien, seltene Relikte und neue
            Startklassen haben schon ihren Platz.
          </p>
        </div>
        <button type="button" onClick={onCloseArchive} className={secondaryButtonClass}>
          Zur Reliktwahl
        </button>
      </div>

      <div className="mt-5 grid min-h-0 flex-1 gap-3 overflow-hidden md:grid-cols-3">
        {ROGUELITE_RELICS.map((relic) => (
          <div key={relic.id}>
            <RelicCard relicId={relic.id} selected={false} locked={!unlocked.has(relic.id)} />
          </div>
        ))}
      </div>
    </FramePanel>
  );
}

function RunInfoPanel({
  activeRun,
  mode,
  onClose,
  panelId,
}: {
  activeRun: ActiveRogueliteRun;
  mode: "desktop" | "mobile";
  onClose?: () => void;
  panelId: string;
}) {
  const bossMutations = activeRun.boss.mutationIds
    .map((id) => ROGUELITE_BOSS_MUTATIONS.find((mutation) => mutation.id === id))
    .filter(Boolean);
  const groupedBoons = activeRun.boons.reduce((acc: Record<string, number>, boon) => {
    acc[boon.category] = (acc[boon.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <FramePanel
      className={`flex h-full flex-col p-3 ${
        mode === "mobile"
          ? "w-full max-w-[20rem] rounded-l-[1.5rem] rounded-r-none border-r-0 bg-[rgba(22,12,36,0.98)] shadow-[0_24px_80px_rgba(7,4,16,0.72)]"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-pink-100/65">
            Run-Details
          </div>
          <div className="mt-1 text-[0.82rem] font-black uppercase tracking-[0.12em] text-slate-50 sm:text-[0.92rem]">
            Bossblick, Build und History
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-100/14 bg-black/20 transition hover:border-pink-200/35 hover:bg-pink-300/10"
            aria-label="Info-Panel schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        id={panelId}
        data-testid="roguelite-run-info-panel"
        className="mt-2.5 flex-1 space-y-2.5 overflow-y-auto pr-1"
      >
        <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-3">
            <img src={ART.bossComet} alt="Boss-Komet" className="h-11 w-11 object-contain" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                Bossblick
              </div>
              <div className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-slate-50">
                {activeRun.boss.bossId.replaceAll("_", " ")}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {bossMutations.map((mutation) => (
              <div
                key={mutation?.id}
                className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-50">
                  {activeRun.boss.telegraphRevealed ? mutation?.name : "Verborgen"}
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
                  {activeRun.boss.telegraphRevealed
                    ? mutation?.description
                    : "Noch nicht klar lesbar, aber definitiv relevant fuer die Endphase."}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
            Buildform
          </div>
          <div className="mt-3 grid gap-2">
            {Object.keys(groupedBoons).length > 0 ? (
              Object.entries(groupedBoons).map(([category, count]) => (
                <div
                  key={category}
                  className="rounded-[0.95rem] border border-white/10 bg-black/20 px-2.5 py-2"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-50">
                    {category}
                  </div>
                  <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    {count} Pick{count > 1 ? "s" : ""} in dieser Linie
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[0.95rem] border border-white/10 bg-black/20 px-2.5 py-2 text-[11px] text-slate-300">
                Noch keine Boni im Run.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1rem] border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
            Letzte Stationen
          </div>
          <div className="mt-3 grid gap-2">
            {activeRun.history.length === 0 ? (
              <div className="rounded-[0.95rem] border border-white/10 bg-black/20 px-2.5 py-2 text-[11px] text-slate-300">
                Der Run ist noch ganz frisch.
              </div>
            ) : (
              activeRun.history.slice(-4).map((node) => (
                <div
                  key={node.id}
                  className="rounded-[0.95rem] border border-white/10 bg-black/20 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-50">
                      {node.label}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-slate-400">
                      {node.station}
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] leading-relaxed text-slate-300">
                    {ROGUELITE_NODE_LABELS[node.type].description}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </FramePanel>
  );
}

function resolveRunPrimaryContent(
  activeRun: ActiveRogueliteRun,
): "victory" | "defeat" | "path" | "encounter" | "recovery" {
  if (activeRun.phase === "victory_rewards" && activeRun.rewardPackage) return "victory";
  if (activeRun.phase === "defeat") return "defeat";
  if (activeRun.phase === "path" && activeRun.pathChoices.length > 0) return "path";
  if (
    (activeRun.phase === "node" || activeRun.phase === "event" || activeRun.phase === "boss") &&
    activeRun.currentEncounter
  ) {
    return "encounter";
  }
  return "recovery";
}

function RunView({
  activeRun,
  selectedRelicId,
  setSelectedRelicId,
  isInfoPanelOpen,
  onToggleInfoPanel,
  onCloseInfoPanel,
  onChooseEncounter,
  onChoosePath,
  onRerollEncounter,
  onClaimVictory,
  onClaimDefeat,
}: {
  activeRun: ActiveRogueliteRun;
  selectedRelicId: string;
  setSelectedRelicId: (relicId: string) => void;
  isInfoPanelOpen: boolean;
  onToggleInfoPanel: () => void;
  onCloseInfoPanel: () => void;
  onChooseEncounter: (choiceId: string) => void;
  onChoosePath: (pathId: string) => void;
  onRerollEncounter: () => void;
  onClaimVictory: (selectedRelicId: string) => void;
  onClaimDefeat: () => void;
}) {
  const defeatPreview = activeRun.phase === "defeat" ? buildDefeatPreview(activeRun) : null;
  const primaryContent = resolveRunPrimaryContent(activeRun);
  const isDesktopViewport = useMediaQuery("(min-width: 1024px)");
  const currentStation = Math.min(
    ROGUELITE_TOTAL_STATIONS,
    activeRun.completedStations + (activeRun.phase === "path" ? 1 : 0),
  );
  const isBossPhase = activeRun.phase === "boss";
  const showInfoPanelToggle = primaryContent !== "victory" && primaryContent !== "defeat";
  const bossStageLabel =
    activeRun.boss.stage === "act_1"
      ? "Akt 1 Boss"
      : activeRun.boss.stage === "act_2"
        ? "Akt 2 Boss"
        : "Finale";
  const runChoiceGridClass =
    isDesktopViewport && !isInfoPanelOpen ? "xl:grid-cols-3" : "lg:grid-cols-2";

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2.5">
      <FramePanel className="p-3">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-slate-400">
              Akt {activeRun.currentAct} von 3
            </div>
            <h3
              className={`mt-1.5 ${mobileTypeScale.runTitle} font-black uppercase tracking-[0.14em] text-slate-50`}
            >
              Station {currentStation} / {ROGUELITE_TOTAL_STATIONS}
            </h3>
            <p className="mt-1 max-w-4xl text-[0.82rem] leading-snug text-slate-300 sm:text-[0.88rem]">
              {activeRun.runArchetype.description} {activeRun.runArchetype.playstyle}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showInfoPanelToggle && (
              <button
                type="button"
                onClick={onToggleInfoPanel}
                aria-expanded={isInfoPanelOpen}
                aria-controls="roguelite-run-info-panel"
                aria-label={isInfoPanelOpen ? "Run-Details schliessen" : "Run-Details oeffnen"}
                data-testid="roguelite-drawer-toggle"
                className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] ${secondaryButtonClass}`}
              >
                {isInfoPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
                Details
              </button>
            )}
            <div className="rounded-full border border-pink-200/25 bg-pink-300/10 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.16em] text-pink-100">
              {isBossPhase ? bossStageLabel : `${ROGUELITE_STATIONS_PER_ACT}er Aktbogen`}
            </div>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-8">
          <StatChip
            label="Run-Leben"
            value={`${Math.round(activeRun.stats.runLife)} / ${Math.round(activeRun.stats.maxLife)}`}
            accent="text-rose-200"
          />
          <StatChip
            label="Schild"
            value={`${Math.round(activeRun.stats.runShield)}`}
            accent="text-violet-200"
          />
          <StatChip
            label="Klicks"
            value={`${Math.round(activeRun.stats.runClicks)}`}
            accent="text-pink-200"
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
            accent="text-fuchsia-200"
          />
          <StatChip
            label="Kristallstaub"
            value={`${Math.round(activeRun.stats.crystalDust)}`}
            accent="text-indigo-200"
          />
        </div>
      </FramePanel>

      <div className="relative flex min-h-0 flex-1 gap-2.5">
        <div data-testid="roguelite-primary-content" className="min-w-0 flex-1">
          <div className="min-h-0 h-full">
            {primaryContent === "victory" && activeRun.rewardPackage ? (
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
            ) : primaryContent === "defeat" && defeatPreview ? (
              <RewardPanel
                mode="defeat"
                rewardLabel={defeatPreview.rewardLabel}
                shards={defeatPreview.shards}
                glitterDust={defeatPreview.glitterDust}
                onClaim={onClaimDefeat}
              />
            ) : (
              <FramePanel className="h-full overflow-hidden p-3 sm:p-3.5">
                {primaryContent === "path" ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/25 bg-pink-300/10 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] text-pink-100">
                      <Compass className="h-3.5 w-3.5" />
                      Weggabelung
                    </div>
                    <h4
                      className={`mt-3 ${mobileTypeScale.sectionTitle} font-black uppercase tracking-[0.14em] text-slate-50`}
                    >
                      Die Route ist jetzt die Hauptsache
                    </h4>
                    <p className="mt-1.5 max-w-4xl text-[0.82rem] leading-snug text-slate-300 sm:text-[0.86rem]">
                      Nimm die Linie, die nicht nur jetzt gut aussieht, sondern den restlichen Akt
                      wirklich traegt.
                    </p>
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                      <div
                        data-testid="roguelite-path-grid"
                        className="grid gap-2.5 lg:grid-cols-2"
                      >
                        {activeRun.pathChoices.map((pathChoice) => (
                          <PathCard
                            key={pathChoice.id}
                            pathChoice={pathChoice}
                            onClick={() => onChoosePath(pathChoice.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : primaryContent === "encounter" && activeRun.currentEncounter ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] ${
                        dangerClasses[activeRun.currentEncounter.danger] ?? dangerClasses.medium
                      }`}
                    >
                      {isBossPhase ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      {isBossPhase
                        ? bossStageLabel
                        : activeRun.currentEncounter.nodeType === "event"
                          ? "Kosmischer Moment"
                          : "Aktuelle Station"}
                    </div>
                    <h4
                      className={`mt-3 ${mobileTypeScale.sectionTitle} font-black uppercase tracking-[0.14em] text-slate-50`}
                    >
                      {activeRun.currentEncounter.title}
                    </h4>
                    <p className="mt-1.5 max-w-4xl text-[0.82rem] leading-snug text-slate-300 sm:text-[0.86rem]">
                      {activeRun.currentEncounter.description}
                    </p>
                    {activeRun.currentEncounter.rewardHint && (
                      <div className="mt-2.5 rounded-[0.95rem] border border-pink-200/20 bg-pink-300/10 px-3 py-2 text-[11px] leading-snug text-pink-100">
                        {activeRun.currentEncounter.rewardHint}
                      </div>
                    )}
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                      <div
                        data-testid="roguelite-choice-grid"
                        className={`grid gap-2.5 ${runChoiceGridClass}`}
                      >
                        {activeRun.currentEncounter.choices.map((choice) => (
                          <ChoiceCard
                            key={choice.id}
                            choice={choice}
                            onClick={() => onChooseEncounter(choice.id)}
                          />
                        ))}
                      </div>
                    </div>
                    {activeRun.phase === "node" &&
                      activeRun.stats.rerolls > 0 &&
                      activeRun.currentEncounter.nodeType === "boon" && (
                        <button
                          type="button"
                          onClick={onRerollEncounter}
                          className={`mt-2.5 inline-flex items-center gap-2 self-start px-3 py-2 text-[10px] ${secondaryButtonClass}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Angebote rerollen ({activeRun.stats.rerolls})
                        </button>
                      )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-[1.6rem] border border-fuchsia-100/12 bg-[linear-gradient(180deg,rgba(255,192,230,0.08),rgba(205,191,255,0.06))] px-6 py-8 text-center">
                    <Sparkles className="h-8 w-8 text-pink-200" />
                    <h4 className="mt-4 text-xl font-black uppercase tracking-[0.14em] text-slate-50">
                      Run wird vorbereitet
                    </h4>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                      Der Lauf ist aktiv, aber der erste Entscheidungsblock ist noch nicht sauber
                      angekommen. Statt leer zu bleiben, zeigt der Screen dir jetzt diesen
                      Recovery-Zustand.
                    </p>
                    <div className="mt-4 rounded-[1rem] border border-pink-200/20 bg-pink-300/10 px-4 py-3 text-xs leading-relaxed text-pink-100">
                      Phase: {activeRun.phase} • Encounter:{" "}
                      {activeRun.currentEncounter ? "ja" : "nein"} • Pfade:{" "}
                      {activeRun.pathChoices.length}
                    </div>
                  </div>
                )}
              </FramePanel>
            )}
          </div>
        </div>

        {primaryContent !== "victory" && primaryContent !== "defeat" && (
          <>
            {isDesktopViewport && isInfoPanelOpen && (
              <aside className="hidden h-full w-[19rem] shrink-0 lg:block">
                <RunInfoPanel
                  activeRun={activeRun}
                  mode="desktop"
                  panelId="roguelite-run-info-panel"
                />
              </aside>
            )}

            <AnimatePresence>
              {isInfoPanelOpen && !isDesktopViewport && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-20 flex justify-end bg-[rgba(10,6,20,0.76)] lg:hidden"
                  onClick={onCloseInfoPanel}
                >
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 24, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex h-full w-[min(82vw,20rem)] shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <RunInfoPanel
                      activeRun={activeRun}
                      mode="mobile"
                      onClose={onCloseInfoPanel}
                      panelId="roguelite-run-info-panel"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export const RogueliteScreen: React.FC<RogueliteScreenProps> = React.memo(
  ({
    isOpen,
    viewState,
    meta,
    activeRun,
    onClose,
    onBeginRunSetup,
    onBackToIntro,
    onOpenArchive,
    onCloseArchive,
    onStartRun,
    onChooseEncounter,
    onChoosePath,
    onRerollEncounter,
    onClaimVictory,
    onClaimDefeat,
  }) => {
    const [selectedRelicId, setSelectedRelicId] = React.useState("");
    const [selectedRelicIds, setSelectedRelicIds] = React.useState<string[]>([]);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = React.useState(false);

    React.useEffect(() => {
      if (activeRun?.rewardPackage) {
        setSelectedRelicId(activeRun.rewardPackage.relicChoiceIds[0] ?? "");
      } else {
        setSelectedRelicId("");
      }
    }, [activeRun?.rewardPackage]);

    React.useEffect(() => {
      if (viewState !== "relic_select") return;
      setSelectedRelicIds((prev) => {
        const unlocked = meta.unlockedRelics.slice(0, 3);
        if (
          prev.length > 0 &&
          prev.length <= 3 &&
          prev.every((id) => meta.unlockedRelics.includes(id))
        ) {
          return prev;
        }
        return unlocked;
      });
    }, [meta.unlockedRelics, viewState]);

    React.useEffect(() => {
      if (!activeRun) {
        setIsInfoPanelOpen(false);
        return;
      }

      const primaryContent = resolveRunPrimaryContent(activeRun);
      if (primaryContent === "victory" || primaryContent === "defeat") {
        setIsInfoPanelOpen(false);
      }
    }, [activeRun]);

    const toggleRelic = React.useCallback(
      (relicId: string) => {
        setSelectedRelicIds((prev) => {
          if (prev.includes(relicId)) {
            return prev.filter((id) => id !== relicId);
          }
          if (prev.length >= 3) {
            return [...prev.slice(1), relicId];
          }
          return [...prev, relicId];
        });
      },
      [setSelectedRelicIds],
    );

    if (!isOpen) return null;
    const resolvedViewState = activeRun ? "run" : viewState;

    return (
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] overflow-y-auto text-slate-50 md:overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(18,8,30,0.9), rgba(14,8,28,0.96)), url(${ART.particles}), url(${ART.backdrop})`,
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center, center",
          }}
        >
          <div className="flex min-h-screen flex-col px-2 py-2 md:h-screen md:min-h-0 md:px-3 md:py-3">
            <div
              className={`${shellPanel("flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-4")} shrink-0`}
            >
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-pink-100/65">
                  Roguelite Modus
                </div>
                <h2 className="mt-1 text-lg font-black uppercase tracking-[0.14em] text-slate-50 sm:text-xl">
                  Dunkler Lauf
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StepPill active={resolvedViewState === "intro"} label="Intro" />
                  <StepPill active={resolvedViewState === "relic_select"} label="Relikte" />
                  <StepPill active={resolvedViewState === "archive"} label="Archiv" />
                  <StepPill active={resolvedViewState === "run"} label="Run" />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-100/14 bg-black/20 transition hover:border-pink-200/35 hover:bg-pink-300/10"
                title="Roguelite schliessen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2 flex w-full min-h-0 flex-1">
              {resolvedViewState === "intro" && (
                <IntroView meta={meta} onBeginRunSetup={onBeginRunSetup} />
              )}
              {resolvedViewState === "relic_select" && !activeRun && (
                <RelicSelectView
                  meta={meta}
                  selectedRelicIds={selectedRelicIds}
                  onToggleRelic={toggleRelic}
                  onBackToIntro={onBackToIntro}
                  onOpenArchive={onOpenArchive}
                  onStartRun={() => onStartRun(selectedRelicIds)}
                />
              )}
              {resolvedViewState === "archive" && !activeRun && (
                <ArchiveView meta={meta} onCloseArchive={onCloseArchive} />
              )}
              {resolvedViewState === "run" && !activeRun && (
                <FramePanel className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center p-8 text-center">
                  <Sparkles className="h-8 w-8 text-pink-200" />
                  <h3 className="mt-4 text-2xl font-black uppercase tracking-[0.14em] text-slate-50">
                    Run wird vorbereitet
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                    Der Wechsel in den Lauf wurde schon ausgelost, aber der erste sichtbare
                    Entscheidungsblock ist noch nicht angekommen. Statt einer leeren Flaeche bleibt
                    der Modus jetzt in einem sichtbaren Zwischenzustand.
                  </p>
                </FramePanel>
              )}
              {resolvedViewState === "run" && activeRun && (
                <RunView
                  activeRun={activeRun}
                  selectedRelicId={selectedRelicId}
                  setSelectedRelicId={setSelectedRelicId}
                  isInfoPanelOpen={isInfoPanelOpen}
                  onToggleInfoPanel={() => setIsInfoPanelOpen((prev) => !prev)}
                  onCloseInfoPanel={() => setIsInfoPanelOpen(false)}
                  onChooseEncounter={onChooseEncounter}
                  onChoosePath={onChoosePath}
                  onRerollEncounter={onRerollEncounter}
                  onClaimVictory={onClaimVictory}
                  onClaimDefeat={onClaimDefeat}
                />
              )}
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    );
  },
);

RogueliteScreen.displayName = "RogueliteScreen";
