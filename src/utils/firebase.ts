import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in using Google Auth Provider
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('[Firebase Auth] Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Error logging out:', error);
  }
}

/**
 * Save / sync full user progress state to Firestore
 */
export async function syncUserDataToCloud(
  uid: string,
  payload: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    stats: any;
    completedLevels: any;
    unlockedSkins: any;
    activeSkin: any;
    achievements: any;
    puzzleProgress?: any;
  }
): Promise<void> {
  if (!uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...payload,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Failed to sync user progress:', error);
  }
}

/**
 * Load user progress state from Firestore
 */
export async function loadUserDataFromCloud(uid: string): Promise<any | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('[Firestore] Failed to load user data:', error);
  }
  return null;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalStars: number;
  totalCoins: number;
  gamesWon: number;
  updatedAt: string;
}

/**
 * Post score to global Firestore Leaderboard
 */
export async function submitGlobalLeaderboardScore(
  user: User,
  stats: any,
  totalStars: number
): Promise<void> {
  if (!user) return;
  try {
    const leaderRef = doc(db, 'leaderboard', user.uid);
    await setDoc(
      leaderRef,
      {
        uid: user.uid,
        displayName: user.displayName || 'Maze Master Player',
        photoURL: user.photoURL || '',
        totalStars,
        totalCoins: stats.totalCoins || 0,
        gamesWon: stats.gamesWon || 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Error submitting leaderboard score:', err);
  }
}

/**
 * Fetch top global leaderboard scores from Firestore
 */
export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('totalStars', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    const list: LeaderboardEntry[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as LeaderboardEntry);
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Error fetching leaderboard:', err);
    return [];
  }
}
