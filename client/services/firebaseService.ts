import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  Auth,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  serverTimestamp,
  setLogLevel,
  Firestore,
  Unsubscribe,
} from "firebase/firestore";
import { SavedProfile, ProfileInputs } from "@/types";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isInitialized = false;

const FIREBASE_CONFIG_PLACEHOLDER = {
  apiKey: "AIzaSyDemo",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

export const initializeFirebase = () => {
  if (isInitialized) {
    return { auth, db };
  }

  try {
    const firebaseConfig =
      typeof (window as any).__firebase_config !== "undefined"
        ? JSON.parse((window as any).__firebase_config)
        : FIREBASE_CONFIG_PLACEHOLDER;

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setLogLevel("debug");
    isInitialized = true;

    return { auth, db };
  } catch (e) {
    console.error("Error initializing Firebase:", e);
    isInitialized = false;
    return { auth: null, db: null };
  }
};

export const getFirebaseInstances = () => {
  if (!auth || !db) {
    throw new Error("Firebase not initialized");
  }
  return { auth, db };
};

export const setupAuthStateListener = (
  callback: (user: User | null) => void,
): Unsubscribe | null => {
  if (!auth) return null;

  try {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  } catch (error) {
    console.error("Error setting up auth listener:", error);
    return null;
  }
};

export const signInUser = async (token?: string) => {
  if (!auth) throw new Error("Firebase auth not initialized");

  try {
    if (token) {
      return await signInWithCustomToken(auth, token);
    } else {
      return await signInAnonymously(auth);
    }
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const saveProfileToFirestore = async (
  userId: string,
  appId: string,
  teamA: string,
  teamB: string,
  profileText: string,
  sources: any[],
  inputs: ProfileInputs,
) => {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const profilesCollection = collection(
      db,
      `artifacts/${appId}/users/${userId}/profiles`,
    );

    const profileToSave = {
      teamA,
      teamB,
      profileText,
      sources,
      createdAt: serverTimestamp(),
      inputs,
    };

    const docRef = await addDoc(profilesCollection, profileToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error saving profile:", error);
    throw error;
  }
};

export const loadProfilesFromFirestore = (
  userId: string,
  appId: string,
  onUpdate: (profiles: SavedProfile[]) => void,
  onError: (error: Error) => void,
): Unsubscribe | null => {
  if (!db) {
    onError(new Error("Firestore not initialized"));
    return null;
  }

  try {
    const profilesCollection = collection(
      db,
      `artifacts/${appId}/users/${userId}/profiles`,
    );

    return onSnapshot(
      profilesCollection,
      (snapshot) => {
        const profilesData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as SavedProfile,
        );

        profilesData.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );

        onUpdate(profilesData);
      },
      (error) => {
        console.error("Error loading profiles:", error);
        onError(error as Error);
      },
    );
  } catch (error) {
    onError(error as Error);
    return null;
  }
};

export const deleteProfileFromFirestore = async (
  userId: string,
  appId: string,
  profileId: string,
) => {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const docRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/profiles`,
      profileId,
    );
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
};
