import React from "react";
import { motion } from "motion/react";
import { MousePointerClick, PanelRight, Route } from "lucide-react";

import { Eyebrow, GhostButton, PrimaryButton, cx, usePrefersReducedMotion } from "./theme";

const COACH_SEEN_KEY = "cute_planet_roguelite_coach_seen";

/** First-run coach "seen" flag, persisted in localStorage (view-only, no save changes). */
export function useCoachSeen(): [boolean, () => void] {
  const [seen, setSeen] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(COACH_SEEN_KEY) === "1";
    } catch {
      return true;
    }
  });

  const markSeen = React.useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(COACH_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  return [seen, markSeen];
}

export type CoachTarget = "route" | "decision" | "details";

export interface CoachStep {
  target: CoachTarget;
  icon: typeof Route;
  title: string;
  body: string;
}

export const COACH_STEPS: CoachStep[] = [
  {
    target: "route",
    icon: Route,
    title: "Das ist deine Reiseroute",
    body: "Reise durch 30 Stationen über 3 Akte. Dein Ziel: den Endboss bei Station 30 bezwingen – Bosse warten bei 10, 20 und 30.",
  },
  {
    target: "decision",
    icon: MousePointerClick,
    title: "Hier triffst du deine Wahl",
    body: "An jeder Station wählst du eine Karte. Achte auf Gewinn, Preis und Risiko – dann tippe sie an, um weiterzureisen.",
  },
  {
    target: "details",
    icon: PanelRight,
    title: "Werte, Boss & Hilfe",
    body: "Dein Leben siehst du immer oben. Über „Details“ findest du Werte, Build und den Boss. Das ?-Symbol oben öffnet jederzeit die Hilfe.",
  },
];

export const Coach: React.FC<{
  stepIndex: number;
  onNext: () => void;
  onSkip: () => void;
}> = ({ stepIndex, onNext, onSkip }) => {
  const reducedMotion = usePrefersReducedMotion();
  const step = COACH_STEPS[stepIndex];
  const isLast = stepIndex === COACH_STEPS.length - 1;
  const Icon = step.icon;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-[#08050f]/72" aria-hidden="true" />
      <motion.div
        key={stepIndex}
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        data-testid="roguelite-coach"
        role="dialog"
        aria-label="Einführung"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] max-w-md overflow-y-auto rounded-3xl border border-cosmic-accent/40 bg-cosmic-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_24px_70px_rgba(6,4,16,0.7)] sm:p-5"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-9  items-center justify-center rounded-2xl border border-cosmic-accent/40 bg-cosmic-accent/12">
            <Icon className="size-4  text-cosmic-accent" />
          </span>
          <Eyebrow>
            Tipp {stepIndex + 1} / {COACH_STEPS.length}
          </Eyebrow>
        </div>

        <h4 className="mt-2.5 text-lg font-black tracking-[0.01em] text-cosmic-text">
          {step.title}
        </h4>
        <p className="mt-1 text-[13px] leading-snug text-cosmic-text-muted">{step.body}</p>

        <div className="mt-3.5 flex flex-col gap-3 min-[361px]:flex-row min-[361px]:items-center min-[361px]:justify-between">
          <div className="flex items-center gap-1.5 max-[360px]:justify-center">
            {COACH_STEPS.map((_, i) => (
              <span
                key={i}
                className={cx(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex ? "w-5 bg-cosmic-accent" : "w-1.5 bg-white/20",
                )}
              />
            ))}
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-[360px]:flex-col max-[360px]:items-stretch">
            {!isLast && (
              <GhostButton onClick={onSkip} className="min-w-0 px-3 py-2 max-[360px]:w-full">
                Überspringen
              </GhostButton>
            )}
            <PrimaryButton onClick={onNext} className="min-w-0 px-4 py-2.5 max-[360px]:w-full">
              {isLast ? "Los geht's" : "Weiter"}
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    </>
  );
};

/** Ring overlay used to spotlight the region the active coach step points at. */
export const COACH_RING =
  "relative z-40 ring-2 ring-cosmic-accent ring-offset-2 ring-offset-cosmic-bg shadow-[0_0_44px_rgba(202,165,254,0.5)]";
