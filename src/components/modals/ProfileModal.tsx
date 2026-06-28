import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { RefreshCw } from "lucide-react";
import { Modal } from "../ui/Modal";
import { EnclosurePreview } from "../EnclosurePreview";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { computeProfileFacts, type PublicProfile } from "../../utils/publicProfile";
import type { Animal } from "../../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The player whose profile to show; null when nothing is selected. */
  userId: string | null;
  currentUserId: string | undefined;
  formatCompactNumber: (num: number) => string;
  animalDefs: Animal[];
}

const StatTile: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex flex-col gap-0.5 rounded-2xl border-2 border-cosmic-accent/10 bg-[#1f1a4e]/40 p-2.5">
    <span className="text-base leading-none select-none">{icon}</span>
    <span className="text-xs font-mono font-black text-amber-300 truncate">{value}</span>
    <span className="text-[8px] uppercase font-mono tracking-wider text-cosmic-accent-muted/80">
      {label}
    </span>
  </div>
);

export const ProfileModal: React.FC<ProfileModalProps> = React.memo(
  ({ isOpen, onClose, userId, currentUserId, formatCompactNumber, animalDefs }) => {
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!isOpen || !userId) return;

      let cancelled = false;
      const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        setProfile(null);
        try {
          const snap = await getDoc(doc(db, "profiles", userId));
          if (cancelled) return;
          if (snap.exists()) {
            setProfile(snap.data() as PublicProfile);
          } else {
            setError("Dieser Schoepfer hat noch kein oeffentliches Profil.");
          }
        } catch (err) {
          if (cancelled) return;
          console.error("Failed to load profile:", err);
          setError("Profil konnte nicht geladen werden.");
          try {
            handleFirestoreError(err, OperationType.GET, `profiles/${userId}`);
          } catch {
            // profiled error log handled
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      fetchProfile();
      return () => {
        cancelled = true;
      };
    }, [isOpen, userId]);

    const facts = profile ? computeProfileFacts(profile, animalDefs) : null;
    const isMe = Boolean(profile && profile.userId === currentUserId);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-[#1a163a]/95 border-3 border-amber-400 flex flex-col max-w-md w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text rounded-3.5xl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-3 border-amber-400/60 bg-gradient-to-r from-[#1b1c3c] via-[#212450] to-[#1b1c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl select-none">🪐</span>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 block">
                Schoepfer-Profil
              </span>
              <div className="flex items-center gap-1.5">
                <h4 className="font-sans font-black text-cosmic-text text-sm truncate">
                  {profile?.userName || "Lade..."}
                </h4>
                {isMe && (
                  <span className="px-1 text-[8px] uppercase font-mono font-black bg-pink-500/20 text-pink-300 border border-pink-500/35 rounded-md shrink-0">
                    DU
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1b1836] border-2 border-amber-400 flex items-center justify-center font-bold text-lg text-white hover:bg-cosmic-surface-hover active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto min-h-[300px] flex flex-col gap-4">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-10">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-cosmic-accent-muted font-mono">Profil wird geladen...</p>
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-2 py-10">
              <span className="text-3xl">🌌</span>
              <p className="text-xs text-cosmic-accent-muted font-mono max-w-xs">{error}</p>
            </div>
          ) : profile && facts ? (
            <>
              {/* Enclosure render */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cosmic-accent-muted block mb-2">
                  🏡 Gehege
                </span>
                <EnclosurePreview placedAnimals={profile.placedAnimals} animalDefs={animalDefs} />
              </div>

              {/* Collection highlights */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cosmic-accent-muted block mb-2">
                  🐾 Sammlung
                </span>
                <div className="flex items-center gap-3 rounded-2xl border-2 border-cosmic-accent/10 bg-[#1f1a4e]/40 p-3 mb-2">
                  <span className="text-3xl select-none">
                    {facts.favoriteAnimal?.animal.emoji || "❔"}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[8px] uppercase font-mono tracking-wider text-cosmic-accent-muted/80 block">
                      Lieblingstier
                    </span>
                    <span className="text-xs font-black text-cosmic-text truncate block">
                      {facts.favoriteAnimal
                        ? `${facts.favoriteAnimal.animal.germanName} ×${formatCompactNumber(
                            facts.favoriteAnimal.count,
                          )}`
                        : "Noch keine Tiere"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile
                    icon="🐣"
                    label="Tiere"
                    value={formatCompactNumber(facts.totalAnimals)}
                  />
                  <StatTile icon="🌈" label="Arten" value={String(facts.distinctSpecies)} />
                  <StatTile
                    icon="🔬"
                    label="Upgrades"
                    value={formatCompactNumber(profile.purchasedUpgradesCount)}
                  />
                </div>
              </div>

              {/* Progression */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-cosmic-accent-muted block mb-2">
                  ✨ Fortschritt
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile
                    icon="💖"
                    label="Erhobenes Leben"
                    value={formatCompactNumber(profile.totalLifeEarned)}
                  />
                  <StatTile
                    icon="🪐"
                    label="Planet-Level"
                    value={formatCompactNumber(profile.planetLevel)}
                  />
                  <StatTile
                    icon="🌀"
                    label="Prestige"
                    value={formatCompactNumber(profile.prestigeCount)}
                  />
                  <StatTile
                    icon="🌙"
                    label="Monde"
                    value={formatCompactNumber(profile.moonsCount)}
                  />
                  <StatTile
                    icon="⭐"
                    label="Sterne"
                    value={formatCompactNumber(profile.starsCount)}
                  />
                  <StatTile icon="⏱️" label="Spielzeit" value={facts.playtime} />
                  <StatTile
                    icon="👆"
                    label="Klicks"
                    value={formatCompactNumber(profile.clicksCount)}
                  />
                  <StatTile
                    icon="💫"
                    label="Auto-Klicks"
                    value={formatCompactNumber(profile.starClicksTriggered)}
                  />
                  <StatTile
                    icon="🎀"
                    label="Kosmetik"
                    value={formatCompactNumber(profile.unlockedCosmeticsCount)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    );
  },
);

ProfileModal.displayName = "ProfileModal";
