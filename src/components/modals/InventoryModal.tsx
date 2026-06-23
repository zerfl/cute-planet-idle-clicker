import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Modal } from "../ui/Modal";
import { Sparkles, Star, ShieldAlert, Check, Lock, Backpack } from "lucide-react";
import { COSMETIC_ITEMS, CosmeticItem, RARITY_STYLES } from "../../data/cosmetics";
import { CRAFTING_RECIPES } from "../../data/recipes";
import { ZODIACS } from "../../data/zodiacs";
import { useGameState } from "../../contexts/GameStateContext";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  unlockedCosmetics: string[];
  activeStarColor: string;
  activeAccessory: string;
  activeFrame: string;
  activeMoonSkin: string;
  onOpenShootingStar: (cosmetic: CosmeticItem, isDuplicate: boolean, glitterRefund: number) => void;
  onApplyCosmetic: (
    id: string,
    type: "star_color" | "planet_accessory" | "frame_style" | "moon_skin",
  ) => void;

  // Glitter Dust props
  purchasedUpgrades: string[];
  cosmeticRarityLevels: Record<string, string>;
  onUnlockCosmeticDirect: (cosmeticId: string, cost: number) => void;
  onUpgradeCosmeticRarity: (cosmeticId: string, nextRarity: string, cost: number) => void;

  // Crafted items
  craftedItems?: Record<string, number>;
  onUseCraftedItem?: (itemId: string, count: number) => void;
  zodiac?: string;
  onSelectZodiac?: (zodiacId: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    isNight,
    unlockedCosmetics,
    activeStarColor,
    activeAccessory,
    activeFrame,
    activeMoonSkin,
    onOpenShootingStar,
    onApplyCosmetic,
    purchasedUpgrades,
    cosmeticRarityLevels,
    onUnlockCosmeticDirect,
    onUpgradeCosmeticRarity,
    craftedItems = {},
    onUseCraftedItem,
    zodiac,
    onSelectZodiac,
  }) => {
    const { glitterDust, shootingStarsCount } = useGameState();
    const [activeTab, setActiveTab] = useState<string>("star_color");
    const [openingState, setOpeningState] = useState<"idle" | "shaking" | "revealed">("idle");
    const [revealedItem, setRevealedItem] = useState<CosmeticItem | null>(null);
    const [isRevealDuplicate, setIsRevealDuplicate] = useState(false);

    const getGlitterRefund = (rarity: string): number => {
      if (rarity === "legendary") return 100;
      if (rarity === "epic") return 45;
      if (rarity === "rare") return 15;
      return 5;
    };

    const getDirectPurchaseCost = (rarity: string) => {
      let cost = 15;
      switch (rarity) {
        case "legendary":
          cost = 300;
          break;
        case "epic":
          cost = 100;
          break;
        case "rare":
          cost = 40;
          break;
        default:
          cost = 15;
      }
      if (zodiac === "einhorn") {
        cost = Math.ceil(cost * 0.8);
      }
      return cost;
    };

    const getRarityUpgradeDetails = (currentRarity: string) => {
      let details = { nextRarity: "rare", cost: 20, name: "Selten" };
      switch (currentRarity) {
        case "common":
          details = { nextRarity: "rare", cost: 20, name: "Selten" };
          break;
        case "rare":
          details = { nextRarity: "epic", cost: 50, name: "Episch" };
          break;
        case "epic":
          details = { nextRarity: "legendary", cost: 120, name: "Legendär" };
          break;
        default:
          return null;
      }
      if (zodiac === "einhorn") {
        details.cost = Math.ceil(details.cost * 0.8);
      }
      return details;
    };

    // Weighted roll for cosmetics
    const handleOpenBox = () => {
      if (shootingStarsCount <= 0 || openingState !== "idle") return;

      setOpeningState("shaking");
      setRevealedItem(null);

      // Simulate epic starlight opening sequence
      setTimeout(() => {
        const hasGachaMagnet = purchasedUpgrades.includes("upg-glitter-gacha");
        const rand = Math.random() * 100;
        let selectedRarity: "common" | "rare" | "epic" | "legendary" = "common";

        if (hasGachaMagnet) {
          // Legendary: 6% * 1.5 = 9%
          // Epic: 16% * 1.30 = 20.8%
          // Rare: 33% (up to 62.8%)
          if (rand < 9) {
            selectedRarity = "legendary";
          } else if (rand < 29.8) {
            selectedRarity = "epic";
          } else if (rand < 62.8) {
            selectedRarity = "rare";
          } else {
            selectedRarity = "common";
          }
        } else {
          if (rand < 6) {
            selectedRarity = "legendary";
          } else if (rand < 22) {
            selectedRarity = "epic";
          } else if (rand < 55) {
            selectedRarity = "rare";
          } else {
            selectedRarity = "common";
          }
        }

        // Filter templates matching this rarity
        let pool = COSMETIC_ITEMS.filter((item) => item.rarity === selectedRarity);
        if (pool.length === 0) pool = COSMETIC_ITEMS;

        const rolled = pool[Math.floor(Math.random() * pool.length)];
        const alreadyUnlocked = unlockedCosmetics.includes(rolled.id);
        const refundAmt = getGlitterRefund(rolled.rarity);

        setRevealedItem(rolled);
        setIsRevealDuplicate(alreadyUnlocked);
        setOpeningState("revealed");

        // Dispatch state update to parent (refundAmt represents Glitter Dust!)
        onOpenShootingStar(rolled, alreadyUnlocked, refundAmt);
      }, 1500);
    };

    const handleCloseReveal = () => {
      setOpeningState("idle");
      setRevealedItem(null);
    };

    // Tabs translation helpers
    const tabs = [
      { id: "star_color", label: "🪄 Click-Sterne" },
      { id: "planet_accessory", label: "👒 Planet-Hüte" },
      { id: "frame_style", label: "🖼️ Fensterrahmen" },
      { id: "moon_skin", label: "🌙 Mond-Skins" },
      { id: "crafted", label: "🔮 Kreationen" },
    ] as const;

    const currentItems =
      activeTab === "crafted" ? [] : COSMETIC_ITEMS.filter((i) => i.type === activeTab);
    const sortedItems = [...currentItems].sort((a, b) => {
      const aUnlocked = unlockedCosmetics.includes(a.id);
      const bUnlocked = unlockedCosmetics.includes(b.id);
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      return 0;
    });

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName={`flex flex-col max-w-2xl w-full max-h-[85vh] shadow-2xl rounded-3.5xl overflow-hidden border-3 transition-colors duration-500 text-cosmic-text relative ${
          isNight
            ? "bg-[#161230]/95 border-cosmic-accent"
            : "bg-amber-50/95 border-amber-400 text-slate-800"
        }`}
      >
        {/* GACHA SHAKING STATE OVERLAY */}
        {openingState === "shaking" && (
          <div className="absolute inset-0 bg-[#070514ec]/98 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-50">
            <motion.div
              animate={{
                rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="text-7xl select-none filter drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]"
            >
              ☄️
            </motion.div>
            <p className="font-mono text-center font-black text-sm text-yellow-300 uppercase tracking-widest animate-pulse">
              Öffne Sternenstaub... ✨
            </p>
          </div>
        )}

        {/* GACHA REVEALED POPUP OVERLAY */}
        {openingState === "revealed" && revealedItem && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a061d]/98 to-[#130d2f]/98 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-5 max-w-md flex flex-col items-center"
            >
              <div className="relative inline-block mb-2">
                <div className="absolute -inset-6 rounded-full bg-amber-400/25 blur-xl animate-ping" />
                <span className="text-[100px] select-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] block leading-none">
                  {revealedItem.emoji}
                </span>
              </div>

              <div className="space-y-2">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider border ${
                    RARITY_STYLES[revealedItem.rarity].bg
                  } ${RARITY_STYLES[revealedItem.rarity].text} ${RARITY_STYLES[revealedItem.rarity].border}`}
                >
                  {RARITY_STYLES[revealedItem.rarity].name}
                </span>
                <h4 className="font-sans font-black text-xl text-amber-300 uppercase tracking-wide mt-3 leading-tight">
                  {revealedItem.germanName}
                </h4>
                <p className="text-[12px] font-semibold text-[#c5bfe2] max-w-xs leading-relaxed px-2 text-center">
                  {revealedItem.germanDescription}
                </p>
              </div>

              {isRevealDuplicate ? (
                <div className="bg-pink-500/10 border border-pink-400/40 px-4 py-3 rounded-2xl flex items-center justify-center gap-2.5 max-w-xs">
                  <span className="text-2xl">✨</span>
                  <p className="text-[11px] font-black text-pink-300 uppercase tracking-wide leading-tight text-center">
                    Bereits freigeschaltet!
                    <br />
                    <span className="text-xs text-pink-100 font-bold">
                      +{getGlitterRefund(revealedItem.rarity)} Glitzerstaub erhalten!
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs font-black text-green-400 uppercase tracking-wider animate-bounce my-2">
                  ✨ GANZ NEU FREIGESCHALTET! ✨
                </p>
              )}

              <button
                onClick={handleCloseReveal}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-450 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-sans font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all mt-4"
              >
                Wie fabelhaft! ➔
              </button>
            </motion.div>
          </div>
        )}

        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b-3 flex items-center justify-between shrink-0 transition-colors duration-500 ${
            isNight
              ? "border-cosmic-accent/40 bg-[#0c091e]"
              : "border-amber-300 bg-amber-100 text-[#2c1d0a]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none animate-pulse">🎒</span>
            <div>
              <span
                className={`text-[9px] uppercase font-black tracking-wider block ${isNight ? "text-purple-300" : "text-amber-700"}`}
              >
                Kosmetikkammer & Lootboxen
              </span>
              <h4 className="font-sans font-black text-sm uppercase tracking-wide">
                Sterneninventar
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer ${
              isNight
                ? "bg-[#1a1738] border-2 border-cosmic-accent text-purple-200 hover:bg-cosmic-surface-hover"
                : "bg-white border-2 border-amber-450 text-amber-900 hover:bg-amber-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content Box */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow flex flex-col gap-5">
          {/* LOOTBOX OPENER CARD */}
          <div
            className={`p-4 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden transition-all ${
              isNight
                ? "bg-gradient-to-br from-[#1c1642] to-[#26164d] border-cosmic-accent/30"
                : "bg-gradient-to-br from-amber-100 to-orange-100/50 border-amber-300"
            }`}
          >
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-2xl select-none">☄️</span>
                <h5 className="font-sans font-extrabold text-sm uppercase tracking-wider text-amber-400">
                  Sternschnuppen-Lootbox
                </h5>
              </div>
              <p
                className={`text-[11px] font-bold ${isNight ? "text-purple-200" : "text-amber-900"}`}
              >
                Du hast aktuell:{" "}
                <strong className="text-sm bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400 text-amber-300 ml-1">
                  🌠 {shootingStarsCount} x
                </strong>
              </p>
              <p
                className={`text-[10px] font-bold opacity-75 max-w-sm ${isNight ? "text-slate-400" : "text-slate-600"}`}
              >
                Öffne eine Sternschnuppe, um Farben für deine Autoclicker-Sterne, Hüte für den
                Planeten oder edle Fensterrahmen freizuschalten!
              </p>
            </div>

            <div className="shrink-0">
              {shootingStarsCount <= 0 ? (
                <div
                  className={`px-4 py-2.5 rounded-2xl border text-center font-sans font-black text-xs uppercase cursor-not-allowed select-none ${
                    isNight
                      ? "bg-[#120e23]/55 border-cosmic-accent/10 text-purple-300/40"
                      : "bg-gray-200/55 border-gray-400/20 text-gray-500"
                  }`}
                >
                  Keine Sternschnuppen
                </div>
              ) : openingState === "idle" ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenBox}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-450 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-sans font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2 border-2 border-yellow-300"
                >
                  <Sparkles className="w-4 h-4 text-yellow-105 animate-spin" />
                  Öffnen!
                </motion.button>
              ) : null}
            </div>
          </div>

          {/* GLITTER DUST DASHBOARD & SPECIAL SYSTEMS */}
          <div
            className={`p-4 rounded-3xl border-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${
              isNight
                ? "bg-[#110e2d]/60 border-purple-500/20 text-purple-200"
                : "bg-amber-50 border-amber-300 text-amber-900"
            }`}
          >
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/25 text-center">
              <span className="text-xl">✨</span>
              <span className="text-[9px] uppercase font-bold text-cosmic-accent tracking-widest mt-1">
                Glitzerstaub-Konto
              </span>
              <h5 className="text-lg font-black text-white mt-1">
                {glitterDust ? glitterDust.toLocaleString() : "0"} ✨
              </h5>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/25 text-center">
              <span className="text-xl">🧲</span>
              <span className="text-[9px] uppercase font-bold text-cosmic-accent tracking-widest mt-1">
                Lootbox-Magnet
              </span>
              <h5 className="text-xs font-black text-white mt-1">
                {purchasedUpgrades.includes("upg-glitter-gacha")
                  ? "⚡ Boosted (+50% Leg.)"
                  : "Standard (6% Leg.)"}
              </h5>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/25 text-center">
              <span className="text-xl">🧩</span>
              <span className="text-[9px] uppercase font-bold text-cosmic-accent tracking-widest mt-1">
                Set-Boni
              </span>
              <h5 className="text-[11px] font-black text-white mt-1 leading-tight">
                {!purchasedUpgrades.includes("upg-glitter-set") ? (
                  <span className="opacity-50">Nicht erforscht</span>
                ) : (
                  <span className="text-emerald-400">
                    {[
                      ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) =>
                        unlockedCosmetics.includes(id),
                      )
                        ? "🌸"
                        : "",
                      ["star_cyber", "acc_space_glasses", "moon_cyber"].every((id) =>
                        unlockedCosmetics.includes(id),
                      )
                        ? "⚡"
                        : "",
                      ["star_gold", "acc_star_crown", "moon_gold"].every((id) =>
                        unlockedCosmetics.includes(id),
                      )
                        ? "👑"
                        : "",
                      ["star_ghostly", "frame_ghost", "moon_ghost"].every((id) =>
                        unlockedCosmetics.includes(id),
                      )
                        ? "👻"
                        : "",
                      [
                        "star_butterfly",
                        "acc_butterfly_wings",
                        "frame_butterfly",
                        "moon_butterfly",
                      ].every((id) => unlockedCosmetics.includes(id))
                        ? "🦋"
                        : "",
                    ].filter(Boolean).length > 0
                      ? "Aktiv: " +
                        [
                          ["star_pink", "acc_flower_crown", "moon_sakura"].every((id) =>
                            unlockedCosmetics.includes(id),
                          )
                            ? "Sakura"
                            : "",
                          ["star_cyber", "acc_space_glasses", "moon_cyber"].every((id) =>
                            unlockedCosmetics.includes(id),
                          )
                            ? "Cyber"
                            : "",
                          ["star_gold", "acc_star_crown", "moon_gold"].every((id) =>
                            unlockedCosmetics.includes(id),
                          )
                            ? "Gold"
                            : "",
                          ["star_ghostly", "frame_ghost", "moon_ghost"].every((id) =>
                            unlockedCosmetics.includes(id),
                          )
                            ? "Spuk"
                            : "",
                          [
                            "star_butterfly",
                            "acc_butterfly_wings",
                            "frame_butterfly",
                            "moon_butterfly",
                          ].every((id) => unlockedCosmetics.includes(id))
                            ? "Schmetterling"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "Keine Sets voll"}
                  </span>
                )}
              </h5>
            </div>
          </div>

          {/* CHERISHED COSMETIC SETS LIST */}
          {purchasedUpgrades.includes("upg-glitter-set") && (
            <div
              className={`p-4 rounded-3xl border-2 flex flex-col gap-3 ${
                isNight
                  ? "bg-[#141038]/70 border-purple-500/20 text-purple-200"
                  : "bg-orange-50/70 border-amber-300 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-2 border-b border-purple-500/10 pb-2">
                <span className="text-base">🧩</span>
                <span
                  className={`text-xs font-black uppercase tracking-wider ${isNight ? "text-purple-200" : "text-amber-900"}`}
                >
                  Sammel-Sets &amp; Aktive Vorteile
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/20 ml-auto font-bold animate-pulse">
                  System Aktiv
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* SAKURA SET */}
                {(() => {
                  const items = [
                    { id: "star_pink", name: "Rosa Stern 🌸" },
                    { id: "acc_flower_crown", name: "Blumenkranz 🌸" },
                    { id: "moon_sakura", name: "Sakura-Mond 🌸" },
                  ];
                  const unlockedCount = items.filter((it) =>
                    unlockedCosmetics.includes(it.id),
                  ).length;
                  const complete = unlockedCount === 3;
                  return (
                    <div
                      className={`p-2.5 rounded-2xl border transition-all ${
                        complete
                          ? "bg-pink-500/10 border-pink-500/40"
                          : isNight
                            ? "bg-black/20 border-purple-950/40 opacity-75"
                            : "bg-white/50 border-gray-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-pink-300 flex items-center gap-1.5">
                          🌸 Sakura-Set{" "}
                          <span className="text-[10px] opacity-75 font-medium">
                            ({unlockedCount}/3)
                          </span>
                        </span>
                        {complete && (
                          <span className="text-[8.5px] uppercase font-black bg-pink-500/25 text-pink-300 px-1.5 py-0.2 rounded border border-pink-400/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 leading-tight">
                        Teile:{" "}
                        {items.map((it, i) => (
                          <span
                            key={it.id}
                            className={
                              unlockedCosmetics.includes(it.id) ? "text-pink-300" : "opacity-40"
                            }
                          >
                            {it.name}
                            {i < 2 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                      <p className="text-[10px] text-pink-200/90 font-mono mt-1.5 bg-pink-950/25 p-1.5 rounded-lg border border-pink-500/10">
                        🎁 Vorteil:{" "}
                        <strong className="text-pink-300 font-extrabold">
                          +20% Missions-Ertrag
                        </strong>
                      </p>
                    </div>
                  );
                })()}

                {/* CYBER SET */}
                {(() => {
                  const items = [
                    { id: "star_cyber", name: "Cyber-Stern ⚡" },
                    { id: "acc_space_glasses", name: "Cyber-Brille 🕶️" },
                    { id: "moon_cyber", name: "Matrix-Mond 💾" },
                  ];
                  const unlockedCount = items.filter((it) =>
                    unlockedCosmetics.includes(it.id),
                  ).length;
                  const complete = unlockedCount === 3;
                  return (
                    <div
                      className={`p-2.5 rounded-2xl border transition-all ${
                        complete
                          ? "bg-cyan-500/10 border-cyan-500/40"
                          : isNight
                            ? "bg-black/20 border-purple-950/40 opacity-75"
                            : "bg-white/50 border-gray-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                          ⚡ Cyber-Set{" "}
                          <span className="text-[10px] opacity-75 font-medium">
                            ({unlockedCount}/3)
                          </span>
                        </span>
                        {complete && (
                          <span className="text-[8.5px] uppercase font-black bg-cyan-500/25 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 leading-tight">
                        Teile:{" "}
                        {items.map((it, i) => (
                          <span
                            key={it.id}
                            className={
                              unlockedCosmetics.includes(it.id) ? "text-cyan-300" : "opacity-40"
                            }
                          >
                            {it.name}
                            {i < 2 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                      <p className="text-[10px] text-cyan-200/90 font-mono mt-1.5 bg-cyan-950/25 p-1.5 rounded-lg border border-cyan-500/10">
                        🎁 Vorteil:{" "}
                        <strong className="text-cyan-300 font-extrabold">+15% Sterne-Ertrag</strong>
                      </p>
                    </div>
                  );
                })()}

                {/* GOLD SET */}
                {(() => {
                  const items = [
                    { id: "star_gold", name: "Goldene Pracht 👑" },
                    { id: "acc_star_crown", name: "Krönchen ♛" },
                    { id: "moon_gold", name: "Gold-Mond 👑" },
                  ];
                  const unlockedCount = items.filter((it) =>
                    unlockedCosmetics.includes(it.id),
                  ).length;
                  const complete = unlockedCount === 3;
                  return (
                    <div
                      className={`p-2.5 rounded-2xl border transition-all ${
                        complete
                          ? "bg-amber-500/10 border-amber-500/40"
                          : isNight
                            ? "bg-black/20 border-purple-950/40 opacity-75"
                            : "bg-white/50 border-gray-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          👑 Gold-Set{" "}
                          <span className="text-[10px] opacity-75 font-medium">
                            ({unlockedCount}/3)
                          </span>
                        </span>
                        {complete && (
                          <span className="text-[8.5px] uppercase font-black bg-amber-500/25 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 leading-tight">
                        Teile:{" "}
                        {items.map((it, i) => (
                          <span
                            key={it.id}
                            className={
                              unlockedCosmetics.includes(it.id) ? "text-amber-300" : "opacity-40"
                            }
                          >
                            {it.name}
                            {i < 2 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                      <p className="text-[10px] text-amber-200/90 font-mono mt-1.5 bg-amber-950/25 p-1.5 rounded-lg border border-amber-500/30">
                        🎁 Vorteil:{" "}
                        <strong className="text-amber-300 font-extrabold">
                          +5% Alles (Generierung)
                        </strong>
                      </p>
                    </div>
                  );
                })()}

                {/* GHOST / SPUK SET */}
                {(() => {
                  const items = [
                    { id: "star_ghostly", name: "Spektralgeist 👻" },
                    { id: "frame_ghost", name: "Geister-Rahmen 👻" },
                    { id: "moon_ghost", name: "Geister-Mond 👻" },
                  ];
                  const unlockedCount = items.filter((it) =>
                    unlockedCosmetics.includes(it.id),
                  ).length;
                  const complete = unlockedCount === 3;
                  return (
                    <div
                      className={`p-2.5 rounded-2xl border transition-all ${
                        complete
                          ? "bg-purple-500/10 border-purple-500/40"
                          : isNight
                            ? "bg-black/20 border-purple-950/40 opacity-75"
                            : "bg-white/50 border-gray-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                          👻 Spuk-Set{" "}
                          <span className="text-[10px] opacity-75 font-medium">
                            ({unlockedCount}/3)
                          </span>
                        </span>
                        {complete && (
                          <span className="text-[8.5px] uppercase font-black bg-purple-500/25 text-purple-300 px-1.5 py-0.2 rounded border border-purple-400/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 leading-tight">
                        Teile:{" "}
                        {items.map((it, i) => (
                          <span
                            key={it.id}
                            className={
                              unlockedCosmetics.includes(it.id) ? "text-purple-300" : "opacity-40"
                            }
                          >
                            {it.name}
                            {i < 2 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                      <p className="text-[10px] text-purple-200/90 font-mono mt-1.5 bg-purple-950/25 p-1.5 rounded-lg border border-purple-500/10">
                        🎁 Vorteil:{" "}
                        <strong className="text-purple-300 font-extrabold">
                          Stärkerer Nacht-Ertrag
                        </strong>
                      </p>
                    </div>
                  );
                })()}

                {/* BUTTERFLY / SCHMETTERLING SET */}
                {(() => {
                  const items = [
                    { id: "star_butterfly", name: "Hauch 🦋" },
                    { id: "acc_butterfly_wings", name: "Flügel 🦋" },
                    { id: "frame_butterfly", name: "Garten 🦋" },
                    { id: "moon_butterfly", name: "Traum 🦋" },
                  ];
                  const unlockedCount = items.filter((it) =>
                    unlockedCosmetics.includes(it.id),
                  ).length;
                  const complete = unlockedCount === 4;
                  return (
                    <div
                      className={`p-2.5 rounded-2xl border transition-all md:col-span-2 ${
                        complete
                          ? "bg-pink-500/10 border-pink-500/40"
                          : isNight
                            ? "bg-black/20 border-purple-950/40 opacity-75"
                            : "bg-white/50 border-gray-200 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-pink-300 flex items-center gap-1.5">
                          🦋 Schmetterlings-Set{" "}
                          <span className="text-[10px] opacity-75 font-medium">
                            ({unlockedCount}/4)
                          </span>
                        </span>
                        {complete && (
                          <span className="text-[8.5px] uppercase font-black bg-pink-500/25 text-pink-300 px-1.5 py-0.2 rounded border border-pink-400/30">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 mt-1 leading-tight">
                        Teile:{" "}
                        {items.map((it, i) => (
                          <span
                            key={it.id}
                            className={
                              unlockedCosmetics.includes(it.id) ? "text-pink-300" : "opacity-40"
                            }
                          >
                            {it.name}
                            {i < 3 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                      <p className="text-[10px] text-pink-200/90 font-mono mt-1.5 bg-pink-950/25 p-1.5 rounded-lg border border-pink-500/10">
                        🎁 Vorteil:{" "}
                        <strong className="text-pink-300 font-extrabold">
                          +15% Alles-Ertrag &amp; +25% Erfahrung
                        </strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB BAR SEGMENTED ROADPIN */}
          <div className="flex rounded-2xl bg-[#0d0a22] p-1 border border-purple-500/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl font-sans font-extrabold text-xs tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? isNight
                      ? "bg-[#211a4e] text-cosmic-accent shadow-lg border border-purple-500/20"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                    : isNight
                      ? "text-[#978aac] hover:text-white"
                      : "text-slate-600 hover:bg-slate-200/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* GRID OF COSMETICS OR CRAFTED ITEMS */}
          {activeTab === "crafted" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
              {CRAFTING_RECIPES.filter((r) => r.category === "consumables").map((recipe) => {
                const item = recipe.result;
                const qty = craftedItems?.[item.id] || 0;
                const canActivate = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 border-2 rounded-2.5xl flex flex-col justify-between text-center relative overflow-hidden min-h-[145px] transition-all bg-[#14122d]/45 ${
                      qty > 0
                        ? isNight
                          ? "border-cosmic-accent/50 bg-[#1d194c]/50"
                          : "border-amber-450 bg-amber-100/40 text-slate-800"
                        : "opacity-45 border-gray-650/10 cursor-not-allowed select-none"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl select-none filter drop-shadow-md mb-1.5">
                        {item.emoji}
                      </span>
                      <h6
                        className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-white" : "text-slate-800"}`}
                      >
                        {item.name}
                      </h6>
                      <p
                        className={`text-[10px] sm:text-[10.5px] text-[#a599d1] mt-1 leading-normal max-w-xs ${!isNight && "text-slate-600"}`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="text-[10.5px] font-mono leading-none text-purple-300">
                        Besitz:{" "}
                        <strong className="text-white font-extrabold bg-[#1d173c]/80 px-2 py-0.5 rounded-md border border-purple-400/20">
                          {qty}x
                        </strong>
                      </div>

                      {!canActivate ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl text-[10px] font-black uppercase bg-slate-800/80 border border-[#b4a9cc]/10 text-slate-500 cursor-not-allowed select-none"
                        >
                          Keine Exemplare
                        </button>
                      ) : qty > 1 ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onUseCraftedItem?.(item.id, 1)}
                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-white transition-all bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm cursor-pointer active:scale-[0.98] border border-green-400"
                          >
                            1x Öffnen
                          </button>
                          <button
                            onClick={() => onUseCraftedItem?.(item.id, qty)}
                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-white transition-all bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-sm cursor-pointer active:scale-[0.98] border border-teal-400"
                            title={`Öffnet alle ${qty} Exemplare auf einmal`}
                          >
                            Alle ({qty}x)
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onUseCraftedItem?.(item.id, 1)}
                          className="w-full py-2 rounded-xl text-[10px] font-black uppercase text-white transition-all bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md cursor-pointer active:scale-[0.98] border border-green-450"
                        >
                          1x Öffnen ✨
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 mt-1 sm:grid-cols-2 md:grid-cols-3">
              {/* Hardcoded Default items */}
              {activeTab === "star_color" && (
                <div
                  onClick={() => onApplyCosmetic("default", "star_color")}
                  className={`p-3.5 rounded-2.5xl border-2 transition-all flex flex-col items-center text-center justify-between cursor-pointer ${
                    activeStarColor === "default"
                      ? "bg-[#18392c]/50 border-green-400 shadow-md scale-102"
                      : isNight
                        ? "bg-[#181335]/45 border-cosmic-accent/20 hover:bg-[#1f1945]/60"
                        : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div className="text-3xl filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)] select-none">
                    🎨
                  </div>
                  <div className="mt-2 text-center">
                    <h6
                      className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-[#fff]" : "text-slate-800"}`}
                    >
                      Standard-Gelb
                    </h6>
                    <span className="text-[9px] font-mono text-gray-400 block mt-0.5 uppercase">
                      Kostenlos
                    </span>
                  </div>
                  <div className="mt-3.5 w-full">
                    {activeStarColor === "default" ? (
                      <span className="text-[10px] uppercase font-black text-green-400 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Aktiviert
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] uppercase font-bold ${isNight ? "text-purple-300" : "text-amber-800"}`}
                      >
                        Aktivieren
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "planet_accessory" && (
                <div
                  onClick={() => onApplyCosmetic("none", "planet_accessory")}
                  className={`p-3.5 rounded-2.5xl border-2 transition-all flex flex-col items-center text-center justify-between cursor-pointer ${
                    activeAccessory === "none"
                      ? "bg-[#18392c]/50 border-green-400 shadow-md scale-102"
                      : isNight
                        ? "bg-[#181335]/45 border-cosmic-accent/20 hover:bg-[#1f1945]/60"
                        : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div className="text-3xl select-none">❌</div>
                  <div className="mt-2 text-center">
                    <h6
                      className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-[#fff]" : "text-slate-800"}`}
                    >
                      Kein Hut
                    </h6>
                    <span className="text-[9px] font-mono text-gray-400 block mt-0.5 uppercase">
                      Nackt
                    </span>
                  </div>
                  <div className="mt-3.5 w-full">
                    {activeAccessory === "none" ? (
                      <span className="text-[10px] uppercase font-black text-green-400 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Aktiviert
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] uppercase font-bold ${isNight ? "text-purple-300" : "text-amber-805"}`}
                      >
                        Aktivieren
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "frame_style" && (
                <div
                  onClick={() => onApplyCosmetic("default", "frame_style")}
                  className={`p-3.5 rounded-2.5xl border-2 transition-all flex flex-col items-center text-center justify-between cursor-pointer ${
                    activeFrame === "default"
                      ? "bg-[#18392c]/50 border-green-400 shadow-md scale-102"
                      : isNight
                        ? "bg-[#181335]/45 border-cosmic-accent/20 hover:bg-[#1f1945]/60"
                        : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div className="text-3xl select-none">🖼️</div>
                  <div className="mt-2 text-center">
                    <h6
                      className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-[#fff]" : "text-slate-800"}`}
                    >
                      Standard-Rahmen
                    </h6>
                    <span className="text-[9px] font-mono text-gray-400 block mt-0.5 uppercase">
                      Klassisch
                    </span>
                  </div>
                  <div className="mt-3.5 w-full">
                    {activeFrame === "default" ? (
                      <span className="text-[10px] uppercase font-black text-green-400 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Aktiviert
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] uppercase font-bold ${isNight ? "text-purple-300" : "text-amber-808"}`}
                      >
                        Aktivieren
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "moon_skin" && (
                <div
                  onClick={() => onApplyCosmetic("default", "moon_skin")}
                  className={`p-3.5 rounded-2.5xl border-2 transition-all flex flex-col items-center text-center justify-between cursor-pointer ${
                    activeMoonSkin === "default"
                      ? "bg-[#18392c]/50 border-green-400 shadow-md scale-102"
                      : isNight
                        ? "bg-[#181335]/45 border-cosmic-accent/20 hover:bg-[#1f1945]/60"
                        : "bg-white border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div className="text-3xl select-none">🌙</div>
                  <div className="mt-2 text-center">
                    <h6
                      className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-[#fff]" : "text-slate-800"}`}
                    >
                      Standard-Mond
                    </h6>
                    <span className="text-[9px] font-mono text-gray-400 block mt-0.5 uppercase">
                      Klassisch
                    </span>
                  </div>
                  <div className="mt-3.5 w-full">
                    {activeMoonSkin === "default" ? (
                      <span className="text-[10px] uppercase font-black text-green-400 flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Aktiviert
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] uppercase font-bold ${isNight ? "text-purple-300" : "text-amber-804"}`}
                      >
                        Aktivieren
                      </span>
                    )}
                  </div>
                </div>
              )}

              {sortedItems.map((cosmetic) => {
                const isUnlocked = unlockedCosmetics.includes(cosmetic.id);
                const hasWishUpgrade = purchasedUpgrades.includes("upg-glitter-wish");
                const hasRarityUpgrade = purchasedUpgrades.includes("upg-glitter-rarity");

                // Overwrite rarity if upgraded
                const currentRarity = cosmeticRarityLevels?.[cosmetic.id] || cosmetic.rarity;
                const rarityStyle = RARITY_STYLES[currentRarity] || RARITY_STYLES[cosmetic.rarity];

                const upgradeDetails = getRarityUpgradeDetails(currentRarity);

                // Determine if active
                let isActive = false;
                if (activeTab === "star_color") isActive = activeStarColor === cosmetic.value;
                else if (activeTab === "planet_accessory")
                  isActive = activeAccessory === cosmetic.value;
                else if (activeTab === "frame_style") isActive = activeFrame === cosmetic.value;
                else if (activeTab === "moon_skin") isActive = activeMoonSkin === cosmetic.value;

                return (
                  <div
                    key={cosmetic.id}
                    onClick={() => isUnlocked && onApplyCosmetic(cosmetic.value, cosmetic.type)}
                    className={`p-3 border-2 rounded-2.5xl flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[145px] transition-all ${
                      isActive
                        ? "bg-[#18392c]/50 border-green-400 shadow-md scale-102"
                        : isUnlocked
                          ? isNight
                            ? "bg-[#211a4a]/40 border-purple-500/20 hover:bg-cosmic-surface-mid/80 cursor-pointer"
                            : "bg-white border-amber-200 hover:bg-amber-50/50 cursor-pointer"
                          : hasWishUpgrade
                            ? isNight
                              ? "bg-[#1c183a]/90 border-pink-500/40 opacity-95 cursor-default"
                              : "bg-pink-50/90 hover:bg-pink-100 border-pink-300 opacity-95 cursor-default"
                            : "bg-[#14122d]/40 border-gray-600/10 opacity-45 cursor-not-allowed select-none"
                    }`}
                  >
                    {/* Lock symbol if not unlocked */}
                    {!isUnlocked && !hasWishUpgrade && (
                      <div className="absolute right-2 top-2 w-4 h-4 rounded-full bg-slate-900/40 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    )}

                    {/* Rarity Upgrade Chevron Button */}
                    {isUnlocked && hasRarityUpgrade && upgradeDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (glitterDust >= upgradeDetails.cost) {
                            onUpgradeCosmeticRarity(
                              cosmetic.id,
                              upgradeDetails.nextRarity,
                              upgradeDetails.cost,
                            );
                          }
                        }}
                        disabled={glitterDust < upgradeDetails.cost}
                        className={`absolute top-1.5 right-1.5 p-1 px-1.5 rounded-lg text-[8px] font-sans font-black z-15 transition-all text-white flex items-center gap-0.5 border ${
                          glitterDust >= upgradeDetails.cost
                            ? "bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 border-pink-400 shadow-md scale-105 active:scale-95 cursor-pointer"
                            : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                        }`}
                        title={`Upgrade zu ${upgradeDetails.name} (+5% global LPS Boost) für ${upgradeDetails.cost} ✨`}
                      >
                        ▲ {upgradeDetails.cost}
                      </button>
                    )}

                    <div className="text-3xl select-none filter drop-shadow-md">
                      {cosmetic.emoji}
                    </div>

                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <h6
                        className={`font-sans font-black text-[11px] leading-tight ${isNight ? "text-white" : "text-slate-800"}`}
                      >
                        {cosmetic.germanName}
                      </h6>

                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[8.5px] font-mono border px-1.5 py-0.2 rounded-full inline-block scale-90 ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}
                        >
                          {rarityStyle.name}
                        </span>
                        {cosmeticRarityLevels?.[cosmetic.id] && (
                          <span className="text-[7px] font-bold text-amber-300 tracking-wider uppercase mt-0.5">
                            ✨ Aufgewertet ✨
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 w-full select-none">
                      {isActive ? (
                        <span className="text-[10px] uppercase font-black text-green-400 flex items-center justify-center gap-1 leading-none">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Aktiviert
                        </span>
                      ) : isUnlocked ? (
                        <span
                          className={`text-[9.5px] uppercase font-bold leading-none ${isNight ? "text-purple-300" : "text-amber-802"}`}
                        >
                          Ausrüsten
                        </span>
                      ) : hasWishUpgrade ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cost = getDirectPurchaseCost(cosmetic.rarity);
                            if (glitterDust >= cost) {
                              onUnlockCosmeticDirect(cosmetic.id, cost);
                            }
                          }}
                          disabled={glitterDust < getDirectPurchaseCost(cosmetic.rarity)}
                          className={`w-full py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-white transition-all ${
                            glitterDust >= getDirectPurchaseCost(cosmetic.rarity)
                              ? "bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 shadow-md cursor-pointer active:scale-95"
                              : "bg-slate-800/80 border border-[#b4a9cc]/10 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          Kaufen: {getDirectPurchaseCost(cosmetic.rarity)} ✨
                        </button>
                      ) : (
                        <span className="text-[8px] uppercase font-mono text-gray-400 font-bold block leading-none">
                          Gesperrt
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    );
  },
);

InventoryModal.displayName = "InventoryModal";
