import React from "react";
import { motion } from "motion/react";
import { Modal } from "../ui/Modal";
import { Sparkles, Compass, Rocket, Heart, Gift, Award } from "lucide-react";

interface GalaxyVoyageModalProps {
  isOpen: boolean;
  prestigeCount: number;
  onConfirmVoyage: () => void;
  inGlitchGalaxy?: boolean;
}

// A list of extra cute, comforting pastel German stories that vary with prestige level
const VOYAGE_STORIES = [
  // Prestige 0 -> 1st voyager
  "Dein Planet strahlt im sanftesten Pastellrosa, bereit für ein neues Abenteuer! Die Tierchen kuscheln sich fest in weiche Traumwölkchen, während wir leise die Segel setzen. Ein glitzernder Kometenstaub-Schweif weist uns den Weg in eine vollkommen neue, unentdeckte Ecke des glitzernden Pastell-Kosmos. Reiche deine Pfötchen, nimm tiefe Atemzüge und lass uns gemeinsam zu den Sternen aufbrechen!",

  // Prestige 1
  "Die Kirschblüten deines wunderschönen Planeten tanzen sanft im kosmischen Wind und weben einen Pfad des Abschieds. Alle deine gezüchteten Fröschlein und Kätzchen schauen mit glänzenden Augen empor. Sie wissen, dass du bereit für noch schönere Sternengärten bist! Wir packen Sternenwatte und Honigsterne ein, schließen die Augen und reisen dorthin, wo die funkelnde Aurora die Nacht in zartes Lila taucht...",

  // Prestige 2
  "Ein warmer, goldener Honigduft breitet sich aus – dein Kosmos hat seine süßeste Reife erlangt! Der kleine Waschbär wischt sich eine Träne der Freude weg, denn er weiß, dass deine Magie nun eine neue Galaxie wecken wird. Jedes Aufsteigen hinterlässt ein funkelndes Lichtband, das die Sterne für immer verbindet. Pack deine Träume in die Tasche, wir springen mitten in das Herz eines glitzernden Lavendelnebels!",

  // Prestige 3
  "Die Traumblasen tanzen im Takt deines Herzschlags, während ein sanfter Glanz den Horizont einhüllt. Dein treuer Begleiter, der kleine Panda, hält ein flauschiges Abschiedsgeschenk bereit. Jeder Schritt, den du tust, hinterlässt glitzernden Staub im unendlichen All. Eine verborgene Sternenbrücke entfaltet sich vor uns und lädt uns ein, das nächste bunte Kapitel unserer Kuschelreise zu zeichnen!",

  // Prestige 4
  "Die Melodie deines Planeten summt friedlich in der unendlichen Stille. Die kleinen Axolotl tanzen ein letztes Mal im glitzernden Wasserbett. Du hast dieses Reich mit so viel Liebe gefüllt, dass herabfallende Sternschnuppen die gesamte Milchstraße erleuchten. Uns ruft ein neues, magisches Abenteuer auf weichen Wollkometen – lass uns losfliegen und neue kosmische Wunder säen!",

  // Prestige 5
  "Sanfte Pastellfarben fließen wie flüssiger Regenbogen durch die Flüsse deines Sternenreichs. Die gemütlichsten Koalas winken dir zu, während die Sterne leise im Schlaf wispern. Deine Reise war bisher ein reines Meisterwerk der Harmonie. Nun ruft eine neue Galaxie, die noch darauf wartet, von deiner unendlichen Wärme und Liebe wachgeküsst zu werden. Bereit für den nächsten federleichten Sprung?",

  // Prestige 6
  "Ein kosmisches Schlaflied erklingt aus den Tiefen deines Kuschel-Utopias. Sternenpartikel funkeln wie kleine Diamanten auf der Nase des schlummernden Fuchses. Mit jedem Prestige schreibst du ein neues, wunderschönes Märchenbuch im Kosmos. Lass uns das nächste Kapitel aufschlagen, wo die Galaxien wie bunte Farbpunkte auf einer weichen Leinwand strahlen. Flieg mit uns!",

  // Prestige 7
  "Die gesamte Galaxie summt vor Glück und Dankbarkeit. Aus jedem Winkel deiner Himmelskörper leuchten süße Lämpchen der Liebe auf. Du hast eine perfekte Sinfonie des Pastells kreiert! Doch der Kosmos ist unendlich groß, und neue flauschige Geheimnisse warten hinter dem funkelnden Horizont darauf, von deinem liebenswerten Geist entdeckt zu werden. Vorwärts zu neuen Träumen!",
];

export const GalaxyVoyageModal: React.FC<GalaxyVoyageModalProps> = React.memo(
  ({ isOpen, prestigeCount, onConfirmVoyage, inGlitchGalaxy = false }) => {
    // Retrieve story by current prestige index
    const selectStory = VOYAGE_STORIES[prestigeCount % VOYAGE_STORIES.length];

    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {}}
        closeOnBackdrop={false}
        skipFrameTarget
        backdropClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070512]/95 backdrop-blur-md overflow-y-auto select-none"
        panelClassName={`relative max-w-2xl w-full aspect-[4/5] sm:aspect-[1.4/1] rounded-[2.5rem] overflow-hidden border-4 select-none text-white p-6 sm:p-10 flex flex-col justify-end ${
          inGlitchGalaxy
            ? "border-cyan-500 shadow-[0_0_55px_rgba(6,182,212,0.4)]"
            : "border-[#ffcbdc] shadow-[0_0_50px_rgba(255,203,220,0.35)]"
        }`}
        panelStyle={{
          backgroundImage: inGlitchGalaxy
            ? "url('/assets/stuff/glitch_galaxie.png')"
            : "url('/assets/stuff/pastell_galaxie_reise.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark warm glowing backdrop overlay over the image to guarantee readability */}
        {inGlitchGalaxy ? (
          <>
            <div className="absolute inset-0 bg-black/65 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-[#09090b]/20 pointer-events-none" />
            <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-t from-cosmic-bg/95 via-cosmic-bg/70 to-cosmic-bg/25 pointer-events-none" />
        )}

        {/* Floating sparkles / glitch particles */}
        <div
          className={`absolute top-4 right-4 sm:top-6 sm:right-6 animate-pulse select-none text-2xl ${inGlitchGalaxy ? "text-cyan-400 glitch-chromatic-text" : "text-cosmic-pink"}`}
        >
          {inGlitchGalaxy ? "⧉" : "✨"}
        </div>
        <div
          className={`absolute top-8 left-6 sm:top-12 sm:left-12 select-none text-xl animate-bounce ${inGlitchGalaxy ? "text-rose-400" : "text-cosmic-accent"}`}
          style={{ animationDuration: "4s" }}
        >
          {inGlitchGalaxy ? "⚙️" : "🪐"}
        </div>

        {/* Content Box */}
        <div className="relative z-10 space-y-4 sm:space-y-6 flex flex-col items-center text-center">
          {/* Badge & Decorative Title */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={
                inGlitchGalaxy
                  ? {
                      scale: [1, 1.05, 1],
                      borderColor: ["#f43f5e", "#06b6d4", "#f43f5e"],
                    }
                  : { y: [0, -4, 0] }
              }
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,157,184,0.1)] mb-2 ${
                inGlitchGalaxy
                  ? "bg-cyan-950/40 border border-cyan-400/50"
                  : "bg-cosmic-pink/20 border border-cosmic-pink/40"
              }`}
            >
              <Rocket
                className={`w-3.5 h-3.5 ${inGlitchGalaxy ? "text-cyan-400 animate-pulse" : "text-cosmic-pink"}`}
              />
              <span
                className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] ${inGlitchGalaxy ? "text-cyan-300" : "text-[#ffcbdc]"}`}
              >
                {inGlitchGalaxy ? "⚡ QUANTUM_RECONSTRUCTION_READY ⚡" : "Evolutionäre Vollendung"}
              </span>
            </motion.div>

            <h1
              className={`font-sans font-black uppercase text-2xl sm:text-4xl tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
                inGlitchGalaxy ? "text-cyan-400 glitch-text-anim" : "text-cosmic-text stroke-pink"
              }`}
            >
              {inGlitchGalaxy ? (
                <>
                  SEKTOR <span className="text-rose-400">REPARIEREN!</span>
                </>
              ) : (
                <>
                  Galaxiereise <span className="text-cosmic-pink">bereit!</span>
                </>
              )}
            </h1>
            <p className="font-mono text-[10px] sm:text-xs text-cosmic-accent font-black tracking-wider uppercase opacity-90 mt-1">
              Planet Level 20 erreicht •{" "}
              {inGlitchGalaxy ? "REALITÄT STABILISIEREN" : "Bereit für den nächsten Kosmos"}
            </p>
          </div>

          {/* Mini Cute Story Section / Glitch report */}
          {inGlitchGalaxy && (
            <div className="w-full max-w-md aspect-video rounded-2xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.35)] mb-2 relative">
              <img
                src="/assets/stuff/glitch_galaxie.png"
                alt="Instabile Glitch-Galaxie"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-black/75 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest border border-cyan-500/30">
                Live Sektor-Scan
              </div>
            </div>
          )}

          <div
            className={`p-4 sm:p-6 rounded-[2rem] max-w-xl w-full shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm self-center border-2 ${
              inGlitchGalaxy
                ? "bg-[#09090b]/90 border-dashed border-cyan-500/50"
                : "bg-[#120f26]/85 border-cosmic-pink/30"
            }`}
          >
            <div className="flex justify-center mb-2.5 text-rose-300">
              <Heart
                className={`w-5 h-5 fill-rose-300/30 animate-pulse ${inGlitchGalaxy ? "text-cyan-400" : "text-cosmic-pink"}`}
              />
            </div>
            <p
              className={`font-sans font-semibold text-xs sm:text-sm leading-relaxed italic ${inGlitchGalaxy ? "text-rose-300 font-mono" : "text-cosmic-text"}`}
            >
              {inGlitchGalaxy
                ? "[PROTOKOLL: OK] - Die kosmische Anomalie wurde erfolgreich gezähmt. Durch Zünden des Hyper-Quantum-Reboots wird dieser Glitch-Sektor geheilt. Du kehrst reich beschenkt in den intakten Pastell-Kosmos zurück!"
                : `"${selectStory}"`}
            </p>
          </div>

          {/* Reward Summary Badges */}
          <div className="grid grid-cols-3 gap-2.5 max-w-lg w-full">
            <div className="p-2 w-full bg-[#181333]/90 border border-cosmic-accent/40 rounded-xl flex items-center gap-2 justify-center">
              <Award className="w-4 h-4 text-[#ffcbdc] shrink-0" />
              <div className="text-left">
                <span className="block text-[8px] font-mono leading-none font-bold text-cosmic-accent-muted uppercase">
                  Prestige
                </span>
                <span className="text-[10px] sm:text-xs font-black font-sans text-cosmic-pink shrink-0">
                  +{prestigeCount + 1}
                </span>
              </div>
            </div>

            <div className="p-2 w-full bg-[#181333]/90 border border-cosmic-accent/40 rounded-xl flex items-center gap-2 justify-center">
              <Gift className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="text-left">
                <span className="block text-[8px] font-mono leading-none font-bold text-cosmic-accent-muted uppercase">
                  Bonus Truhe
                </span>
                <span className="text-[10px] sm:text-xs font-black font-sans text-amber-300 shrink-0">
                  1x Box
                </span>
              </div>
            </div>

            <div className="p-2 w-full bg-[#181333]/90 border border-cosmic-accent/40 rounded-xl flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4 text-fuchsia-300 shrink-0" />
              <div className="text-left">
                <span className="block text-[8px] font-mono leading-none font-bold text-cosmic-accent-muted uppercase">
                  {inGlitchGalaxy ? "SPLITTER & DUST" : "Währung"}
                </span>
                <span className="text-[10px] sm:text-xs font-black font-sans text-fuchsia-350 shrink-0">
                  {inGlitchGalaxy ? "+2 🏺 & +77 ✨" : "1x Splitter 🌌"}
                </span>
              </div>
            </div>
          </div>

          {/* Forced Action Button with pulsing galaxy glow */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirmVoyage}
            className={`w-full max-w-md py-4 sm:py-5 rounded-3xl font-sans font-black text-xs sm:text-sm uppercase tracking-[0.2em] border shadow-[0_0_30px_rgba(255,157,184,0.4)] cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 ${
              inGlitchGalaxy
                ? "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 text-white border-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                : "bg-gradient-to-r from-cosmic-pink via-cosmic-accent to-cosmic-pink text-cosmic-bg hover:text-[#0b0818] border-[#ffcbdc]"
            }`}
          >
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: "5s" }} />
            <span>
              {inGlitchGalaxy
                ? "SYSTEM RE-BOOT & SPEICHERN! 🛠️"
                : "Jetzt Galaxiereise antreten! 🚀"}
            </span>
          </motion.button>

          <p className="font-mono text-[9px] text-cosmic-accent-muted/70 uppercase tracking-widest font-bold">
            {inGlitchGalaxy
              ? "Effekt: Heilt den Sektor, gewährt +2 Splitter, +77 Glitzerstaub und steigert deine Reisestufe."
              : "Hinweis: Setzt Leben, LPS, Tiere & Planetenstufe für dauerhaften Bonus zurück."}
          </p>
        </div>
      </Modal>
    );
  },
);

GalaxyVoyageModal.displayName = "GalaxyVoyageModal";
