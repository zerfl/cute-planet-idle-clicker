import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { Trophy, RefreshCw, Medal } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalLifeEarned: number;
  prestigeCount: number;
  updatedAt?: any;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | undefined;
  formatCompactNumber: (num: number) => string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = React.memo(
  ({ isOpen, onClose, currentUserId, formatCompactNumber }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "leaderboard"),
          orderBy("totalLifeEarned", "desc"),
          limit(50),
        );
        const querySnapshot = await getDocs(q);
        const fetchedEntries: LeaderboardEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEntries.push(doc.data() as LeaderboardEntry);
        });
        setEntries(fetchedEntries);

        // If current user is not in the top 50, fetch their individual entry
        if (currentUserId) {
          const isInTop = fetchedEntries.some((entry) => entry.userId === currentUserId);
          if (!isInTop) {
            const userDocRef = doc(db, "leaderboard", currentUserId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setCurrentUserEntry(userDocSnap.data() as LeaderboardEntry);
            } else {
              setCurrentUserEntry(null);
            }
          } else {
            setCurrentUserEntry(null);
          }
        }
      } catch (err) {
        console.error("Failed to load global leaderboard:", err);
        setError("Leaderboard konnte nicht geladen werden.");
        try {
          handleFirestoreError(err, OperationType.LIST, "leaderboard");
        } catch (e) {
          // profiled error log handled
        }
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (isOpen) {
        fetchLeaderboard();
      }
    }, [isOpen, currentUserId]);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        panelClassName="bg-[#1a163a]/95 border-3 border-amber-400 flex flex-col max-w-md w-full max-h-[85vh] shadow-2xl overflow-hidden text-cosmic-text rounded-3.5xl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-3 border-amber-400/60 bg-gradient-to-r from-[#1b1c3c] via-[#212450] to-[#1b1c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 select-none animate-bounce" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 block">
                Galerie der Schöpfer
              </span>
              <h4 className="font-sans font-black text-cosmic-text text-sm uppercase tracking-wide">
                Globale Bestenliste
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-1.5 rounded-full bg-[#1b1836] border border-amber-400/50 flex items-center justify-center text-white hover:bg-cosmic-surface-hover disabled:opacity-40 active:scale-95 transition-all shadow-md cursor-pointer"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1b1836] border-2 border-amber-400 flex items-center justify-center font-bold text-lg text-white hover:bg-cosmic-surface-hover active:scale-95 transition-all shadow-md cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-grow overflow-y-auto min-h-[300px] flex flex-col">
          {error && (
            <div className="bg-red-950/40 border border-red-500/50 p-3 rounded-xl text-center text-red-300 text-xs font-bold my-4">
              {error}
            </div>
          )}

          {loading && entries.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-10">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-cosmic-accent-muted font-mono">
                Bestenliste wird geladen...
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center space-y-2 py-10">
              <span className="text-3xl">🌌</span>
              <p className="text-xs text-cosmic-accent-muted font-mono">
                Bisher keine Einträge auf der Bestenliste.
              </p>
              <p className="text-[10px] text-gray-400">
                Verbinde dein Google-Konto, um dich zu registrieren!
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex-grow overflow-y-auto max-h-[50vh] pr-1">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isMe = entry.userId === currentUserId;
                let rankVisual = (
                  <span className="font-mono text-xs text-cosmic-accent-muted w-6 text-center">
                    #{rank}
                  </span>
                );
                let rankBg = "bg-[#1f1a4e]/50 border-transparent";

                if (rank === 1) {
                  rankVisual = <span className="text-lg">🥇</span>;
                  rankBg = "bg-gradient-to-r from-[#3e2c13] to-[#251e3a] border-amber-400/80";
                } else if (rank === 2) {
                  rankVisual = <span className="text-lg">🥈</span>;
                  rankBg = "bg-gradient-to-r from-[#292c43] to-[#1f1a4e] border-gray-300/40";
                } else if (rank === 3) {
                  rankVisual = <span className="text-lg">🥉</span>;
                  rankBg = "bg-gradient-to-r from-[#2b203c] to-[#1f1a4e] border-amber-700/40";
                }

                if (isMe) {
                  rankBg = `${rankBg} ring-2 ring-primary bg-[#2a1c4b] border-pink-400/60`;
                }

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border-2 ${rankBg} transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1b153b] border border-gray-700/30 flex items-center justify-center font-bold">
                        {rankVisual}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-sans font-black text-xs ${isMe ? "text-pink-300" : "text-cosmic-text"}`}
                          >
                            {entry.userName}
                          </span>
                          {isMe && (
                            <span className="px-1 text-[8px] uppercase font-mono font-black bg-pink-500/20 text-pink-300 border border-pink-500/35 rounded-md">
                              DU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-cosmic-accent-muted/80 font-mono">
                          Mutterplaneten-Prestige: {entry.prestigeCount || 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-amber-300 block">
                        {formatCompactNumber(entry.totalLifeEarned)} 💖
                      </span>
                      <span className="text-[8px] text-cosmic-accent-muted font-mono uppercase block tracking-wider">
                        Erhobenes Leben
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current User rank section at bottom if they aren't in the list */}
          {currentUserEntry && (
            <div className="mt-4 pt-3 border-t-2 border-cosmic-accent/10 shrink-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cosmic-accent-muted block mb-2 text-center">
                Deine Platzierung
              </span>
              <div className="flex items-center justify-between p-2.5 rounded-2xl border-2 border-pink-400 bg-gradient-to-r from-[#2a1c4b] to-[#1a163a]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-455 flex items-center justify-center font-black text-xs text-pink-300">
                    Rang ?
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-black text-xs text-pink-300">
                        {currentUserEntry.userName}
                      </span>
                      <span className="px-1 text-[8px] uppercase font-mono font-black bg-pink-500/20 text-pink-300 border border-pink-500/35 rounded-md">
                        DU
                      </span>
                    </div>
                    <span className="text-[10px] text-cosmic-accent-muted font-mono">
                      Mutterplaneten-Prestige: {currentUserEntry.prestigeCount || 0}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-amber-300 block">
                    {formatCompactNumber(currentUserEntry.totalLifeEarned)} 💖
                  </span>
                  <span className="text-[8px] text-cosmic-accent-muted font-mono uppercase block tracking-wider">
                    Erhobenes Leben
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Hint */}
        <div className="p-4 bg-gradient-to-r from-[#101026] to-[#161334] border-t-2 border-cosmic-accent/10 flex items-center justify-center text-center shrink-0">
          <p className="text-[10px] text-cosmic-accent-muted/90 max-w-sm leading-relaxed">
            Deine Position wird automatisch aktualisiert, wenn deine Spieldaten in die Cloud
            synchronisiert werden.
          </p>
        </div>
      </Modal>
    );
  },
);

LeaderboardModal.displayName = "LeaderboardModal";
