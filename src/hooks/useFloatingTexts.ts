import { useEffect, useRef, useState } from "react";
import type { FloatingText } from "../types";

/**
 * Owns the floating "+N" reward particles and their lifecycle. A single 200ms
 * sweep prunes expired particles (level-up texts live 4s, others 1.2s) instead
 * of a per-particle setTimeout cascade.
 *
 * The raw `setFloatingTexts` setter and `nextParticleId` ref are returned so
 * each spawn site can keep its own cap and positioning logic.
 */
export function useFloatingTexts() {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const nextParticleId = useRef<number>(1);

  useEffect(() => {
    const sweepInterval = setInterval(() => {
      setFloatingTexts((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        const next = prev.filter((p) => {
          const age = now - (p.createdAt || 0);
          const limit = p.type === "level" ? 4000 : 1200;
          return age < limit;
        });
        if (next.length === prev.length) return prev;
        return next;
      });
    }, 200);
    return () => clearInterval(sweepInterval);
  }, []);

  return { floatingTexts, setFloatingTexts, nextParticleId };
}
