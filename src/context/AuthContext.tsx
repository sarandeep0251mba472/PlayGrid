import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  AvailabilityWindow,
  SkillLevel,
  SportType,
  UserPreferences,
  UserProfile,
} from '../types';
import { BLUEPRINT_LIMITS, sanitizeText } from '../utils/validation';
import { useTheme } from './ThemeContext';

const BOOTSTRAPPED_ADMIN_EMAIL = 'sarandeep.0251mba472@dgu.ac.in';
const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes inactivity auto-logout

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  preferredSports: SportType[];
  skillLevel: SkillLevel;
  rememberMe: boolean;
}

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isAccountDeactivated: boolean;
  registerWithEmail: (input: RegisterInput) => Promise<void>;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  updateUserProfile: (updates: {
    fullName?: string;
    photoURL?: string;
    university?: string;
    preferredSports?: SportType[];
    skillLevel?: SkillLevel;
    bio?: string;
    availability?: AvailabilityWindow;
    preferences?: UserPreferences;
  }) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureUserDocuments(user: User, extra?: {
  fullName?: string;
  preferredSports?: SportType[];
  skillLevel?: SkillLevel;
}): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const profileRef = doc(db, 'player_profiles', user.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }

  const cleanName = sanitizeText(
    extra?.fullName || user.displayName || user.email?.split('@')[0] || 'DGU Student',
    BLUEPRINT_LIMITS.FULL_NAME_MAX
  );
  const safeName = cleanName.length >= 2 ? cleanName : 'DGU Student';
  const cleanPhoto = sanitizeText(user.photoURL || '', BLUEPRINT_LIMITS.PHOTO_URL_MAX);
  const email = sanitizeText(user.email || '', BLUEPRINT_LIMITS.EMAIL_MAX);

  if (!existingSnap.exists()) {
    const isBootAdmin =
      email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified;
    const sports: SportType[] =
      extra?.preferredSports && extra.preferredSports.length > 0
        ? extra.preferredSports.slice(0, 6)
        : ['Cricket', 'Badminton'];
    const skill: SkillLevel = extra?.skillLevel || 'Intermediate';

    try {
      const batch = writeBatch(db);
      batch.set(userRef, {
        uid: user.uid,
        fullName: safeName,
        email,
        photoURL: cleanPhoto,
        role: isBootAdmin ? 'admin' : 'student',
        status: 'active',
        university: 'DBS Global University',
        preferredSports: sports,
        skillLevel: skill,
        bio: '',
        availability: 'Evenings',
        gamesPlayedCount: 0,
        gamesHostedCount: 0,
        preferences: {
          notifications: true,
          theme: 'light',
        },
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      batch.set(profileRef, {
        uid: user.uid,
        fullName: safeName,
        photoURL: cleanPhoto,
        status: 'active',
        university: 'DBS Global University',
        preferredSports: sports,
        skillLevel: skill,
        bio: '',
        availability: 'Evenings',
        gamesPlayedCount: 0,
        gamesHostedCount: 0,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  } else {
    try {
      const batch = writeBatch(db);
      batch.update(userRef, {
        lastLoginAt: serverTimestamp(),
      });
      await batch.commit();
    } catch {
      // Non-blocking login timestamp refresh
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const { setTheme } = useTheme();
  const profileUnsubRef = useRef<Unsubscribe | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        await ensureUserDocuments(user);
      } catch {
        // Error already logged in ensureUserDocuments; still attach listener
      }

      const userDocRef = doc(db, 'users', user.uid);
      profileUnsubRef.current = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUserProfile(profile);
            if (profile.preferences?.theme) {
              setTheme(profile.preferences.theme);
            }
          } else {
            setUserProfile(null);
          }
          setAuthReady(true);
        },
        (error) => {
          setAuthReady(true);
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch {
            // Logged
          }
        }
      );
    });

    return () => {
      unsubAuth();
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
      }
    };
  }, [setTheme]);

  // Automatic logout on session inactivity expiration
  useEffect(() => {
    if (!firebaseUser) return;

    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_IDLE_TIMEOUT_MS) {
        void signOut(auth);
      }
    }, 60 * 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.clearInterval(interval);
    };
  }, [firebaseUser]);

  const registerWithEmail = useCallback(async (input: RegisterInput) => {
    await setPersistence(
      auth,
      input.rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password
    );
    const cleanName = sanitizeText(input.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX);
    await updateProfile(cred.user, { displayName: cleanName });
    await sendEmailVerification(cred.user);
    await ensureUserDocuments(cred.user, {
      fullName: cleanName,
      preferredSports: input.preferredSports,
      skillLevel: input.skillLevel,
    });
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    []
  );

  const loginWithGoogle = useCallback(async (rememberMe = true) => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshVerificationStatus = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    await auth.currentUser.getIdToken(true);
    setFirebaseUser({ ...auth.currentUser } as User);
    return auth.currentUser.emailVerified;
  }, []);

  const updateUserProfile = useCallback(
    async (updates: {
      fullName?: string;
      photoURL?: string;
      university?: string;
      preferredSports?: SportType[];
      skillLevel?: SkillLevel;
      bio?: string;
      availability?: AvailabilityWindow;
      preferences?: UserPreferences;
    }) => {
      if (!auth.currentUser || !userProfile) {
        throw new Error('You must be signed in to update your profile.');
      }
      const uid = auth.currentUser.uid;
      const userPayload: Record<string, unknown> = {};
      const publicPayload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.fullName !== undefined) {
        const clean = sanitizeText(updates.fullName, BLUEPRINT_LIMITS.FULL_NAME_MAX);
        if (clean.length < 2) throw new Error('Full name must be at least 2 characters.');
        userPayload.fullName = clean;
        publicPayload.fullName = clean;
      }
      if (updates.photoURL !== undefined) {
        const clean = sanitizeText(updates.photoURL, BLUEPRINT_LIMITS.PHOTO_URL_MAX);
        userPayload.photoURL = clean;
        publicPayload.photoURL = clean;
      }
      if (updates.university !== undefined) {
        const clean = sanitizeText(updates.university, BLUEPRINT_LIMITS.UNIVERSITY_MAX) || 'DBS Global University';
        userPayload.university = clean;
        publicPayload.university = clean;
      }
      if (updates.preferredSports !== undefined) {
        if (updates.preferredSports.length === 0) {
          throw new Error('Select at least one sport.');
        }
        const sports = updates.preferredSports.slice(0, 6);
        userPayload.preferredSports = sports;
        publicPayload.preferredSports = sports;
      }
      if (updates.skillLevel !== undefined) {
        userPayload.skillLevel = updates.skillLevel;
        publicPayload.skillLevel = updates.skillLevel;
      }
      if (updates.bio !== undefined) {
        const clean = sanitizeText(updates.bio, BLUEPRINT_LIMITS.BIO_MAX);
        userPayload.bio = clean;
        publicPayload.bio = clean;
      }
      if (updates.availability !== undefined) {
        userPayload.availability = updates.availability;
        publicPayload.availability = updates.availability;
      }
      if (updates.preferences !== undefined) {
        userPayload.preferences = updates.preferences;
        setTheme(updates.preferences.theme);
      }

      try {
        const batch = writeBatch(db);
        if (Object.keys(userPayload).length > 0) {
          batch.update(doc(db, 'users', uid), userPayload);
        }
        batch.update(doc(db, 'player_profiles', uid), publicPayload);
        await batch.commit();

        if (updates.fullName !== undefined || updates.photoURL !== undefined) {
          await updateProfile(auth.currentUser, {
            displayName: (userPayload.fullName as string) ?? auth.currentUser.displayName,
            photoURL: (userPayload.photoURL as string) ?? auth.currentUser.photoURL,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    },
    [setTheme, userProfile]
  );

  const changeUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No authenticated email account found.');
      }
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
    },
    []
  );

  const deleteAccount = useCallback(async (currentPassword?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found.');

    const usesPassword = user.providerData.some((p) => p.providerId === 'password');
    if (usesPassword) {
      if (!currentPassword || !user.email) {
        throw new Error('Please enter your current password to confirm account deletion.');
      }
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    } else {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    }

    const uid = user.uid;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'player_profiles', uid));
      batch.delete(doc(db, 'users', uid));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }

    await deleteUser(user);
  }, []);

  const isEmailVerified = Boolean(firebaseUser?.emailVerified);
  const isAdmin =
    Boolean(userProfile?.role === 'admin') ||
    Boolean(
      firebaseUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
        firebaseUser?.emailVerified
    );
  const isAccountDeactivated = Boolean(userProfile?.status === 'deactivated');

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authReady,
        isEmailVerified,
        isAdmin,
        isAccountDeactivated,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        resendVerificationEmail,
        refreshVerificationStatus,
        updateUserProfile,
        changeUserPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
