import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { PanelRightClose, PanelRightOpen, Target } from "lucide-react";

import { ROGUELITE_TOTAL_STATIONS } from "../../roguelite/engine";
import type { ActiveRogueliteRun } from "../../roguelite/types";
import { BuildPanel } from "./BuildPanel";
import { Coach, COACH_RING, COACH_STEPS, useCoachSeen, type CoachTarget } from "./Coach";
import { EncounterStage } from "./EncounterStage";
import { Results, buildDefeatPreview } from "./Results";
import { SurvivalStrip } from "./Vitals";
import { VoyageTrack } from "./VoyageTrack";
import { Eyebrow, Panel, cx, useMediaQuery } from "./theme";

const INFO_PANEL_ID = "roguelite-run-info-panel";

export type RunPrimaryContent = "victory" | "defeat" | "path" | "encounter" | "recovery";

export function resolveRunPrimaryContent(run: ActiveRogueliteRun): RunPrimaryContent {
  if (run.phase === "victory_rewards" && run.rewardPackage) return "victory";
  if (run.phase === "defeat") return "defeat";
  if (run.phase === "path" && run.pathChoices.length > 0) return "path";
  if (
    (run.phase === "node" || run.phase === "event" || run.phase === "boss") &&
    run.currentEncounter
  ) {
    return "encounter";
  }
  return "recovery";
}

export const RunView: React.FC<{
  activeRun: ActiveRogueliteRun;
  onChooseEncounter: (choiceId: string) => void;
  onChoosePath: (pathId: string) => void;
  onRerollEncounter: () => void;
  onClaimVictory: (selectedRelicId: string) => void;
  onClaimDefeat: () => void;
}> = ({
  activeRun,
  onChooseEncounter,
  onChoosePath,
  onRerollEncounter,
  onClaimVictory,
  onClaimDefeat,
}) => {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [isInfoOpen, setIsInfoOpen] = React.useState(isWide);
  const [selectedRewardRelicId, setSelectedRewardRelicId] = React.useState("");

  const [coachSeen, markCoachSeen] = useCoachSeen();
  const [coachStep, setCoachStep] = React.useState(0);

  const primaryContent = resolveRunPrimaryContent(activeRun);
  const isResult = primaryContent === "victory" || primaryContent === "defeat";

  React.useEffect(() => {
    setSelectedRewardRelicId(activeRun.rewardPackage?.relicChoiceIds[0] ?? "");
  }, [activeRun.rewardPackage]);

  React.useEffect(() => {
    if (isResult) setIsInfoOpen(false);
  }, [isResult]);

  // Result screens get the whole stage.
  if (primaryContent === "victory" && activeRun.rewardPackage) {
    return (
      <Results
        mode="victory"
        activeRun={activeRun}
        rewardLabel={activeRun.rewardPackage.rewardLabel}
        shards={activeRun.rewardPackage.shards}
        glitterDust={activeRun.rewardPackage.glitterDust}
        rewardPackage={activeRun.rewardPackage}
        selectedRelicId={selectedRewardRelicId}
        onSelectRelic={setSelectedRewardRelicId}
        onClaim={() => onClaimVictory(selectedRewardRelicId)}
      />
    );
  }
  if (primaryContent === "defeat") {
    const preview = buildDefeatPreview(activeRun);
    return (
      <Results
        mode="defeat"
        activeRun={activeRun}
        rewardLabel={preview.rewardLabel}
        shards={preview.shards}
        glitterDust={preview.glitterDust}
        onClaim={onClaimDefeat}
      />
    );
  }

  const station = Math.min(ROGUELITE_TOTAL_STATIONS, activeRun.completedStations + 1);
  const isBoss = activeRun.phase === "boss";
  const bossStageLabel =
    activeRun.boss.stage === "act_1"
      ? "Akt-1-Boss"
      : activeRun.boss.stage === "act_2"
        ? "Akt-2-Boss"
        : "Finale";
  const choiceGridClass = cx("sm:grid-cols-2", isWide && !isInfoOpen && "xl:grid-cols-3");

  // EncounterStage only renders the active phases; a victory with no reward package falls
  // back to the recovery view, matching prior behaviour.
  const stageContent: "path" | "encounter" | "recovery" =
    primaryContent === "path" || primaryContent === "encounter" ? primaryContent : "recovery";

  // First-run coach
  const showCoach = !coachSeen && primaryContent === "encounter";
  const coachTarget: CoachTarget | null = showCoach ? COACH_STEPS[coachStep].target : null;
  const advanceCoach = () => {
    if (coachStep >= COACH_STEPS.length - 1) markCoachSeen();
    else setCoachStep((s) => s + 1);
  };
  // If the player jumps ahead by acting, gracefully end the coach.
  const dismissCoachOnAction = () => {
    if (showCoach) markCoachSeen();
  };
  const handleChooseEncounter = (id: string) => {
    dismissCoachOnAction();
    onChooseEncounter(id);
  };
  const handleChoosePath = (id: string) => {
    dismissCoachOnAction();
    onChoosePath(id);
  };

  return (
    <div className="relative flex size-full min-h-0  flex-col gap-2.5">
      {/* Orientation: context row + voyage map */}
      <Panel className={cx("shrink-0 p-3.5", coachTarget === "route" && COACH_RING)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Eyebrow>Akt {activeRun.currentAct} von 3</Eyebrow>
            <span className="rounded-full border border-cosmic-accent/30 bg-cosmic-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cosmic-accent">
              {isBoss ? bossStageLabel : `Station ${station}/${ROGUELITE_TOTAL_STATIONS}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cosmic-yellow/30 bg-cosmic-yellow/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cosmic-yellow">
              <Target className="size-3.5 " />
              Ziel: Station {ROGUELITE_TOTAL_STATIONS}
            </span>
            <button
              type="button"
              onClick={() => setIsInfoOpen((prev) => !prev)}
              aria-expanded={isInfoOpen}
              aria-controls={INFO_PANEL_ID}
              aria-label={isInfoOpen ? "Run-Details schliessen" : "Run-Details öffnen"}
              data-testid="roguelite-drawer-toggle"
              className={cx(
                "inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cosmic-text-muted transition hover:border-cosmic-accent/40 hover:text-cosmic-text",
                coachTarget === "details" && "relative z-40 ring-2 ring-cosmic-accent",
              )}
            >
              {isInfoOpen ? (
                <PanelRightClose className="size-4 " />
              ) : (
                <PanelRightOpen className="size-4 " />
              )}
              Details
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <VoyageTrack activeRun={activeRun} />
        </div>
      </Panel>

      {/* Slim survival strip */}
      <div className="shrink-0">
        <SurvivalStrip stats={activeRun.stats} />
      </div>

      {/* Decision stage (hero) + details rail */}
      <div className="flex min-h-0 flex-1 gap-2.5">
        <div
          className={cx(
            "min-h-0 min-w-0 flex-1 rounded-3xl",
            coachTarget === "decision" && COACH_RING,
          )}
        >
          <EncounterStage
            activeRun={activeRun}
            primaryContent={stageContent}
            choiceGridClass={choiceGridClass}
            onChooseEncounter={handleChooseEncounter}
            onChoosePath={handleChoosePath}
            onRerollEncounter={onRerollEncounter}
          />
        </div>

        {isWide && isInfoOpen && (
          <aside
            className={cx(
              "hidden h-full w-[20rem] shrink-0 rounded-3xl lg:block",
              coachTarget === "details" && COACH_RING,
            )}
          >
            <BuildPanel activeRun={activeRun} panelId={INFO_PANEL_ID} variant="rail" />
          </aside>
        )}
      </div>

      {/* Mobile details sheet */}
      <AnimatePresence>
        {isInfoOpen && !isWide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex justify-end bg-[rgba(8,5,18,0.78)] lg:hidden"
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex h-full w-[min(84vw,20rem)] shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <BuildPanel
                activeRun={activeRun}
                panelId={INFO_PANEL_ID}
                variant="sheet"
                onClose={() => setIsInfoOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First-run coach overlay */}
      {showCoach && <Coach stepIndex={coachStep} onNext={advanceCoach} onSkip={markCoachSeen} />}
    </div>
  );
};
