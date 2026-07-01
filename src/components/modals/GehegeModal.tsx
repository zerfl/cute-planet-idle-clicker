import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Animal, PlacedAnimal } from "../../types";
import { playPop } from "../../utils/audio";
import {
  clampPercent,
  GehegeDropResult,
  commitGehegeDrag,
  POSITION_PADDING_X,
  POSITION_PADDING_Y,
  resolveGehegeDrop,
} from "./gehegePlacement";

interface AuraConfig {
  classes: string;
  name: string;
  colorName: string;
}

export const getAuraConfig = (love: number): AuraConfig | null => {
  if (love <= 0) return null;
  if (love < 30) {
    return {
      classes:
        "shadow-[0_0_25px_rgba(255,255,255,0.75),inset_0_0_12px_rgba(255,255,255,0.4)] bg-white/20 border-2 border-white/50",
      name: "Sanfter Hauch Aura 🤍",
      colorName: "Weiss",
    };
  }
  if (love < 60) {
    return {
      classes:
        "shadow-[0_0_28px_rgba(253,224,71,0.8),inset_0_0_15px_rgba(253,224,71,0.4)] bg-yellow-400/20 border-2 border-yellow-400/50",
      name: "Lichtfunken Aura 💛",
      colorName: "Goldgelb",
    };
  }
  if (love < 100) {
    return {
      classes:
        "shadow-[0_0_30px_rgba(244,114,182,0.85),inset_0_0_15px_rgba(244,114,182,0.45)] bg-pink-400/20 border-2 border-pink-400/55",
      name: "Rosige Kuschel-Aura 🌸",
      colorName: "Pastellrosa",
    };
  }
  if (love < 140) {
    return {
      classes:
        "shadow-[0_0_32px_rgba(251,146,60,0.9),inset_0_0_15px_rgba(251,146,60,0.5)] bg-orange-400/20 border-2 border-orange-400/60",
      name: "Warme Herzens-Aura 🧡",
      colorName: "Apricot",
    };
  }
  if (love < 180) {
    return {
      classes:
        "shadow-[0_0_35px_rgba(52,211,153,0.95),inset_0_0_18px_rgba(52,211,153,0.55)] bg-emerald-400/20 border-2 border-emerald-400/65",
      name: "Naturkraft Aura 💚",
      colorName: "Smaragdgruen",
    };
  }
  if (love < 220) {
    return {
      classes:
        "shadow-[0_0_38px_rgba(56,189,248,0.95),inset_0_0_18px_rgba(56,189,248,0.55)] bg-sky-400/20 border-2 border-sky-400/70",
      name: "Himmelsbrise Aura 🩵",
      colorName: "Lichtblau",
    };
  }
  if (love < 260) {
    return {
      classes:
        "shadow-[0_0_40px_rgba(129,140,248,1.0),inset_0_0_20px_rgba(129,140,248,0.6)] bg-indigo-400/20 border-2 border-indigo-400/75",
      name: "Sternenglanz Aura 💙",
      colorName: "Sternenindigo",
    };
  }
  if (love < 300) {
    return {
      classes:
        "shadow-[0_0_45px_rgba(167,139,250,1.0),inset_0_0_20px_rgba(167,139,250,0.65)] bg-violet-400/20 border-2 border-violet-400/80",
      name: "Kosmische Magie-Aura 💜",
      colorName: "Amethyst",
    };
  }
  return {
    classes:
      "shadow-[0_0_55px_rgba(239,68,68,1.0),inset_0_0_25px_rgba(245,158,11,0.7)] bg-gradient-to-tr from-rose-500/35 via-amber-500/25 to-pink-500/35 border-2 border-rose-500/90",
    name: "Ewige Zuneigungs-Meisteraura ❤️🔥 (+5% LPS Boost!)",
    colorName: "Spurenregenbogen",
  };
};

interface GehegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight: boolean;
  purchasedAnimals: Record<string, number>;
  animalDefs: Animal[];
  placedAnimals: PlacedAnimal[];
  onUpdatePlacedAnimals: (placed: PlacedAnimal[]) => void;
  animalLove?: Record<string, number>;
  onUpdateAnimalLove?: (love: Record<string, number>) => void;
  animalLastPet?: Record<string, number>;
  onUpdateAnimalLastPet?: (lastPet: Record<string, number>) => void;
  bowlLastFed?: number;
  onUpdateBowlLastFed?: (val: number) => void;
  bowlFedMinutesCredited?: number;
  onUpdateBowlFedMinutesCredited?: (val: number) => void;
}

// Helper for safe count boundary
function colCountSafe(val: number): number {
  return typeof val === "number" && !isNaN(val) ? val : 0;
}

const LONG_PRESS_MS = 280;
const WALK_FRAME_MS = Math.round(1000 / 6);
const HELD_FRAME_MS = Math.round(1000 / 4);
const PICKUP_FRAME_MS = 70;
const DROP_FRAME_MS = 35;
const MOVE_CANCEL_TAP_PX = 8;
const FEED_BOWL_BLOCKED_MESSAGE =
  "An dieser Stelle steht der Futternapf! Platziere das Tier woanders. \u{1F372}";

type SpriteAnimationPhase = "walking" | "pickup" | "held" | "drop";

const AnimalImageComponent: React.FC<{
  image?: string;
  emoji: string;
  sizeClassName?: string;
  emojiSizeClassName?: string;
}> = ({
  image,
  emoji,
  sizeClassName = "w-14 h-14 object-contain select-none pointer-events-none",
  emojiSizeClassName = "text-4xl select-none pointer-events-none",
}) => {
  const [error, setError] = useState(false);

  if (image && !error) {
    return (
      <img
        src={image}
        alt={emoji}
        onError={() => setError(true)}
        className={sizeClassName}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span className={emojiSizeClassName}>{emoji}</span>;
};

const AnimalImage = React.memo(AnimalImageComponent);

const SpriteAnimalImage = React.memo<{
  animal: Animal | undefined;
  frameRow: number;
  frameIndex: number;
  emoji?: string;
  sizeClassName?: string;
  emojiSizeClassName?: string;
}>(
  ({
    animal,
    frameRow,
    frameIndex,
    sizeClassName = "w-12 h-12 md:w-16 md:h-16",
    emojiSizeClassName = "text-3xl md:text-5xl pointer-events-none select-none",
  }) => {
    if (
      animal?.sheetSrc &&
      animal.columns &&
      animal.frameWidth &&
      animal.frameHeight &&
      animal.walkFrames &&
      animal.liftFrames
    ) {
      return (
        <div
          className={`relative overflow-hidden pointer-events-none select-none ${sizeClassName}`}
        >
          <img
            src={animal.sheetSrc}
            alt={animal.emoji}
            draggable={false}
            className="absolute inset-0 h-[200%] w-[600%] max-w-none pointer-events-none select-none"
            style={{
              transform: `translate(-${(frameIndex / animal.columns) * 100}%, -${(frameRow / 2) * 100}%)`,
            }}
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    return (
      <AnimalImage
        image={animal?.image}
        emoji={animal?.emoji || "🐾"}
        sizeClassName={sizeClassName}
        emojiSizeClassName={emojiSizeClassName}
      />
    );
  },
);

// Memoized Placed Animal Component
interface PlacedAnimalItemProps {
  pa: PlacedAnimal;
  def: Animal | undefined;
  loveVal: number;
  lastPetTime: number;
  isNight: boolean;
  landscapeRef: React.RefObject<HTMLDivElement | null>;
  onPet: (animalId: string, x: number, y: number) => void;
  onDragCommit: (id: string, x: number, y: number) => GehegeDropResult;
  onRemove: (id: string) => void;
}

const PlacedAnimalItem = React.memo<PlacedAnimalItemProps>(
  ({ pa, def, loveVal, lastPetTime, isNight, landscapeRef, onPet, onDragCommit, onRemove }) => {
    const [now, setNow] = useState(Date.now());
    const [animationPhase, setAnimationPhase] = useState<SpriteAnimationPhase>("walking");
    const [frameRow, setFrameRow] = useState(0);
    const [frameIndex, setFrameIndex] = useState(0);
    const [renderPos, setRenderPos] = useState({ x: pa.x, y: pa.y });
    const pointerStateRef = useRef({
      pointerId: -1,
      originX: pa.x,
      originY: pa.y,
      currentX: pa.x,
      currentY: pa.y,
      startClientX: 0,
      startClientY: 0,
      longPressActive: false,
      cancelTap: false,
    });
    const dragHandleRef = useRef<HTMLDivElement | null>(null);
    const holdTimeoutRef = useRef<number | null>(null);
    const suppressClickRef = useRef(false);

    React.useEffect(() => {
      const cooldownMs = 30 * 60 * 1000;
      const elapsed = Date.now() - lastPetTime;
      if (elapsed >= cooldownMs || loveVal >= 300) return;

      // Tick to update exactly when cooldown ends
      const remaining = cooldownMs - elapsed;
      const t = setTimeout(() => {
        setNow(Date.now());
      }, remaining + 100);

      return () => clearTimeout(t);
    }, [lastPetTime, loveVal]);

    React.useEffect(() => {
      if (pointerStateRef.current.longPressActive) return;

      pointerStateRef.current.originX = pa.x;
      pointerStateRef.current.originY = pa.y;
      pointerStateRef.current.currentX = pa.x;
      pointerStateRef.current.currentY = pa.y;
      setRenderPos({ x: pa.x, y: pa.y });
    }, [pa.x, pa.y]);

    React.useEffect(() => {
      let intervalId: number | null = null;
      const timeoutIds: number[] = [];
      const walkFrames = def?.walkFrames ?? 6;

      if (animationPhase === "walking") {
        setFrameRow(0);
        setFrameIndex((prev) => prev % walkFrames);
        intervalId = window.setInterval(() => {
          setFrameIndex((prev) => (prev + 1) % walkFrames);
        }, WALK_FRAME_MS);
      } else if (animationPhase === "pickup") {
        setFrameRow(1);
        setFrameIndex(0);
        [1, 2, 3].forEach((nextFrame, idx) => {
          timeoutIds.push(
            window.setTimeout(() => setFrameIndex(nextFrame), (idx + 1) * PICKUP_FRAME_MS),
          );
        });
        timeoutIds.push(window.setTimeout(() => setAnimationPhase("held"), 4 * PICKUP_FRAME_MS));
      } else if (animationPhase === "held") {
        setFrameRow(1);
        setFrameIndex(4);
        intervalId = window.setInterval(() => {
          setFrameIndex((prev) => (prev === 4 ? 5 : 4));
        }, HELD_FRAME_MS);
      } else {
        setFrameRow(1);
        setFrameIndex(3);
        [2, 1, 0].forEach((nextFrame, idx) => {
          timeoutIds.push(
            window.setTimeout(() => setFrameIndex(nextFrame), (idx + 1) * DROP_FRAME_MS),
          );
        });
        timeoutIds.push(window.setTimeout(() => setAnimationPhase("walking"), 4 * DROP_FRAME_MS));
      }

      return () => {
        if (intervalId !== null) window.clearInterval(intervalId);
        timeoutIds.forEach((id) => window.clearTimeout(id));
      };
    }, [animationPhase, def?.walkFrames]);

    React.useEffect(() => {
      return () => {
        if (holdTimeoutRef.current !== null) {
          window.clearTimeout(holdTimeoutRef.current);
        }
      };
    }, []);

    const clearHoldTimeout = useCallback(() => {
      if (holdTimeoutRef.current !== null) {
        window.clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    }, []);

    const releasePointer = useCallback(() => {
      const node = dragHandleRef.current;
      const pointerId = pointerStateRef.current.pointerId;
      if (node && pointerId >= 0 && node.hasPointerCapture?.(pointerId)) {
        node.releasePointerCapture(pointerId);
      }
      pointerStateRef.current.pointerId = -1;
    }, []);

    const finishInteraction = useCallback(
      (commitMove: boolean) => {
        clearHoldTimeout();

        const pointerState = pointerStateRef.current;
        const wasDragging = pointerState.longPressActive;

        if (wasDragging && commitMove) {
          const result = onDragCommit(pa.id, pointerState.currentX, pointerState.currentY);
          setRenderPos({ x: result.x, y: result.y });
          pointerState.originX = result.x;
          pointerState.originY = result.y;
          pointerState.currentX = result.x;
          pointerState.currentY = result.y;
          setAnimationPhase("drop");
        } else if (wasDragging) {
          setRenderPos({ x: pointerState.originX, y: pointerState.originY });
          pointerState.currentX = pointerState.originX;
          pointerState.currentY = pointerState.originY;
          setAnimationPhase("drop");
        }

        suppressClickRef.current = wasDragging || pointerState.cancelTap;
        pointerState.longPressActive = false;
        pointerState.cancelTap = false;
        releasePointer();
      },
      [clearHoldTimeout, onDragCommit, pa.id, releasePointer],
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        e.stopPropagation();
        e.preventDefault();

        const pointerState = pointerStateRef.current;
        const pointerId = e.pointerId ?? 0;
        pointerState.pointerId = pointerId;
        pointerState.originX = renderPos.x;
        pointerState.originY = renderPos.y;
        pointerState.currentX = renderPos.x;
        pointerState.currentY = renderPos.y;
        pointerState.startClientX = e.clientX;
        pointerState.startClientY = e.clientY;
        pointerState.longPressActive = false;
        pointerState.cancelTap = false;

        e.currentTarget.setPointerCapture?.(pointerId);
        clearHoldTimeout();
        holdTimeoutRef.current = window.setTimeout(() => {
          pointerStateRef.current.longPressActive = true;
          suppressClickRef.current = true;
          setAnimationPhase("pickup");
        }, LONG_PRESS_MS);
      },
      [clearHoldTimeout, renderPos.x, renderPos.y],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const pointerState = pointerStateRef.current;
        const pointerId = e.pointerId ?? pointerState.pointerId;
        if (pointerState.pointerId !== pointerId) return;

        e.stopPropagation();
        e.preventDefault();

        const dx = e.clientX - pointerState.startClientX;
        const dy = e.clientY - pointerState.startClientY;

        if (!pointerState.longPressActive) {
          if (Math.hypot(dx, dy) > MOVE_CANCEL_TAP_PX) {
            pointerState.cancelTap = true;
            clearHoldTimeout();
          }
          return;
        }

        const landscape = landscapeRef.current;
        if (!landscape) return;

        const rect = landscape.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const nextX = clampPercent(
          pointerState.originX + (dx / rect.width) * 100,
          POSITION_PADDING_X,
          100 - POSITION_PADDING_X,
        );
        const nextY = clampPercent(
          pointerState.originY + (dy / rect.height) * 100,
          POSITION_PADDING_Y,
          100 - POSITION_PADDING_Y,
        );

        pointerState.currentX = nextX;
        pointerState.currentY = nextY;
        setRenderPos({ x: nextX, y: nextY });
      },
      [clearHoldTimeout, landscapeRef],
    );

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const pointerState = pointerStateRef.current;
        const pointerId = e.pointerId ?? pointerState.pointerId;
        if (pointerState.pointerId !== pointerId) return;

        e.stopPropagation();
        e.preventDefault();
        finishInteraction(true);
      },
      [finishInteraction],
    );

    const handlePointerCancel = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const pointerState = pointerStateRef.current;
        const pointerId = e.pointerId ?? pointerState.pointerId;
        if (pointerState.pointerId !== pointerId) return;

        e.stopPropagation();
        e.preventDefault();
        finishInteraction(false);
      },
      [finishInteraction],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();

        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }

        onPet(pa.animalId, pa.x, pa.y);
      },
      [onPet, pa.animalId, pa.x, pa.y],
    );

    const canPet = now - lastPetTime >= 30 * 60 * 1000 && loveVal < 300;
    const aura = getAuraConfig(loveVal);
    const isLifted = animationPhase !== "walking";

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="absolute p-2 group"
        style={{
          left: `${renderPos.x}%`,
          top: `${renderPos.y}%`,
          x: "-50%",
          y: "-50%",
          zIndex: isLifted ? 35 : 10,
        }}
      >
        <div className="relative group/animal">
          {/* Thought Bubble with heart if animal can be pet */}
          {canPet && (
            <div className="absolute -top-6 -left-3.5 z-30 pointer-events-none animate-pulse">
              <div className="relative bg-white text-slate-800 text-[10px] px-1.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-center border border-pink-100 font-bold min-w-[24px] h-6 select-none">
                ❤️
                {/* Tail circles for thought bubble pointing to animal */}
                <div className="absolute -bottom-0.5 right-1.5 size-1.5  bg-white rounded-full border border-pink-100/50" />
                <div className="absolute -bottom-1.5 right-1 size-1  bg-white rounded-full border border-pink-100/50" />
              </div>
            </div>
          )}
          {/* Floating animation wrapper with petting interaction */}
          <div
            ref={dragHandleRef}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`cursor-pointer relative z-10 ${isLifted ? "" : "animate-bounce"}`}
            style={{ animationDuration: "2.5s", touchAction: "none" }}
            title="Streicheln ❤️"
          >
            {/* Faint Aura Backdrop pulsing behind, bouncing with the animal */}
            {aura && (
              <div
                className={`absolute -inset-4 rounded-full select-none pointer-events-none transition-all duration-1000 animate-pulse ${aura.classes}`}
                style={{ animationDuration: "3s" }}
              />
            )}

            <div
              className={`p-1.5 duration-150 transition-all relative z-10 ${isLifted ? "scale-110" : "hover:scale-110 active:scale-95"}`}
            >
              <SpriteAnimalImage
                animal={def}
                frameRow={frameRow}
                frameIndex={frameIndex}
                emoji={def?.emoji || "🐾"}
                sizeClassName="w-12 h-12 md:w-16 md:h-16 object-contain pointer-events-none select-none"
                emojiSizeClassName="text-3xl md:text-5xl pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Tooltip on hover showing animal name + love */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 bg-slate-950/90 text-[10px] text-pink-200 font-bold rounded-lg border border-pink-500/15 opacity-0 group-hover/animal:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-30 select-none shadow-md">
            {def?.germanName || "Tier"} (❤️ {loveVal})
          </div>

          {/* Simple clear-cut deletion badge hover bubble */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(pa.id);
            }}
            className="absolute -top-2 -right-2 bg-red-500/95 hover:bg-red-600 border border-white text-white font-black text-[9px] size-5  rounded-full flex items-center justify-center opacity-100 sm:opacity-0 group-hover/animal:opacity-100 transition-opacity duration-150 shadow-md cursor-pointer z-20"
            title="Tier entfernen"
          >
            ✕
          </button>
        </div>
      </motion.div>
    );
  },
);

PlacedAnimalItem.displayName = "PlacedAnimalItem";

// Memoized Feed Bowl with its own lightweight ticking interval
interface FeedBowlComponentProps {
  bowlLastFed: number;
  onUpdateBowlLastFed?: (val: number) => void;
  onUpdateBowlFedMinutesCredited?: (val: number) => void;
  onTriggerError: (msg: string) => void;
  spawnLocalHeart: (x: number, y: number) => void;
}

const FeedBowlComponent = React.memo<FeedBowlComponentProps>(
  ({
    bowlLastFed,
    onUpdateBowlLastFed,
    onUpdateBowlFedMinutesCredited,
    onTriggerError,
    spawnLocalHeart,
  }) => {
    const [localTick, setLocalTick] = useState(0);

    React.useEffect(() => {
      const elapsedMsSinceFeed = Date.now() - bowlLastFed;
      const isVoll = elapsedMsSinceFeed < 25 * 60 * 1000;
      const hasCooldown = elapsedMsSinceFeed < 30 * 60 * 1000;

      // Only set interval if we are active or in cooldown to save resources
      if (!isVoll && !hasCooldown) return;

      const t = setInterval(() => setLocalTick((prev) => prev + 1), 1000);
      return () => clearInterval(t);
    }, [bowlLastFed]);

    const elapsedMsSinceFeed = Date.now() - bowlLastFed;
    const isVoll = elapsedMsSinceFeed < 25 * 60 * 1000;
    const hasCooldown = elapsedMsSinceFeed < 30 * 60 * 1000;

    let bowlTooltip = "";
    if (isVoll) {
      const remainingMs = 25 * 60 * 1000 - elapsedMsSinceFeed;
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      bowlTooltip = `Tiere fressen... 😋 (Voll fuer ${mins}m ${secs}s)`;
    } else if (hasCooldown) {
      const remainingMs = 30 * 60 * 1000 - elapsedMsSinceFeed;
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      bowlTooltip = `Kuschelpause ⏱️ (Bereit in ${mins}m ${secs}s)`;
    } else {
      bowlTooltip = "Klicke den Futternapf an, um die Tiere zu fuettern! 🍲 (+1 Liebe pro Minute)";
    }

    const handleFeedBowlClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentNow = Date.now();
      const elapsed = currentNow - bowlLastFed;
      if (elapsed < 30 * 60 * 1000) {
        if (elapsed < 25 * 60 * 1000) {
          onTriggerError("Die Tiere fressen bereits genuesslich! 🍲");
        } else {
          const remainingMs = 30 * 60 * 1000 - elapsed;
          const mins = Math.floor(remainingMs / 60000);
          const secs = Math.floor((remainingMs % 60000) / 1000);
          onTriggerError(
            `Kuschelpause! Der Napf kann erst in ${mins}m ${secs}s wieder befuellt werden.`,
          );
        }
        return;
      }

      if (onUpdateBowlLastFed) {
        onUpdateBowlLastFed(currentNow);
      }
      if (onUpdateBowlFedMinutesCredited) {
        onUpdateBowlFedMinutesCredited(0);
      }

      playPop();

      // Spawn floating food emojis/hearts
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          spawnLocalHeart(50, 80 + Math.random() * 5);
        }, i * 150);
      }
    };

    return (
      <div
        onClick={handleFeedBowlClick}
        className="absolute group/bowl select-none z-30 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ left: "50%", top: "78%", transform: "translate(-50%, -50%)" }}
      >
        <div className="relative">
          {!hasCooldown && (
            <div
              className="absolute -inset-2 bg-pink-500/20 rounded-full blur animate-ping"
              style={{ animationDuration: "2s" }}
            />
          )}
          {isVoll && (
            <div
              className="absolute -inset-1 bg-emerald-500/10 rounded-full blur animate-pulse"
              style={{ animationDuration: "1.5s" }}
            />
          )}

          <img
            src={
              isVoll ? "/assets/stuff/futternapf_voll.webp" : "/assets/stuff/futternapf_leer.webp"
            }
            alt="Futternapf"
            className="size-14  object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
            referrerPolicy="no-referrer"
          />

          <div
            className={`absolute -top-1.5 -right-1.5 size-5  rounded-full flex items-center justify-center font-bold text-[10px] text-white border border-white/20 shadow-md ${
              isVoll
                ? "bg-emerald-500"
                : hasCooldown
                  ? "bg-amber-500 animate-pulse"
                  : "bg-indigo-600"
            }`}
          >
            {isVoll ? "🍲" : hasCooldown ? "⏱️" : "✨"}
          </div>

          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950/95 text-slate-100 text-[10px] font-bold rounded-xl border border-slate-800/80 shadow-xl opacity-0 group-hover/bowl:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 flex flex-col items-center gap-0.5 select-none text-center">
            <span className="text-pink-300 font-extrabold uppercase tracking-wide text-[9px]">
              🥕 Tier-Fuetterung 🥕
            </span>
            <span className="text-white text-[10px]">{bowlTooltip}</span>
            {!hasCooldown && (
              <span className="text-indigo-300 text-[8px] font-medium font-mono uppercase mt-0.5">
                Bereit zum Fuettern!
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FeedBowlComponent.displayName = "FeedBowlComponent";

// Memoized slide-up drawer list card
interface PurchasedAnimalCardProps {
  def: Animal;
  owned: number;
  placed: number;
  isGehegeFull: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PurchasedAnimalCard = React.memo<PurchasedAnimalCardProps>(
  ({ def, owned, placed, isGehegeFull, isSelected, onSelect }) => {
    const available = owned - colCountSafe(placed);
    const isFullyPlaced = available <= 0;

    return (
      <div
        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between items-center text-center gap-2 bg-slate-950/40 ${
          isSelected
            ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <div className="flex flex-col items-center">
          <AnimalImage
            image={def.image}
            emoji={def.emoji}
            sizeClassName="w-10 h-10 object-contain pointer-events-none select-none"
            emojiSizeClassName="text-2xl pointer-events-none select-none"
          />
          <span className="text-xs font-black text-slate-200 mt-1.5 truncate max-w-[120px]">
            {def.germanName || def.name}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
            {placed} / {owned} Platziert
          </span>
        </div>

        <button
          disabled={isFullyPlaced || isGehegeFull}
          onClick={() => onSelect(def.id)}
          className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
            isFullyPlaced
              ? "bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed"
              : isGehegeFull
                ? "bg-amber-950/40 text-amber-500/80 border border-amber-900/40 cursor-not-allowed"
                : isSelected
                  ? "bg-indigo-500 text-white border border-indigo-400 animate-pulse"
                  : "bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/20"
          }`}
        >
          {isFullyPlaced
            ? "Vollstaendig"
            : isGehegeFull
              ? "Gehege voll"
              : isSelected
                ? "Bereit..."
                : "Platzieren"}
        </button>
      </div>
    );
  },
);

PurchasedAnimalCard.displayName = "PurchasedAnimalCard";

// Memoized Gallery card with targeted 1s timer to avoid full gallery/modal render
interface LoveGalleryCardProps {
  def: Animal;
  loveVal: number;
  lastPetTime: number;
}

const LoveGalleryCard = React.memo<LoveGalleryCardProps>(({ def, loveVal, lastPetTime }) => {
  const [localTick, setLocalTick] = useState(0);

  React.useEffect(() => {
    const cooldownMs = 30 * 60 * 1000;
    const initialNow = Date.now();
    const isCooling = initialNow - lastPetTime < cooldownMs;
    if (!isCooling) return;

    const t = setInterval(() => setLocalTick((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, [lastPetTime]);

  const now = Date.now();
  const cooldownMs = 30 * 60 * 1000;
  const hasCooldown = now - lastPetTime < cooldownMs;

  let cooldownText = "Praechtig gelaunt ✨";
  if (hasCooldown) {
    const diffMs = cooldownMs - (now - lastPetTime);
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    cooldownText = `Kuschelpause (${mins}m ${secs}s)`;
  }

  const aura = getAuraConfig(loveVal);
  const percent = Math.min(100, (loveVal / 300) * 100);

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 hover:border-pink-500/20 p-4 rounded-2xl flex flex-col items-center text-center gap-3 relative transition-all group/gallery duration-200 overflow-hidden">
      {aura && (
        <div
          className={`absolute -inset-1 rounded-2xl opacity-60 select-none pointer-events-none group-hover/gallery:opacity-95 transition-opacity animate-pulse ${aura.classes}`}
          style={{ animationDuration: "3s" }}
        />
      )}

      <div className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner group-hover/gallery:scale-105 transition-transform duration-200 z-10">
        <AnimalImage
          image={def.image}
          emoji={def.emoji}
          sizeClassName="w-16 h-16 md:w-20 md:h-20 object-contain select-none pointer-events-none"
          emojiSizeClassName="text-4xl md:text-5xl select-none pointer-events-none"
        />
      </div>

      <div className="w-full flex flex-col items-center gap-1 z-10">
        <h3 className="text-xs font-black text-indigo-200 tracking-wide">
          {def.germanName || def.name}
        </h3>

        <div className="flex items-center gap-1 text-[11px] font-black text-pink-300">
          <span className="animate-bounce">❤️</span>
          <span>
            {loveVal} <span className="text-slate-500 font-normal">/ 300</span>
          </span>
        </div>

        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-full h-2 overflow-hidden mt-1 shadow-inner">
          <div
            className="bg-linear-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
          Aura:{" "}
          <span className={aura ? "text-amber-400" : "text-slate-500"}>
            {aura ? aura.name : "Keine Aura"}
          </span>
        </p>

        <span
          className={`text-[8px] font-mono font-bold uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded-md ${
            hasCooldown ? "bg-slate-800 text-slate-400" : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {cooldownText}
        </span>
      </div>
    </div>
  );
});

LoveGalleryCard.displayName = "LoveGalleryCard";

export const GehegeModal: React.FC<GehegeModalProps> = ({
  isOpen,
  onClose,
  isNight,
  purchasedAnimals,
  animalDefs,
  placedAnimals,
  onUpdatePlacedAnimals,
  animalLove = {},
  onUpdateAnimalLove,
  animalLastPet = {},
  onUpdateAnimalLastPet,
  bowlLastFed = 0,
  onUpdateBowlLastFed,
  bowlFedMinutesCredited = 0,
  onUpdateBowlFedMinutesCredited,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showLoveGallery, setShowLoveGallery] = useState(false);
  const [modalHearts, setModalHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [placingAnimalId, setPlacingAnimalId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const landscapeRef = useRef<HTMLDivElement>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto clean-up error timeout on unmount
  React.useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  // Stabilize static states & handlers via Refs to avoid child re-render cascades
  const animalLoveRef = useRef(animalLove);
  const animalLastPetRef = useRef(animalLastPet);
  const placedAnimalsRef = useRef(placedAnimals);

  React.useEffect(() => {
    animalLoveRef.current = animalLove;
  }, [animalLove]);

  React.useEffect(() => {
    animalLastPetRef.current = animalLastPet;
  }, [animalLastPet]);

  React.useEffect(() => {
    placedAnimalsRef.current = placedAnimals;
  }, [placedAnimals]);

  const spawnLocalHeart = useCallback((xPercent: number, yPercent: number) => {
    const id = Date.now() + Math.random();
    setModalHearts((prev) => [...prev, { id, x: xPercent, y: yPercent - 8 }]);
    setTimeout(() => {
      setModalHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  }, []);

  const triggerError = useCallback((msg: string) => {
    setErrorMessage(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  }, []);

  // Calculate placement counts per animal type
  const placedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    placedAnimals.forEach((pa) => {
      counts[pa.animalId] = (counts[pa.animalId] || 0) + 1;
    });
    return counts;
  }, [placedAnimals]);

  // Find animal details for rendering
  const animalMap = useMemo(() => {
    const map: Record<string, Animal> = {};
    animalDefs.forEach((def) => {
      map[def.id] = def;
    });
    return map;
  }, [animalDefs]);

  // Sync animal map ref
  const animalMapRef = useRef(animalMap);
  React.useEffect(() => {
    animalMapRef.current = animalMap;
  }, [animalMap]);

  // List of purchased animals
  const purchasedList = useMemo(() => {
    return animalDefs.filter((def) => (purchasedAnimals[def.id] || 0) > 0);
  }, [animalDefs, purchasedAnimals]);

  const placingAnimalDef = placingAnimalId ? animalMap[placingAnimalId] : null;

  const handlePetPlaced = useCallback(
    (animalId: string, xPercent: number, yPercent: number) => {
      const lastPet = animalLastPetRef.current[animalId] || 0;
      const now = Date.now();
      const cooldownMs = 30 * 60 * 1000;
      if (now - lastPet < cooldownMs) {
        const diffMs = cooldownMs - (now - lastPet);
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        const animalName = animalMapRef.current[animalId]?.germanName || "Dieses Tier";
        triggerError(
          `${animalName} hat genug Streicheleinheiten! Warte noch ${minutes}m ${seconds}s.`,
        );
        return;
      }

      const currentLove = animalLoveRef.current[animalId] || 0;
      if (currentLove >= 300) {
        triggerError("Dieses Tier hat bereits das Maximum von 300 Liebe erreicht! ❤️🌟");
        return;
      }

      if (onUpdateAnimalLove) {
        const updatedLove = { ...animalLoveRef.current };
        updatedLove[animalId] = Math.min(300, currentLove + 1);
        onUpdateAnimalLove(updatedLove);
      }
      if (onUpdateAnimalLastPet) {
        const updatedLastPet = { ...animalLastPetRef.current };
        updatedLastPet[animalId] = now;
        onUpdateAnimalLastPet(updatedLastPet);
      }

      playPop();
      spawnLocalHeart(xPercent, yPercent);
    },
    [onUpdateAnimalLove, onUpdateAnimalLastPet, spawnLocalHeart, triggerError],
  );

  const handleLandscapeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingAnimalId || !landscapeRef.current) return;

    if (placedAnimals.length >= 20) {
      triggerError("Das Gehege ist voll! Du kannst maximal 20 Tiere auf einmal platzieren.");
      setPlacingAnimalId(null);
      return;
    }

    const rect = landscapeRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    const resolvedDrop = resolveGehegeDrop(xPercent, yPercent);
    if (!resolvedDrop.accepted) {
      triggerError(FEED_BOWL_BLOCKED_MESSAGE);
      return;
    }

    const ownedCount = purchasedAnimals[placingAnimalId] || 0;
    const currentPlaced = placedCounts[placingAnimalId] || 0;

    if (currentPlaced >= ownedCount) {
      setPlacingAnimalId(null);
      return;
    }

    const newPlaced: PlacedAnimal = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      animalId: placingAnimalId,
      x: resolvedDrop.x,
      y: resolvedDrop.y,
    };

    const updated = [...placedAnimals, newPlaced];
    onUpdatePlacedAnimals(updated);

    if (currentPlaced + 1 >= ownedCount) {
      setPlacingAnimalId(null);
    }
  };

  const handleDragCommit = useCallback(
    (id: string, xPercent: number, yPercent: number): GehegeDropResult => {
      const dragCommit = commitGehegeDrag(placedAnimalsRef.current, id, xPercent, yPercent);
      if (!dragCommit.accepted) {
        triggerError(FEED_BOWL_BLOCKED_MESSAGE);
        return dragCommit;
      }

      onUpdatePlacedAnimals(dragCommit.placedAnimals);
      return dragCommit;
    },
    [onUpdatePlacedAnimals, triggerError],
  );

  const handleRemovePlaced = useCallback(
    (id: string) => {
      const updated = placedAnimalsRef.current.filter((pa) => pa.id !== id);
      onUpdatePlacedAnimals(updated);
    },
    [onUpdatePlacedAnimals],
  );

  const handleRecallAll = useCallback(() => {
    onUpdatePlacedAnimals([]);
    setPlacingAnimalId(null);
  }, [onUpdatePlacedAnimals]);

  const handleSelectPlacing = useCallback((id: string) => {
    setPlacingAnimalId(id);
    setShowDrawer(false);
  }, []);

  const isGehegeFull = placedAnimals.length >= 20;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="relative z-10 w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 md:px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" id="gehege-title-emoji">
            🏡
          </span>
          <div>
            <h1 className="text-base md:text-lg font-black text-indigo-100 tracking-wide uppercase">
              Tier-Gehege
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isNight
                ? "🌙 Nacht-Phase active // Stars +50%"
                : "☀️ Tag-Phase active // Klicks +50%"}
            </p>
          </div>
        </div>

        {/* Current Placing Banner Indicator */}
        {placingAnimalId && placingAnimalDef && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-xs text-indigo-200 font-bold animate-pulse">
            <span className="text-sm select-none">{placingAnimalDef.emoji}</span>
            <span>Klicke auf die Landschaft zum Platzieren...</span>
            <button
              onClick={() => setPlacingAnimalId(null)}
              className="ml-1 px-2 py-0.5 rounded bg-indigo-600/50 hover:bg-red-500/50 hover:text-white transition-colors cursor-pointer text-[10px]"
            >
              Abbrechen
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          id="btn-close-gehege"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider border border-slate-700 shadow transition-all duration-150 cursor-pointer"
        >
          Zurueck 🌌
        </button>
      </header>

      {/* Main Enclosure Canvas Screen */}
      <div className="grow relative overflow-hidden flex items-center justify-center bg-slate-950">
        <div
          ref={landscapeRef}
          onClick={handleLandscapeClick}
          className={`relative size-full  max-w-5xl md:max-h-[80vh] md:rounded-3xl overflow-hidden shadow-2xl transition-all duration-150 ${
            placingAnimalId
              ? "cursor-crosshair border-2 border-indigo-500"
              : "border border-slate-800"
          }`}
          style={{ aspectRatio: "16/9" }}
        >
          {/* Error message banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 inset-x-4  z-40 mx-auto max-w-md bg-amber-500 border border-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between text-xs cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-sm select-none">⚠️</span>
                  {errorMessage}
                </span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-2 hover:bg-black/10 px-1.5 py-0.5 rounded text-slate-950 font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background Landscape Picture */}
          <div className="absolute inset-0 select-none pointer-events-none">
            <img
              src={
                isNight
                  ? "/assets/stuff/gehegelandschaft_nacht.webp"
                  : "/assets/stuff/gehegelandschaft_tag.webp"
              }
              alt="Gehegelandschaft"
              className="size-full  object-cover transition-opacity duration-1000"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Render Placed Animals */}
          <AnimatePresence>
            {placedAnimals.map((pa) => {
              const def = animalMap[pa.animalId];
              const loveVal = animalLove[pa.animalId] || 0;

              return (
                <PlacedAnimalItem
                  key={pa.id}
                  pa={pa}
                  def={def}
                  loveVal={loveVal}
                  lastPetTime={animalLastPet[pa.animalId] || 0}
                  isNight={isNight}
                  landscapeRef={landscapeRef}
                  onPet={handlePetPlaced}
                  onDragCommit={handleDragCommit}
                  onRemove={handleRemovePlaced}
                />
              );
            })}
          </AnimatePresence>

          {/* Feed Bowl Exclusion Zone Indicator (only visible when placing) */}
          {placingAnimalId && (
            <div
              className="absolute -translate-1/2  rounded-full border-2 border-dashed border-rose-500/80 bg-rose-500/10 flex flex-col items-center justify-center pointer-events-none select-none z-20 animate-pulse"
              style={{
                left: "50%",
                top: "78%",
                width: "16%",
                height: "20%",
                animationDuration: "2s",
              }}
            >
              <span className="text-[9px] text-rose-200 font-extrabold uppercase tracking-widest bg-slate-950/80 px-1.5 py-0.5 rounded-md border border-rose-500/20 shadow-sm">
                Sperre 🍲
              </span>
            </div>
          )}

          {/* Feed Bowl ("Futternapf") component (Autonomous Tick) */}
          <FeedBowlComponent
            bowlLastFed={bowlLastFed}
            onUpdateBowlLastFed={onUpdateBowlLastFed}
            onUpdateBowlFedMinutesCredited={onUpdateBowlFedMinutesCredited}
            onTriggerError={triggerError}
            spawnLocalHeart={spawnLocalHeart}
          />

          {/* Render local floating hearts */}
          <AnimatePresence>
            {modalHearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 1, scale: 0.5, y: 0 }}
                animate={{ opacity: 0, scale: 1.5, y: -45, x: (Math.random() - 0.5) * 12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute text-xl select-none pointer-events-none z-40 font-bold"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
              >
                ❤️
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Floating Instructions Over Watermark if Enclosure is empty */}
          {placedAnimals.length === 0 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none select-none text-white/50 bg-black/30 backdrop-blur-xs p-6 rounded-2xl max-w-sm mx-auto border border-white/5 shadow">
              <span className="text-4xl mb-2">🐾</span>
              <p className="text-sm font-black uppercase tracking-wide text-indigo-200">
                Dein Gehege ist leer
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Klicke unten auf <b className="text-white">„Tiere platzieren“</b>, um deine suessen
                Weggefaehrten hier frei herumlaufen zu lassen!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Placing Helper Banner on Small Mobile Screens */}
      {placingAnimalId && placingAnimalDef && (
        <div className="block sm:hidden flex items-center justify-between gap-2 px-4 py-3 bg-indigo-900/90 border-t border-indigo-700/50 text-xs text-indigo-100 font-bold animate-pulse z-10 w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-lg select-none">{placingAnimalDef.emoji}</span>
            <span>Tippe auf die Landschaft...</span>
          </div>
          <button
            onClick={() => setPlacingAnimalId(null)}
            className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 transition-colors uppercase font-black text-[10px]"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Enclosure Lower Command Bar */}
      <footer className="w-full bg-slate-900 border-t border-slate-800/85 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner z-10">
        <div id="gehege-stats" className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            Platziert:{" "}
            <span
              className={`${placedAnimals.length >= 20 ? "text-amber-400 animate-pulse font-black" : "text-indigo-300 font-black"}`}
            >
              {placedAnimals.length} / 20
            </span>
          </div>
          <div>
            Besessen:{" "}
            <span className="text-indigo-300 font-black">
              {(Object.values(purchasedAnimals) as number[]).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowLoveGallery(true)}
            id="btn-love-gallery"
            className="px-4 py-2.5 rounded-2xl bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 hover:text-white border border-pink-500/20 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-md shadow-pink-500/5 active:scale-95"
          >
            <span>❤️</span>
            <span>Liebesgalerie</span>
          </button>

          {placedAnimals.length > 0 && (
            <button
              onClick={handleRecallAll}
              id="btn-recall-all"
              className="px-4 py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/20 text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer"
            >
              Alle einsammeln 🧺
            </button>
          )}

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            id="btn-toggle-placing"
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all duration-150 cursor-pointer flex items-center gap-2 shadow ${
              showDrawer
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                : "bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30 text-white shadow-indigo-500/10"
            }`}
          >
            <span>🌿 Tiere platzieren</span>
            <span>{showDrawer ? "▼" : "▲"}</span>
          </button>
        </div>
      </footer>

      {/* Slide-Up Bottom Drawer for placing animals */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            id="animal-placer-drawer"
            className="fixed inset-x-0 bottom-[72px] sm:bottom-[72px] bg-slate-900 border-t border-slate-800 shadow-2xl p-4 md:p-6 z-40 max-h-[50vh] overflow-y-auto"
          >
            <div className="w-full max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                  Waehle ein Tier zum Platzieren
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  (Nach Auswahl auf die Landschaft klicken)
                </span>
              </div>

              {placedAnimals.length >= 20 && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-300/20 rounded-xl text-xs text-amber-200 font-bold flex items-center justify-between gap-2">
                  <span>⚠️ Maximale Anzahl von 20 platzierten Tieren im Gehege erreicht!</span>
                  <span className="text-[10px] uppercase font-mono bg-amber-500/20 px-2 py-0.5 rounded-md text-amber-300 whitespace-nowrap">
                    Gehege Voll
                  </span>
                </div>
              )}

              {purchasedList.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl">🏜️</span>
                  <p className="text-slate-400 font-black uppercase tracking-wider text-xs mt-2">
                    Du hast noch keine Tiere gekauft!
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Bruete zuerst Tiere im Menue „Tiere zuechten“ aus!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {purchasedList.map((def) => {
                    const owned = purchasedAnimals[def.id] || 0;
                    const placed = placedCounts[def.id] || 0;

                    return (
                      <PurchasedAnimalCard
                        key={def.id}
                        def={def}
                        owned={owned}
                        placed={placed}
                        isGehegeFull={isGehegeFull}
                        isSelected={placingAnimalId === def.id}
                        onSelect={handleSelectPlacing}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive 2x2 Grid Love Gallery Overlay */}
      <AnimatePresence>
        {showLoveGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl animate-pulse">❤️</span>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-pink-300">
                      Tierliebe & Auren
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Streichle deine Tiere im Gehege, um magische Auren freizuschalten
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoveGallery(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider border border-slate-700/80 shadow-md transition-all cursor-pointer"
                >
                  Schliessen ✕
                </button>
              </div>

              {/* Contents scroll area */}
              <div className="p-6 overflow-y-auto grow bg-slate-900/40">
                {purchasedList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">🌵</span>
                    <p className="text-slate-400 font-extrabold uppercase text-xs mt-3">
                      Keine Tiere besessen
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1 max-w-xs mx-auto">
                      Adoptiere zuerst liebevolle Begleiter ueber das „Tiere zuechten“ Menue, um sie
                      zu liebkosen!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {purchasedList.map((def) => {
                      const loveVal = animalLove[def.id] || 0;
                      const lastPetTime = animalLastPet[def.id] || 0;

                      return (
                        <LoveGalleryCard
                          key={def.id}
                          def={def}
                          loveVal={loveVal}
                          lastPetTime={lastPetTime}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tips footer */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 text-center">
                <p className="text-[9px] text-slate-400 font-semibold max-w-md mx-auto leading-normal">
                  💡 <b>Tipp:</b> Um ein Tier zu streicheln, platziere es zuerst im Gehege und
                  klicke es direkt mit der Maus/dem Finger an! Alle 30 Min steigt die Zuneigung.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
