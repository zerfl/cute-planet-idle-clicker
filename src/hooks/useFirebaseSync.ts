import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "../lib/firebase";
import { buildPublicProfile } from "../utils/publicProfile";
import {
  type RawSave,
  type SaveOwnerId,
  normalizeCloudTimestamp,
  readMeta,
  readSave,
  writeSave,
} from "../utils/persistence";

const resolveDisplayName = (user: User | null): string =>
  user?.displayName || (user?.email ? user.email.split("@")[0] : "Anonymes Wesen");

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
  zodiacLevels?: Record<string, number>;
  slummerGlassLevel?: number;
  catalystLevel?: number;
  doubleStellarLevel?: number;
  planetTask?: unknown;
  placedAnimals?: unknown[];
  animalLove?: Record<string, number>;
  animalLastPet?: Record<string, number>;
  bowlLastFed?: number;
  bowlFedMinutesCredited?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AccountSwitchPrompt {
  nextUserId: string;
  previousOwnerId: SaveOwnerId;
  previousLocalSave: RawSave;
}

const isMeaningfulSave = (save: RawSave | null) =>
  Boolean(save) &&
  ((Number(save?.totalLifeEarned) || 0) >= 100 || (Number(save?.secondsPlayed) || 0) >= 30);

const buildCloudPayload = (
  source: Record<string, unknown>,
  uid: string,
  createdAt: unknown,
): CloudSaveData => ({
  userId: uid,
  life: Number(source.life || 0),
  totalLifeEarned: Number(source.totalLifeEarned || 0),
  starsCount: Number(source.starsCount || 0),
  purchasedAnimals: (source.purchasedAnimals as Record<string, number>) || {},
  purchasedUpgrades: (source.purchasedUpgrades as string[]) || [],
  planetLevel: Number(source.planetLevel || 1),
  planetExp: Number(source.planetExp || 0),
  clicksCount: Number(source.clicksCount || 0),
  starClicksTriggered: Number(source.starClicksTriggered || 0),
  secondsPlayed: Number(source.secondsPlayed || 0),
  unlockedCosmetics: (source.unlockedCosmetics as string[]) || [],
  activeStarColor: (source.activeStarColor as string) || "default",
  activeAccessory: (source.activeAccessory as string) || "none",
  activeFrame: (source.activeFrame as string) || "default",
  activeMoonSkin: (source.activeMoonSkin as string) || "default",
  shootingStarsCount: Number(source.shootingStarsCount || 0),
  missionSetNumber: Number(source.missionSetNumber || 1),
  claimedMissionIds: (source.claimedMissionIds as string[]) || [],
  missionsCooldownEnd:
    source.missionsCooldownEnd !== undefined
      ? source.missionsCooldownEnd
        ? Number(source.missionsCooldownEnd)
        : null
      : null,
  prestigeCount: Number(source.prestigeCount || 0),
  moonsCount: Number(source.moonsCount || 0),
  constellations: (source.constellations as Record<string, number>) || {},
  glitterDust: Number(source.glitterDust || 0),
  cosmeticRarityLevels: (source.cosmeticRarityLevels as Record<string, string>) || {},
  blackHoleSize: Number(source.blackHoleSize || 1),
  galaxyShards: Number(source.galaxyShards || 0),
  zodiacLevels: (source.zodiacLevels as Record<string, number>) || {},
  slummerGlassLevel: Number(source.slummerGlassLevel || 1),
  catalystLevel: Number(source.catalystLevel || 0),
  doubleStellarLevel: Number(source.doubleStellarLevel || 0),
  planetTask: source.planetTask || null,
  placedAnimals: (source.placedAnimals as unknown[]) || [],
  animalLove: (source.animalLove as Record<string, number>) || {},
  animalLastPet: (source.animalLastPet as Record<string, number>) || {},
  bowlLastFed: Number(source.bowlLastFed || 0),
  bowlFedMinutesCredited: Number(source.bowlFedMinutesCredited || 0),
  createdAt,
  updatedAt: serverTimestamp(),
});

const toLocalMirror = (
  data: CloudSaveData,
  ownerId: SaveOwnerId,
  fallbackLastSavedAt?: number,
): RawSave => ({
  ...data,
  version: 2,
  ownerId,
  lastSavedAt: fallbackLastSavedAt ?? normalizeCloudTimestamp(data.updatedAt) ?? Date.now(),
  lastCloudUpdatedAt: normalizeCloudTimestamp(data.updatedAt),
});

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [cloudSaveFound, setCloudSaveFound] = useState<CloudSaveData | null>(null);
  const [accountSwitchPrompt, setAccountSwitchPrompt] = useState<AccountSwitchPrompt | null>(null);
  const [saveCreatedAt, setSaveCreatedAt] = useState<unknown>(null);

  const userRef = useRef<User | null>(null);
  const isSavingRef = useRef(false);
  const saveCreatedAtRef = useRef<unknown>(null);

  const updateSaveCreatedAt = (value: unknown) => {
    saveCreatedAtRef.current = value;
    setSaveCreatedAt(value);
  };

  const triggerCloudStateLoad = (data: CloudSaveData) => {
    window.dispatchEvent(
      new CustomEvent("firebase-load-state", {
        detail: data,
      }),
    );

    const updatedAt = normalizeCloudTimestamp(data.updatedAt);
    setLastSynced(updatedAt ? new Date(updatedAt) : new Date());
  };

  const syncLeaderboard = async (uid: string, payload: Record<string, unknown>) => {
    try {
      const leaderboardRef = doc(db, "leaderboard", uid);
      const displayName = resolveDisplayName(userRef.current);

      await setDoc(leaderboardRef, {
        userId: uid,
        userName: displayName,
        totalLifeEarned: Number(payload.totalLifeEarned || 0),
        prestigeCount: Number(payload.prestigeCount || 0),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Leaderboard sync failed:", error);
    }
  };

  const syncPublicProfile = async (uid: string, payload: Record<string, unknown>) => {
    try {
      const profileRef = doc(db, "profiles", uid);
      const displayName = resolveDisplayName(userRef.current);

      await setDoc(profileRef, {
        ...buildPublicProfile(payload, uid, displayName),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Profile sync failed:", error);
    }
  };

  const uploadCurrentLocalState = async (uid: string, sourceSave?: RawSave | null) => {
    const localSave = sourceSave ?? readSave(uid);
    if (!localSave) return;

    try {
      setSyncing(true);
      const docRef = doc(db, "saves", uid);
      const resolvedCreatedAt =
        saveCreatedAtRef.current || cloudSaveFound?.createdAt || serverTimestamp();
      const payload = buildCloudPayload(localSave, uid, resolvedCreatedAt);

      await setDoc(docRef, payload);
      await syncLeaderboard(uid, localSave);
      await syncPublicProfile(uid, localSave);

      setCloudSaveFound(payload);
      setLastSynced(new Date());

      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists()) {
        const freshData = freshSnap.data() as CloudSaveData;
        updateSaveCreatedAt(freshData.createdAt || resolvedCreatedAt);
        setCloudSaveFound(freshData);
        writeSave(uid, toLocalMirror(freshData, uid, Number(localSave.lastSavedAt) || Date.now()));
      } else {
        updateSaveCreatedAt(resolvedCreatedAt);
        writeSave(uid, {
          ...localSave,
          lastCloudUpdatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("Failed to upload local save:", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, `saves/${uid}`);
      } catch {}
    } finally {
      setSyncing(false);
    }
  };

  const resolveCurrentUserSave = async (currentUser: User) => {
    setSyncing(true);
    const localSave = readSave(currentUser.uid);
    const docRef = doc(db, "saves", currentUser.uid);

    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setCloudSaveFound(null);
        if (localSave) {
          await uploadCurrentLocalState(currentUser.uid, localSave);
        }
        return;
      }

      const cloudData = docSnap.data() as CloudSaveData;
      setCloudSaveFound(cloudData);
      updateSaveCreatedAt(cloudData.createdAt || null);

      const cloudUpdatedAt = normalizeCloudTimestamp(cloudData.updatedAt) ?? 0;
      if (cloudUpdatedAt > 0) {
        setLastSynced(new Date(cloudUpdatedAt));
      }

      if (!localSave) {
        triggerCloudStateLoad(cloudData);
        return;
      }

      const localUpdatedAt = Number(localSave.lastSavedAt) || 0;
      if (cloudUpdatedAt > localUpdatedAt) {
        triggerCloudStateLoad(cloudData);
        return;
      }

      if (cloudUpdatedAt > 0) {
        writeSave(currentUser.uid, {
          ...localSave,
          lastCloudUpdatedAt: cloudUpdatedAt,
        });
      }
    } catch (error) {
      console.error("Failed to check cloud save:", error);
      try {
        handleFirestoreError(error, OperationType.GET, `saves/${currentUser.uid}`);
      } catch {}
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const meta = readMeta();
      const previousOwnerId = meta.activeOwnerId;
      const previousSave =
        previousOwnerId !== (currentUser?.uid ?? null) ? readSave(previousOwnerId) : null;

      setUser(currentUser);
      userRef.current = currentUser;
      setAuthLoading(false);

      if (currentUser) {
        await resolveCurrentUserSave(currentUser);

        if (isMeaningfulSave(previousSave)) {
          setAccountSwitchPrompt({
            nextUserId: currentUser.uid,
            previousOwnerId,
            previousLocalSave: previousSave,
          });
        } else {
          setAccountSwitchPrompt(null);
        }
      } else {
        setCloudSaveFound(null);
        setAccountSwitchPrompt(null);
        updateSaveCreatedAt(null);
        setLastSynced(null);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setSyncing(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Popup Authentication failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    setSyncing(true);
    try {
      await signOut(auth);
      setLastSynced(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setSyncing(false);
    }
  };

  const saveStateToCloud = async (state: Omit<CloudSaveData, "userId"> & Partial<RawSave>) => {
    const activeUser = userRef.current;
    if (!activeUser || isSavingRef.current) return;
    isSavingRef.current = true;

    const docRef = doc(db, "saves", activeUser.uid);
    try {
      setSyncing(true);

      let resolvedCreatedAt = saveCreatedAtRef.current;
      if (!resolvedCreatedAt) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as CloudSaveData;
          resolvedCreatedAt = cloudData.createdAt || serverTimestamp();
          updateSaveCreatedAt(resolvedCreatedAt);
        } else {
          resolvedCreatedAt = serverTimestamp();
          updateSaveCreatedAt(resolvedCreatedAt);
        }
      }

      const payload = buildCloudPayload(state, activeUser.uid, resolvedCreatedAt);
      await setDoc(docRef, payload);
      await syncLeaderboard(activeUser.uid, state);
      await syncPublicProfile(activeUser.uid, state);

      setCloudSaveFound(payload);
      setLastSynced(new Date());

      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists()) {
        const freshData = freshSnap.data() as CloudSaveData;
        updateSaveCreatedAt(freshData.createdAt || resolvedCreatedAt);
        setCloudSaveFound(freshData);
        writeSave(
          activeUser.uid,
          toLocalMirror(freshData, activeUser.uid, Number(state.lastSavedAt) || Date.now()),
        );
      }
    } catch (error) {
      console.error("Firestore periodic synchronization failed:", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `saves/${activeUser.uid}`);
      } catch {}
    } finally {
      isSavingRef.current = false;
      setSyncing(false);
    }
  };

  const adoptPreviousLocalSave = async () => {
    const activeUser = userRef.current;
    const prompt = accountSwitchPrompt;
    if (!activeUser || !prompt) return;

    const migratedSave = writeSave(activeUser.uid, {
      ...prompt.previousLocalSave,
      ownerId: activeUser.uid,
      lastSavedAt: Number(prompt.previousLocalSave.lastSavedAt) || Date.now(),
      lastCloudUpdatedAt: normalizeCloudTimestamp(prompt.previousLocalSave.lastCloudUpdatedAt),
    });

    triggerCloudStateLoad({
      ...(migratedSave as unknown as CloudSaveData),
      userId: activeUser.uid,
      updatedAt: migratedSave.lastCloudUpdatedAt ?? migratedSave.lastSavedAt,
    });

    setAccountSwitchPrompt(null);
    await uploadCurrentLocalState(activeUser.uid, migratedSave);
  };

  return {
    user,
    authLoading,
    syncing,
    lastSynced,
    loginWithGoogle,
    logout,
    cloudSaveFound,
    accountSwitchPrompt,
    continueWithCurrentAccount: () => setAccountSwitchPrompt(null),
    adoptPreviousLocalSave,
    saveStateToCloud,
    forceCheckCloudSave: () => user && resolveCurrentUserSave(user),
    forceLocalOverwriteCloud: () => user && uploadCurrentLocalState(user.uid),
    triggerCloudStateLoad,
  };
}
