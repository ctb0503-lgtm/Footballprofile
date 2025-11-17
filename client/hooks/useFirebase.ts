import { useEffect, useState, useCallback } from 'react';
import { Auth, Firestore, User } from 'firebase/auth';
import {
  initializeFirebase,
  setupAuthStateListener,
  signInUser,
  saveProfileToFirestore,
  loadProfilesFromFirestore,
  deleteProfileFromFirestore
} from '@/services/firebaseService';
import { SavedProfile, ProfileInputs } from '@/types';

interface UseFirebaseReturn {
  auth: Auth | null;
  db: Firestore | null;
  userId: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  
  myProfiles: SavedProfile[];
  isLoadingProfiles: boolean;
  profilesError: string | null;
  
  saveProfile: (
    teamA: string,
    teamB: string,
    profileText: string,
    sources: any[],
    inputs: ProfileInputs
  ) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
}

export const useFirebase = (appId: string): UseFirebaseReturn => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [myProfiles, setMyProfiles] = useState<SavedProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // Initialize Firebase
  useEffect(() => {
    try {
      const { auth: authInstance, db: dbInstance } = initializeFirebase();
      setAuth(authInstance);
      setDb(dbInstance);

      if (authInstance) {
        const unsubscribe = setupAuthStateListener((user) => {
          if (user) {
            setUserId(user.uid);
            setIsAuthLoading(false);
          } else {
            setUserId(null);
            // Sign in anonymously
            signInUser()
              .catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                setAuthError("Firebase not fully configured");
                setIsAuthLoading(false);
              });
          }
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };
      } else {
        setAuthError("Firebase not available");
        setIsAuthLoading(false);
      }
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setAuthError("Could not initialize Firebase");
      setIsAuthLoading(false);
    }
  }, []);

  // Load profiles when user ID is available
  useEffect(() => {
    if (!userId || !db) return;

    setIsLoadingProfiles(true);
    const unsubscribe = loadProfilesFromFirestore(
      userId,
      appId,
      (profiles) => {
        setMyProfiles(profiles);
        setIsLoadingProfiles(false);
      },
      (error) => {
        console.error("Error loading profiles:", error);
        setProfilesError("Could not load profiles");
        setIsLoadingProfiles(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, db, appId]);

  // Save profile to Firestore
  const saveProfile = useCallback(
    async (
      teamA: string,
      teamB: string,
      profileText: string,
      sources: any[],
      inputs: ProfileInputs
    ) => {
      if (!userId || !db) {
        throw new Error("Not authenticated or database not initialized");
      }

      try {
        await saveProfileToFirestore(
          userId,
          appId,
          teamA,
          teamB,
          profileText,
          sources,
          inputs
        );
      } catch (error) {
        console.error("Error saving profile:", error);
        throw error;
      }
    },
    [userId, db, appId]
  );

  // Delete profile from Firestore
  const deleteProfile = useCallback(
    async (profileId: string) => {
      if (!userId || !db) {
        throw new Error("Not authenticated or database not initialized");
      }

      try {
        await deleteProfileFromFirestore(userId, appId, profileId);
      } catch (error) {
        console.error("Error deleting profile:", error);
        throw error;
      }
    },
    [userId, db, appId]
  );

  const isAuthenticated = !!userId;

  return {
    auth,
    db,
    userId,
    isAuthenticated,
    isAuthLoading,
    authError,
    myProfiles,
    isLoadingProfiles,
    profilesError,
    saveProfile,
    deleteProfile
  };
};
