import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "../lib/firebase";

export interface CloudSaveData {
  userId: string;
  life: number;
  totalLifeEarned: number;
  starsCount: number;
  purchasedAnimals: Record<string, number>;
  purchasedUpgrades: string[];
  planetLevel: number;
  planetExp: number;
  clicksCount: number;
  starClicksTriggered: number;
  secondsPlayed: number;
  unlockedCosmetics?: string[];
  activeStarColor?: string;
  activeAccessory?: string;
  activeFrame?: string;
  activeMoonSkin?: string;
  shootingStarsCount?: number;
  missionSetNumber?: number;
  claimedMissionIds?: string[];
  missionsCooldownEnd?: number | null;
  prestigeCount?: number;
  moonsCount?: number;
  constellations?: Record<string, number>;
  glitterDust?: number;
  cosmeticRarityLevels?: Record<string, string>;
  blackHoleSize?: number;
  galaxyShards?: number;
  createdAt?: any; // Timestamp or string
  updatedAt?: any; // Timestamp or string
}

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Conflict state management
  const [cloudSaveFound, setCloudSaveFound] = useState<CloudSaveData | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [saveCreatedAt, setSaveCreatedAt] = useState<any>(null);

  // Keep a reference to current logged in user UID to avoid race conditions
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      userRef.current = currentUser;
      setAuthLoading(false);

      if (currentUser) {
        // Fetch save when user logs in
        await checkAndFetchCloudSave(currentUser);
      } else {
        setCloudSaveFound(null);
        setShowConflictDialog(false);
        setSaveCreatedAt(null);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch save if it exists
  const checkAndFetchCloudSave = async (currentUser: User) => {
    setSyncing(true);
    const docRef = doc(db, "saves", currentUser.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const data = rawData as CloudSaveData;
        setCloudSaveFound(data);
        if (data.createdAt) {
          setSaveCreatedAt(data.createdAt);
        }
        
        // Auto check if we have a conflict or if we should auto load/save
        const localSaveStr = localStorage.getItem("cute_planet_save");
        if (localSaveStr) {
          try {
            const localSave = JSON.parse(localSaveStr);
            // If local life or play duration is virtually empty/unstarted (new player), auto-load cloud save directly without prompt
            if ((localSave.totalLifeEarned || 0) < 100 && (localSave.secondsPlayed || 0) < 30) {
              // Auto resolve using cloud load
              triggerCloudStateLoad(data);
            } else {
              // Show prompt to choose between Cloud save and Local save
              setShowConflictDialog(true);
            }
          } catch (e) {
            console.error("Local save parse error during onboarding sync:", e);
            triggerCloudStateLoad(data);
          }
        } else {
          // No local save, directly load cloud progress
          triggerCloudStateLoad(data);
        }
      } else {
        // No save exists on Firestore for this user - directly upload current local state to cloud
        setCloudSaveFound(null);
        await uploadCurrentLocalState(currentUser.uid);
      }
    } catch (err) {
      console.error("Failed to check cloud save:", err);
      // Fallback/log error based on rules
      try {
        handleFirestoreError(err, OperationType.GET, `saves/${currentUser.uid}`);
      } catch (e) {
        // handled profile error log
      }
    } finally {
      setSyncing(false);
    }
  };

  // Upload current progress directly to cloud as fresh register
  const uploadCurrentLocalState = async (uid: string) => {
    const localSaveStr = localStorage.getItem("cute_planet_save");
    if (!localSaveStr) return;

    try {
      const localSave = JSON.parse(localSaveStr);
      setSyncing(true);
      const docRef = doc(db, "saves", uid);
      
      // If we already have a cloud save found, preserve its createdAt to satisfy update rules, otherwise use serverTimestamp()
      const resolvedCreatedAt = cloudSaveFound?.createdAt || serverTimestamp();
      const creationTime = serverTimestamp();
      
      const payload: CloudSaveData = {
        userId: uid,
        life: Number(localSave.life || 0),
        totalLifeEarned: Number(localSave.totalLifeEarned || 0),
        starsCount: Number(localSave.starsCount || 0),
        purchasedAnimals: localSave.purchasedAnimals || {},
        purchasedUpgrades: localSave.purchasedUpgrades || [],
        planetLevel: Number(localSave.planetLevel || 1),
        planetExp: Number(localSave.planetExp || 0),
        clicksCount: Number(localSave.clicksCount || 0),
        starClicksTriggered: Number(localSave.starClicksTriggered || 0),
        secondsPlayed: Number(localSave.secondsPlayed || 0),
        unlockedCosmetics: localSave.unlockedCosmetics || [],
        activeStarColor: localSave.activeStarColor || "default",
        activeAccessory: localSave.activeAccessory || "none",
        activeFrame: localSave.activeFrame || "default",
        activeMoonSkin: localSave.activeMoonSkin || "default",
        shootingStarsCount: Number(localSave.shootingStarsCount || 0),
        missionSetNumber: Number(localSave.missionSetNumber || 1),
        claimedMissionIds: localSave.claimedMissionIds || [],
        missionsCooldownEnd: localSave.missionsCooldownEnd !== undefined ? (localSave.missionsCooldownEnd ? Number(localSave.missionsCooldownEnd) : null) : null,
        prestigeCount: Number(localSave.prestigeCount || 0),
        moonsCount: Number(localSave.moonsCount || 0),
        constellations: localSave.constellations || {},
        glitterDust: Number(localSave.glitterDust || 0),
        cosmeticRarityLevels: localSave.cosmeticRarityLevels || {},
        blackHoleSize: Number(localSave.blackHoleSize || 1),
        galaxyShards: Number(localSave.galaxyShards || 0),
        createdAt: resolvedCreatedAt,
        updatedAt: creationTime,
      };

      await setDoc(docRef, payload);
      
      // Save to public leaderboard on Firestore
      try {
        const leaderboardRef = doc(db, "leaderboard", uid);
        const displayName = userRef.current?.displayName || (userRef.current?.email ? userRef.current.email.split("@")[0] : "Anonymes Wesen");
        await setDoc(leaderboardRef, {
          userId: uid,
          userName: displayName,
          totalLifeEarned: Number(localSave.totalLifeEarned || 0),
          prestigeCount: Number(localSave.prestigeCount || 0),
          updatedAt: creationTime,
        });
      } catch (lErr) {
        console.error("Leaderboard sync failed during initial save:", lErr);
      }
      
      // Set local save state immediately so the UI is immediately high fidelity
      setCloudSaveFound(payload);
      setLastSynced(new Date());

      // Fetch fresh document to resolve high-fidelity server timestamp and save it in state
      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists()) {
        const freshData = freshSnap.data() as CloudSaveData;
        setSaveCreatedAt(freshData.createdAt || creationTime);
        setCloudSaveFound(freshData);
      } else {
        setSaveCreatedAt(creationTime);
      }
    } catch (err) {
      console.error("Failed to upload local save as initial sync:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `saves/${uid}`);
      } catch (e) {}
    } finally {
      setSyncing(false);
    }
  };

  // Load cloud data and dispatch to Web Worker game state
  const triggerCloudStateLoad = (data: CloudSaveData) => {
    // Send message to the UI to load cloudsave
    // We can trigger a custom window event or React callback
    const loadEvent = new CustomEvent("firebase-load-state", {
      detail: data,
    });
    window.dispatchEvent(loadEvent);
    setLastSynced(new Date());
  };

  const loginWithGoogle = async () => {
    setSyncing(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Popup Authentication failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    setSyncing(true);
    try {
      await signOut(auth);
      setLastSynced(null);
    } catch (err) {
      console.error("Failed to sign out:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Synchronize state actively (can be triggered by autosave loops)
  const saveStateToCloud = async (state: Omit<CloudSaveData, "userId">) => {
    const activeUser = userRef.current;
    if (!activeUser || syncing) return;

    const docRef = doc(db, "saves", activeUser.uid);
    try {
      setSyncing(true);
      // Ensure we preserve the createdAt timestamp to satisfy security rules (incoming().createdAt == existing().createdAt)
      let resolvedCreatedAt = saveCreatedAt;
      if (!resolvedCreatedAt) {
        // Fallback or read dynamically
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as CloudSaveData;
          resolvedCreatedAt = cloudData.createdAt || serverTimestamp();
          setSaveCreatedAt(resolvedCreatedAt);
        } else {
          resolvedCreatedAt = serverTimestamp();
          setSaveCreatedAt(resolvedCreatedAt);
        }
      }

      const payload: CloudSaveData = {
        userId: activeUser.uid,
        life: Number(state.life),
        totalLifeEarned: Number(state.totalLifeEarned),
        starsCount: Number(state.starsCount),
        purchasedAnimals: state.purchasedAnimals || {},
        purchasedUpgrades: state.purchasedUpgrades || [],
        planetLevel: Number(state.planetLevel),
        planetExp: Number(state.planetExp),
        clicksCount: Number(state.clicksCount),
        starClicksTriggered: Number(state.starClicksTriggered),
        secondsPlayed: Number(state.secondsPlayed),
        unlockedCosmetics: state.unlockedCosmetics || [],
        activeStarColor: state.activeStarColor || "default",
        activeAccessory: state.activeAccessory || "none",
        activeFrame: state.activeFrame || "default",
        activeMoonSkin: state.activeMoonSkin || "default",
        shootingStarsCount: Number(state.shootingStarsCount || 0),
        missionSetNumber: Number(state.missionSetNumber || 1),
        claimedMissionIds: state.claimedMissionIds || [],
        missionsCooldownEnd: state.missionsCooldownEnd !== undefined ? (state.missionsCooldownEnd ? Number(state.missionsCooldownEnd) : null) : null,
        prestigeCount: Number(state.prestigeCount || 0),
        moonsCount: Number(state.moonsCount || 0),
        constellations: (state as any).constellations || {},
        glitterDust: Number((state as any).glitterDust || 0),
        cosmeticRarityLevels: (state as any).cosmeticRarityLevels || {},
        blackHoleSize: Number((state as any).blackHoleSize || 1),
        galaxyShards: Number((state as any).galaxyShards || 0),
        createdAt: resolvedCreatedAt,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);

      // Save to public leaderboard on Firestore
      try {
        const leaderboardRef = doc(db, "leaderboard", activeUser.uid);
        const displayName = activeUser.displayName || (activeUser.email ? activeUser.email.split("@")[0] : "Anonymes Wesen");
        await setDoc(leaderboardRef, {
          userId: activeUser.uid,
          userName: displayName,
          totalLifeEarned: Number(state.totalLifeEarned || 0),
          prestigeCount: Number(state.prestigeCount || 0),
          updatedAt: serverTimestamp(),
        });
      } catch (lErr) {
        console.error("Leaderboard sync failed during active save:", lErr);
      }

      // Update state instantly so the UI draws the latest cloud stats inside the modal
      setCloudSaveFound(payload);
      setLastSynced(new Date());

      // Fetch fresh document to resolve high-fidelity server timestamp and save it in state
      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists()) {
        const freshData = freshSnap.data() as CloudSaveData;
        setSaveCreatedAt(freshData.createdAt || resolvedCreatedAt);
        setCloudSaveFound(freshData);
      }
    } catch (err) {
      console.error("Firestore Periodic Synchronization failed:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, `saves/${activeUser.uid}`);
      } catch (e) {}
    } finally {
      setSyncing(false);
    }
  };

  return {
    user,
    authLoading,
    syncing,
    lastSynced,
    loginWithGoogle,
    logout,
    cloudSaveFound,
    showConflictDialog,
    setShowConflictDialog,
    saveStateToCloud,
    forceCheckCloudSave: () => user && checkAndFetchCloudSave(user),
    forceLocalOverwriteCloud: () => user && uploadCurrentLocalState(user.uid),
    triggerCloudStateLoad,
  };
}
