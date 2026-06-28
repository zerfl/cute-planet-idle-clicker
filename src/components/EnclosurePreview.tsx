import React, { useMemo, useState } from "react";
import type { Animal, PlacedAnimal } from "../types";

/**
 * Read-only render of a player's animal enclosure (Gehege) for the public profile: the landscape
 * backdrop plus each placed animal pinned at its stored x/y percentage. No drag, pet, or feed
 * interactivity — a static snapshot, deliberately decoupled from the heavy interactive GehegeModal.
 */

const AnimalGlyph = React.memo<{ def: Animal | undefined }>(({ def }) => {
  const [imgError, setImgError] = useState(false);

  if (def?.image && !imgError) {
    return (
      <img
        src={def.image}
        alt={def.emoji}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        className="w-8 h-8 md:w-10 md:h-10 object-contain select-none pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
      />
    );
  }

  return (
    <span className="text-2xl md:text-3xl select-none pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
      {def?.emoji || "🐾"}
    </span>
  );
});

AnimalGlyph.displayName = "AnimalGlyph";

interface EnclosurePreviewProps {
  placedAnimals: PlacedAnimal[];
  animalDefs: Animal[];
  isNight?: boolean;
}

export const EnclosurePreview: React.FC<EnclosurePreviewProps> = ({
  placedAnimals,
  animalDefs,
  isNight = true,
}) => {
  const animalMap = useMemo(() => {
    const map = new Map<string, Animal>();
    animalDefs.forEach((def) => map.set(def.id, def));
    return map;
  }, [animalDefs]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border-2 border-cosmic-accent/20 shadow-inner bg-slate-950"
      style={{ aspectRatio: "16/9" }}
    >
      <img
        src={
          isNight
            ? "/assets/stuff/gehegelandschaft_nacht.png"
            : "/assets/stuff/gehegelandschaft_tag.png"
        }
        alt="Gehegelandschaft"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {placedAnimals.map((pa) => (
        <div
          key={pa.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pa.x}%`, top: `${pa.y}%` }}
        >
          <AnimalGlyph def={animalMap.get(pa.animalId)} />
        </div>
      ))}

      {placedAnimals.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/60 bg-black/30 backdrop-blur-xs select-none">
          <span className="text-3xl mb-1">🐾</span>
          <p className="text-[11px] font-black uppercase tracking-wide text-indigo-200">
            Leeres Gehege
          </p>
        </div>
      )}
    </div>
  );
};

EnclosurePreview.displayName = "EnclosurePreview";
