import React from "react";

interface Companion {
  id: string;
  emoji: string;
  x: number;
  y: number;
  delay: number;
  scale: number;
  speed: number;
}

interface BackgroundCompanionsProps {
  companions: Companion[];
}

export const BackgroundCompanions: React.FC<BackgroundCompanionsProps> = React.memo(
  ({ companions }) => {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        {companions.map((comp) => (
          <div
            key={comp.id}
            className="companion-outer text-lg sm:text-2xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            style={
              {
                left: `${comp.x}%`,
                top: `${comp.y}%`,
                transform: "translate(-50%, -50%)",
                "--drift-dur": `${comp.speed * 8}s`,
                "--drift-delay": `${-comp.delay * 2}s`,
                "--dx": `${comp.x > 50 ? -24 : 24}px`,
                "--dy": `${comp.y > 50 ? -32 : 32}px`,
                "--rot": `${comp.x > 50 ? -4 : 4}deg`,
                scale: comp.scale,
              } as React.CSSProperties
            }
          >
            <div
              className="companion-inner"
              style={
                {
                  "--bob-dur": `${comp.speed}s`,
                  "--bob-delay": `${-comp.delay}s`,
                } as React.CSSProperties
              }
            >
              {comp.emoji}
            </div>
          </div>
        ))}
      </div>
    );
  },
);
BackgroundCompanions.displayName = "BackgroundCompanions";
