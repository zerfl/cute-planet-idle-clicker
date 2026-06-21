import React from "react";
import { ActiveCosmicEvent } from "../types";

interface ActiveEventBannerProps {
  activeEvent: string | null;
  activeEventDecision: string | null;
  activeEventDetails?: ActiveCosmicEvent | null;
  eventTimeRemaining: number;
  onSelectDecision: (decision: string) => void;
  life?: number;
  starsCount?: number;
  glitterDust?: number;
  blackHoleSize?: number;
  onGamble?: (sacrificeType: "life" | "stars" | "dust") => void;
}

export const ActiveEventBanner: React.FC<ActiveEventBannerProps> = React.memo(
  ({
    activeEvent,
    activeEventDecision,
    activeEventDetails,
    eventTimeRemaining,
    onSelectDecision,
    life = 0,
    starsCount = 0,
    glitterDust = 0,
    blackHoleSize = 1,
    onGamble,
  }) => {
    const getEventStyle = () => {
      if (!activeEvent)
        return "bg-[#110e28]/85 border-cosmic-accent/45 text-cosmic-accent-muted shadow-inner";
      if (activeEvent === "black_hole") {
        return "bg-gradient-to-br from-[#0c051a]/95 via-[#180d38]/95 to-black border-purple-600/90 text-purple-100 shadow-[0_0_30px_rgba(147,51,234,0.3)]";
      }

      const id = activeEvent;
      if (
        id.includes("solar") ||
        id.includes("tempest") ||
        id.includes("radiation") ||
        id.includes("core") ||
        id.includes("puls") ||
        id.includes("dust") ||
        id.includes("storm") ||
        id.includes("eruption")
      ) {
        return "bg-gradient-to-br from-amber-950/95 via-yellow-950/95 to-slate-950 border-amber-400/80 text-amber-100 shadow-amber-400/10";
      }
      if (
        id.includes("nebula") ||
        id.includes("galaxy") ||
        id.includes("void") ||
        id.includes("magnetic") ||
        id.includes("matrix") ||
        id.includes("rift") ||
        id.includes("supernova") ||
        id.includes("hyper")
      ) {
        return "bg-gradient-to-br from-teal-950/95 via-purple-950/95 to-slate-950 border-teal-400/80 text-teal-100 shadow-teal-400/10";
      }
      return "bg-gradient-to-br from-cyan-950/95 via-blue-950/95 to-slate-950 border-cyan-400/80 text-cyan-100 shadow-cyan-400/10";
    };

    return (
      <section
        className={`w-full max-w-2xl p-5 rounded-3xl border-3 flex flex-col gap-4.5 transition-all duration-500 shadow-lg relative overflow-hidden ${getEventStyle()}`}
      >
        {activeEvent ? (
          activeEvent === "black_hole" ? (
            <div id="active-event-black-hole" className="flex flex-col gap-4 w-full text-left">
              {/* Header section with Details */}
              <div className="flex items-start gap-4 w-full">
                <div className="text-5xl shrink-0 select-none animate-pulse mt-1">🕳️</div>
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-purple-600 text-white border border-black/30 font-mono shadow-sm leading-none animate-pulse">
                      GEFÄHRLICHE SINGULARITÄT AKTIV
                    </span>
                    <span className="font-mono text-[9px] font-black opacity-80 uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded border border-white/5">
                      Kollaps in: {Math.floor(eventTimeRemaining / 60)}:
                      {(eventTimeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[9px] font-black text-purple-300 tracking-wider bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                      Größe: St. {blackHoleSize} (+{(blackHoleSize - 1) * 25}% Bonus)
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-base uppercase mt-1.5 tracking-wide text-purple-200">
                    Das Schwarze Loch ruft nach Opfern...
                  </h4>
                  <p className="text-[11px] font-medium opacity-90 leading-relaxed mt-1 max-w-xl text-purple-200/80">
                    Am Ereignishorizont krümmt sich alles! Du kannst dem Schwarzen Loch Ressourcen
                    opfern, um ein geheimnisvolles Quantenergebnis auszulösen. Aber Vorsicht: Es
                    herrscht eine exakte 50/50-Chance zwischen Segen und katastrophaler Zerstörung!
                  </p>
                </div>
              </div>

              {/* Interactive Sacrifice / Risk Panel */}
              <div className="bg-black/45 p-4 rounded-2xl border border-purple-500/20 flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <span>⚠️</span> RISKANTES ENDGAME-SYSTEM (SPIELBARE OPFERGABEN):
                  </span>
                  <span className="text-[9px] font-bold text-gray-400">
                    Kann jederzeit ignoriert werden!
                  </span>
                </div>

                {/* Warnmeldung */}
                <div className="text-[9.5px] font-bold text-rose-300/90 leading-relaxed bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl">
                  💥 <strong>WARNUNG:</strong> Jede Opfergabe zieht die Ressourcen unwiderruflich
                  ab! Die 20 möglichen Ergebnisse sind zu gleichen Teilen (je 5% Chance) aufgeteilt:
                  10 grandiose Boni (z.B. Prestige, kostenloser Trabant-Mond, riesige Kisten,
                  seltene Cosmetics oder Staub) vs. 10 herbe Verluste (z.B. Ressourcenverlust,
                  Schwerkraft-Paralyse, Verlust von Tieren oder Trabanten).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
                  {/* Option 1: LEBEN OPFERN */}
                  {(() => {
                    const costVal = Math.floor(life * 0.5);
                    const actualCost = costVal < 10000000 ? 10000000 : costVal;
                    const canAfford = life >= actualCost;
                    return (
                      <button
                        id="btn-sacrifice-life"
                        disabled={!canAfford}
                        onClick={() => onGamble && onGamble("life")}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          canAfford
                            ? "bg-purple-950/30 border-purple-500/40 hover:bg-purple-900/40 hover:border-purple-400 active:scale-98 cursor-pointer text-white shadow shadow-purple-500/5 group"
                            : "bg-black/40 border-white/5 opacity-50 cursor-not-allowed text-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-[11px] font-black text-rose-400 uppercase">
                          <span>💖 Leben opfern</span>
                          <span className="text-[9px] font-normal bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">
                            50%
                          </span>
                        </div>
                        {canAfford ? (
                          <div className="text-[10px] font-bold mt-1 text-purple-200">
                            Gib:{" "}
                            <span className="font-mono text-white">
                              {(actualCost / 1000000).toLocaleString("de-DE", {
                                maximumFractionDigits: 1,
                              })}{" "}
                              Mio.
                            </span>
                          </div>
                        ) : (
                          <div className="text-[9.5px] font-semibold mt-1 text-slate-500">
                            Min. benötigt: 10M Leben
                          </div>
                        )}
                        <span className="text-[8px] font-bold opacity-75 leading-tight mt-0.5 text-slate-300 group-hover:text-white">
                          Gewinne RIESIGE Mengen Leben, Cosmetics oder Prestige!
                        </span>
                      </button>
                    );
                  })()}

                  {/* Option 2: STERNE OPFERN */}
                  {(() => {
                    const costVal = Math.ceil(starsCount * 0.25);
                    const actualCost = costVal < 10 ? 10 : costVal;
                    const canAfford = starsCount >= actualCost;
                    return (
                      <button
                        id="btn-sacrifice-stars"
                        disabled={!canAfford}
                        onClick={() => onGamble && onGamble("stars")}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          canAfford
                            ? "bg-purple-950/30 border-purple-500/40 hover:bg-purple-900/40 hover:border-purple-400 active:scale-98 cursor-pointer text-white shadow shadow-purple-500/5 group"
                            : "bg-black/40 border-white/5 opacity-50 cursor-not-allowed text-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-[11px] font-black text-amber-300 uppercase">
                          <span>⭐ Sterne opfern</span>
                          <span className="text-[9px] font-normal bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                            25%
                          </span>
                        </div>
                        {canAfford ? (
                          <div className="text-[10px] font-bold mt-1 text-purple-200">
                            Gib: <span className="font-mono text-white">{actualCost} Sterne</span>
                          </div>
                        ) : (
                          <div className="text-[9.5px] font-semibold mt-1 text-slate-500">
                            Min. benötigt: 10 Sterne
                          </div>
                        )}
                        <span className="text-[8px] font-bold opacity-75 leading-tight mt-0.5 text-slate-300 group-hover:text-white">
                          Erhalt gewaltige Sternensalven, seltene Skins o.ä.!
                        </span>
                      </button>
                    );
                  })()}

                  {/* Option 3: STERNENSCHNUPPEN/DUST OPFERN */}
                  {(() => {
                    const costVal = Math.ceil(glitterDust * 0.5);
                    const actualCost = costVal < 10 ? 10 : costVal;
                    const canAfford = glitterDust >= actualCost;
                    return (
                      <button
                        id="btn-sacrifice-dust"
                        disabled={!canAfford}
                        onClick={() => onGamble && onGamble("dust")}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          canAfford
                            ? "bg-purple-950/30 border-purple-500/40 hover:bg-purple-900/40 hover:border-purple-400 active:scale-98 cursor-pointer text-white shadow shadow-purple-500/5 group"
                            : "bg-black/40 border-white/5 opacity-50 cursor-not-allowed text-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-[11px] font-black text-cyan-300 uppercase">
                          <span>💫 Staub opfern</span>
                          <span className="text-[9px] font-normal bg-cyan-400/20 px-1.5 py-0.5 rounded text-cyan-200">
                            50%
                          </span>
                        </div>
                        {canAfford ? (
                          <div className="text-[10px] font-bold mt-1 text-purple-200">
                            Gib: <span className="font-mono text-white">{actualCost} Staub</span>
                          </div>
                        ) : (
                          <div className="text-[9.5px] font-semibold mt-1 text-slate-500">
                            Min. benötigt: 10 Staub
                          </div>
                        )}
                        <span className="text-[8px] font-bold opacity-75 leading-tight mt-0.5 text-slate-300 group-hover:text-white">
                          Konvertiere Staub in legendäre Aufstiege oder Wachstum!
                        </span>
                      </button>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono select-none text-slate-400 mt-1 border-t border-white/5 pt-2">
                  <span>
                    * Du kannst dieses Ereignis komplett gefahrlos ignorieren und verstreichen
                    lassen!
                  </span>
                  <button
                    id="btn-blackhole-ignore"
                    onClick={() => onSelectDecision("ignorieren")}
                    className="bg-purple-900/40 hover:bg-purple-800 font-mono text-[9.5px] px-2.5 py-1 rounded text-purple-200 border border-purple-700/40 transition cursor-pointer"
                  >
                    🧘 Ignorieren
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {/* Header section with Details */}
              <div className="flex items-start gap-3.5 w-full text-left">
                <div className="text-4xl shrink-0 select-none animate-bounce mt-1">
                  {activeEventDetails?.emoji || "🌌"}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white border border-black/30 font-mono shadow-sm leading-none">
                      KOSMISCHES EREIGNIS AKTIV
                    </span>
                    <span className="font-mono text-[9px] font-black opacity-80 uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded border border-white/5">
                      Verbleibend: {Math.floor(eventTimeRemaining / 60)}:
                      {(eventTimeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-sm uppercase mt-1 tracking-wide">
                    {activeEventDetails?.name || "Unbekanntes kosmisches Signal"}
                  </h4>
                  <p className="text-[10.5px] font-semibold opacity-90 leading-relaxed mt-1 max-w-xl text-slate-250">
                    {activeEventDetails?.description ||
                      "Ein geheimnisvolles Flackern zieht an deinem Planeten vorbei..."}
                  </p>
                </div>
              </div>

              {/* Interactive Decisional Panel */}
              <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🌌</span> Deine Event-Entscheidung:
                  </span>
                  <span className="text-[10px] font-bold">
                    {activeEventDecision ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span>Aktiv:</span>
                        <strong className="underline uppercase font-black tracking-wide">
                          {activeEventDecision === "ignorieren"
                            ? "🧘 Ignorieren"
                            : activeEventDetails?.options.find((o) => o.id === activeEventDecision)
                                ?.name || "Ausgewählt"}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-rose-300 font-extrabold animate-pulse">
                        Wähl einen Fokus! 👇
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Dynamic 3 Options */}
                  {activeEventDetails?.options.map((opt) => {
                    const isSelected = activeEventDecision === opt.id;

                    // Adaptive option icons based on typical meanings
                    let optIcon = "✨";
                    if (
                      opt.name.includes("Sammeln") ||
                      opt.name.includes("Ernte") ||
                      opt.name.includes("Kapsel") ||
                      opt.name.includes("Energie")
                    )
                      optIcon = "🌾";
                    else if (
                      opt.name.includes("Forschung") ||
                      opt.name.includes("Analys") ||
                      opt.name.includes("Daten") ||
                      opt.name.includes("Stud") ||
                      opt.name.includes("Verlauf")
                    )
                      optIcon = "🔬";
                    else if (
                      opt.name.includes("Zerleg") ||
                      opt.name.includes("Kristall") ||
                      opt.name.includes("Staub") ||
                      opt.name.includes("Ader")
                    )
                      optIcon = "💎";
                    else if (
                      opt.name.includes("Sterne") ||
                      opt.name.includes("Glan") ||
                      opt.name.includes("Stellar") ||
                      opt.name.includes("Konstell")
                    )
                      optIcon = "⭐";
                    else if (
                      opt.name.includes("Mond") ||
                      opt.name.includes("Trabant") ||
                      opt.name.includes("Kollaps") ||
                      opt.name.includes("Gravit")
                    )
                      optIcon = "🌙";
                    else if (
                      opt.name.includes("Opfer") ||
                      opt.name.includes("Absorption") ||
                      opt.name.includes("Kollision") ||
                      opt.name.includes("Sturm")
                    )
                      optIcon = "💥";

                    return (
                      <button
                        key={opt.id}
                        id={`btn-choice-${opt.id}`}
                        onClick={() => onSelectDecision(opt.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-500/20"
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-98 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-black text-emerald-300">
                          <span>{optIcon}</span> {opt.name}
                        </div>
                        <p className="text-[9.5px] opacity-80 leading-tight text-slate-300">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}

                  {/* Option 4: IGNORIEREN */}
                  <button
                    id="btn-choice-ignorieren"
                    onClick={() => onSelectDecision("ignorieren")}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      activeEventDecision === "ignorieren"
                        ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/20"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-98 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-amber-200">
                      <span>🧘</span> Ignorieren
                    </div>
                    <p className="text-[9.5px] opacity-80 leading-tight text-slate-300">
                      Ereignis träge abwarten: Erhöht Dauer um 60s, gewährt aber einen kleinen
                      passiven LPS-Bonus.
                    </p>
                  </button>
                </div>
                {activeEventDecision && (
                  <p className="text-[9px] font-mono select-none text-right text-slate-400 -mt-1">
                    *Du kannst deinen Fokus während des Events jederzeit umentscheiden!
                  </p>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-between w-full text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0 select-none animate-pulse">⏳</span>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest block font-mono">
                  KOSMISCHE PROGNOSE
                </span>
                <h5 className="font-sans font-black text-xs uppercase text-slate-400 dark:text-slate-300">
                  Nächstes kosmisches Ereignis nähert sich...
                </h5>
              </div>
            </div>
            <div className="font-mono text-xs font-black min-w-[70px] text-center sm:text-right shrink-0 bg-black/20 px-3.5 py-1 rounded-xl border border-white/5">
              {Math.floor(eventTimeRemaining / 60)}:
              {(eventTimeRemaining % 60).toString().padStart(2, "0")}
            </div>
          </div>
        )}
      </section>
    );
  },
);
ActiveEventBanner.displayName = "ActiveEventBanner";
