import React from "react";
import { X } from "lucide-react";

import {
  ROGUELITE_BOSSES,
  ROGUELITE_BOSS_MUTATIONS,
  ROGUELITE_NODE_LABELS,
} from "../../roguelite/data";
import type { ActiveRogueliteRun } from "../../roguelite/types";
import { StatGrid } from "./Vitals";
import { CATEGORY_VISUALS, Eyebrow, Panel, cx, nodeVisual } from "./theme";

const BOSS_COMET = "/assets/roguelite/roguelite_boss_comet.webp";

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export const BuildPanel: React.FC<{
  activeRun: ActiveRogueliteRun;
  panelId: string;
  variant: "rail" | "sheet";
  onClose?: () => void;
}> = ({ activeRun, panelId, variant, onClose }) => {
  const boss = ROGUELITE_BOSSES.find((entry) => entry.id === activeRun.boss.bossId);
  const mutations = activeRun.boss.mutationIds
    .map((id) => ROGUELITE_BOSS_MUTATIONS.find((mutation) => mutation.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const recent = activeRun.history.slice(-5).reverse();
  const revealed = activeRun.boss.telegraphRevealed;

  return (
    <Panel
      className={cx(
        "flex h-full flex-col p-3.5",
        variant === "sheet" && "w-full max-w-[20rem] rounded-r-none",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>Run-Details</Eyebrow>
          <div className="mt-0.5 text-[14px] font-black tracking-[0.01em] text-cosmic-text">
            Werte, Boss & Build
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Info-Panel schliessen"
            className="flex size-9  items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-cosmic-text-muted transition hover:border-cosmic-accent/40 hover:text-cosmic-text"
          >
            <X className="size-4 " />
          </button>
        )}
      </div>

      <div
        id={panelId}
        data-testid="roguelite-run-info-panel"
        className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1"
      >
        <PanelSection title="Werte">
          <StatGrid stats={activeRun.stats} />
        </PanelSection>

        <PanelSection title="Bossblick">
          <div className="flex items-center gap-3">
            <img src={BOSS_COMET} alt="Boss-Komet" className="size-12  shrink-0 object-contain" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-black text-cosmic-text">
                {boss?.name ?? activeRun.boss.bossId.replaceAll("_", " ")}
              </div>
              {boss?.title && (
                <div className="truncate text-[11px] text-cosmic-accent-muted">{boss.title}</div>
              )}
            </div>
          </div>
          <div className="mt-2.5 space-y-2">
            {mutations.map((mutation) => (
              <div
                key={mutation.id}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2"
              >
                <div className="text-[12px] font-black text-cosmic-text">
                  {revealed ? mutation.name : "Verborgene Mutation"}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-cosmic-text-muted">
                  {revealed
                    ? mutation.description
                    : "Noch nicht lesbar – wird in der Endphase relevant."}
                </div>
              </div>
            ))}
          </div>
        </PanelSection>

        <PanelSection title={`Dein Build · ${activeRun.boons.length}`}>
          {activeRun.boons.length === 0 ? (
            <p className="text-[11px] text-cosmic-text-muted">Noch keine Boni gesammelt.</p>
          ) : (
            <div className="space-y-1.5">
              {activeRun.boons.map((boon, index) => {
                const cat = CATEGORY_VISUALS[boon.category];
                const Icon = cat.icon;
                return (
                  <div
                    key={`${boon.id}-${index}`}
                    className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5"
                  >
                    <div
                      className={cx(
                        "flex size-6  shrink-0 items-center justify-center rounded-lg border",
                        cat.soft,
                      )}
                    >
                      <Icon className={cx("size-3 ", cat.text)} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-cosmic-text">
                        {boon.title}
                      </div>
                      <div
                        className={cx(
                          "text-[9px] font-black uppercase tracking-[0.12em]",
                          cat.text,
                        )}
                      >
                        {cat.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PanelSection>

        <PanelSection title="Verlauf">
          {recent.length === 0 ? (
            <p className="text-[11px] text-cosmic-text-muted">Der Run ist noch ganz frisch.</p>
          ) : (
            <div className="space-y-1.5">
              {recent.map((node) => {
                const visual = nodeVisual(node.type);
                const Icon = visual.icon;
                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5"
                  >
                    <div
                      className={cx(
                        "flex size-6  shrink-0 items-center justify-center rounded-lg border",
                        visual.soft,
                      )}
                    >
                      <Icon className={cx("size-3 ", visual.text)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold text-cosmic-text">
                        {ROGUELITE_NODE_LABELS[node.type].label}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-black text-cosmic-accent-muted">
                      {node.station}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </PanelSection>
      </div>
    </Panel>
  );
};
