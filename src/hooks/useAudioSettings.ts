import { useState, useEffect, useCallback } from "react";
import {
  setMuted,
  setMusicVolume,
  setMusicStyle,
  startBackgroundMusic,
  MusicStyleId,
} from "../utils/audio";

export function useAudioSettings() {
  const [isMutedState, setIsMutedState] = useState<boolean>(false);
  const [musicVolumeState, setMusicVolumeState] = useState<number>(0.35);
  const [musicStyleState, setMusicStyleState] = useState<MusicStyleId>("chiptune");

  // Load static music volumes and configurations
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem("cute_planet_muted");
      if (savedMuted) {
        const isMuted = savedMuted === "true";
        setMuted(isMuted);
        setIsMutedState(isMuted);
      }

      const savedVolume = localStorage.getItem("cute_planet_music_volume");
      if (savedVolume !== null) {
        const vol = Number(savedVolume);
        setMusicVolume(vol);
        setMusicVolumeState(vol);
      } else {
        setMusicVolume(0.35);
        setMusicVolumeState(0.35);
      }

      const savedStyle = localStorage.getItem("cute_planet_music_style") as MusicStyleId | null;
      if (
        savedStyle !== null &&
        ["classic", "rainy", "space", "chiptune", "zen"].includes(savedStyle)
      ) {
        setMusicStyle(savedStyle);
        setMusicStyleState(savedStyle);
      } else {
        setMusicStyle("chiptune");
        setMusicStyleState("chiptune");
      }
    } catch (e) {
      console.error("Failed to load audio settings:", e);
    }
  }, []);

  // Automatically trigger background music
  useEffect(() => {
    const handleFirstInteraction = () => {
      startBackgroundMusic();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction);
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      localStorage.setItem("cute_planet_muted", String(next));
      return next;
    });
  }, []);

  return {
    isMutedState,
    musicVolumeState,
    musicStyleState,
    setMusicStyleState,
    handleToggleMute,
  };
}
