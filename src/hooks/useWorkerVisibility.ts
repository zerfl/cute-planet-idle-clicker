import { useEffect, type RefObject } from "react";

/**
 * Pauses the worker's timers while the tab is hidden and resumes them on return,
 * so a backgrounded tab doesn't build up a tick backlog that freezes on focus.
 */
export function useWorkerVisibility(workerRef: RefObject<Worker | null>) {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        workerRef.current?.postMessage({ type: "PAUSE_TIMERS" });
      } else {
        workerRef.current?.postMessage({ type: "RESUME_TIMERS" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [workerRef]);
}
