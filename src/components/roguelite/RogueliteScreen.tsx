import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleHelp, Sparkles, X } from "lucide-react";

import type {
  ActiveRogueliteRun,
  RogueliteMetaState,
  RogueliteViewState,
} from "../../roguelite/types";
import { Archive } from "./Archive";
import { HelpLegend } from "./HelpLegend";
import { IntroHub } from "./IntroHub";
import { RelicDraft } from "./RelicDraft";
import { RunView } from "./RunView";
import { Eyebrow, Panel, cx } from "./theme";

export interface RogueliteScreenProps {
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
  backdrop: "/assets/roguelite/roguelite_background_full.webp",
  particles: "/assets/roguelite/roguelite_particles_overlay.webp",
};

const STEPS: { key: RogueliteViewState | "run"; label: string }[] = [
  { key: "intro", label: "Intro" },
  { key: "relic_select", label: "Relikte" },
  { key: "archive", label: "Archiv" },
  { key: "run", label: "Run" },
];

const StepPill: React.FC<{ active: boolean; label: string }> = ({ active, label }) => {
  return (
    <div
      className={cx(
        "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition",
        active
          ? "border-cosmic-accent/45 bg-cosmic-accent/12 text-cosmic-accent"
          : "border-white/8 bg-white/4 text-cosmic-accent-muted/60",
      )}
    >
      {label}
    </div>
  );
};

function PreparingPanel() {
  return (
    <Panel className="mx-auto flex size-full  max-w-3xl flex-col items-center justify-center p-8 text-center">
      <div className="flex size-14  items-center justify-center rounded-2xl border border-cosmic-accent/30 bg-cosmic-accent/10">
        <Sparkles className="size-6  text-cosmic-accent" />
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-[0.01em] text-cosmic-text">
        Run wird vorbereitet
      </h3>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-cosmic-text-muted">
        Der Wechsel in den Lauf wurde ausgelöst, aber der erste Entscheidungsblock ist noch nicht
        angekommen.
      </p>
    </Panel>
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
    const [selectedRelicIds, setSelectedRelicIds] = React.useState<string[]>([]);
    const [showHelp, setShowHelp] = React.useState(false);

    React.useEffect(() => {
      if (viewState !== "relic_select") return;
      setSelectedRelicIds((prev) => {
        if (
          prev.length > 0 &&
          prev.length <= 3 &&
          prev.every((id) => meta.unlockedRelics.includes(id))
        ) {
          return prev;
        }
        return meta.unlockedRelics.slice(0, 3);
      });
    }, [meta.unlockedRelics, viewState]);

    const toggleRelic = React.useCallback((relicId: string) => {
      setSelectedRelicIds((prev) => {
        if (prev.includes(relicId)) return prev.filter((id) => id !== relicId);
        if (prev.length >= 3) return [...prev.slice(1), relicId];
        return [...prev, relicId];
      });
    }, []);

    if (!isOpen) return null;
    const resolvedViewState: RogueliteViewState | "run" = activeRun ? "run" : viewState;

    return (
      <AnimatePresence>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-120 min-h-dvh overflow-y-auto text-cosmic-text md:overflow-hidden"
          style={{
            backgroundColor: "#0c0a1c",
            backgroundImage: `radial-gradient(circle at 50% -8%, rgba(202,165,254,0.14), transparent 58%), linear-gradient(180deg, rgba(16,13,35,0.92), rgba(12,10,28,0.97)), url(${ART.particles}), url(${ART.backdrop})`,
            backgroundSize: "cover, cover, cover, cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex min-h-dvh flex-col gap-2.5 p-2.5  md:h-dvh md:min-h-0 md:p-3.5 ">
            {/* Shell header */}
            <Panel className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Eyebrow>Galaxie-Roguelite</Eyebrow>
                <h2 className="mt-0.5 text-lg font-black tracking-[0.01em] text-cosmic-text sm:text-xl">
                  Reise durch den Kosmos
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-1.5 sm:flex">
                  {STEPS.map((step) => (
                    <StepPill
                      key={step.key}
                      active={resolvedViewState === step.key}
                      label={step.label}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  title="Hilfe & Legende"
                  aria-label="Hilfe öffnen"
                  data-testid="roguelite-help-button"
                  className="flex size-10  items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-cosmic-text-muted transition hover:border-cosmic-accent/40 hover:text-cosmic-text"
                >
                  <CircleHelp className="size-5 " />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Roguelite schliessen"
                  aria-label="Roguelite schliessen"
                  className="flex size-10  items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-cosmic-text-muted transition hover:border-cosmic-accent/40 hover:text-cosmic-text"
                >
                  <X className="size-5 " />
                </button>
              </div>
            </Panel>

            {/* Content */}
            <div className="flex min-h-0 w-full flex-1">
              {resolvedViewState === "intro" && (
                <IntroHub meta={meta} onBeginRunSetup={onBeginRunSetup} />
              )}
              {resolvedViewState === "relic_select" && !activeRun && (
                <RelicDraft
                  meta={meta}
                  selectedRelicIds={selectedRelicIds}
                  onToggleRelic={toggleRelic}
                  onBackToIntro={onBackToIntro}
                  onOpenArchive={onOpenArchive}
                  onStartRun={() => onStartRun(selectedRelicIds)}
                />
              )}
              {resolvedViewState === "archive" && !activeRun && (
                <Archive meta={meta} onCloseArchive={onCloseArchive} />
              )}
              {resolvedViewState === "run" && !activeRun && <PreparingPanel />}
              {resolvedViewState === "run" && activeRun && (
                <RunView
                  activeRun={activeRun}
                  onChooseEncounter={onChooseEncounter}
                  onChoosePath={onChoosePath}
                  onRerollEncounter={onRerollEncounter}
                  onClaimVictory={onClaimVictory}
                  onClaimDefeat={onClaimDefeat}
                />
              )}
            </div>
          </div>

          <HelpLegend isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </motion.section>
      </AnimatePresence>
    );
  },
);

RogueliteScreen.displayName = "RogueliteScreen";
