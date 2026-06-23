import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const LOW_MEMORY_KEY = "cute_planet_low_memory";

export interface DisplayPreferences {
  isLowMemory: boolean;
  setIsLowMemory: Dispatch<SetStateAction<boolean>>;
  prefersReducedMotion: boolean;
  /** True when GPU-heavy animations should be dropped (low-memory OR reduced-motion). */
  disableAnimations: boolean;
}

/**
 * Display / performance preferences: the user's persisted low-memory toggle and
 * the OS `prefers-reduced-motion` setting, plus the derived `disableAnimations`
 * flag the UI uses to drop GPU-heavy effects.
 */
export function useDisplayPreferences(): DisplayPreferences {
  const [isLowMemory, setIsLowMemory] = useState<boolean>(
    () => localStorage.getItem(LOW_MEMORY_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(LOW_MEMORY_KEY, isLowMemory.toString());
  }, [isLowMemory]);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const disableAnimations = isLowMemory || prefersReducedMotion;

  return { isLowMemory, setIsLowMemory, prefersReducedMotion, disableAnimations };
}
