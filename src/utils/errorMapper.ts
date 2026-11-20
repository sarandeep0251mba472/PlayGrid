import { FirebaseError } from 'firebase/app';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  // Auth errors
  'auth/invalid-credential': 'Incorrect email or password. Please verify your credentials and try again.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/user-not-found': 'No PlayGrid account was found with this email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters with letters and numbers.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/popup-closed-by-user': 'Google sign-in popup was closed before completing authentication.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups for PlayGrid.',
  'auth/cancelled-popup-request': 'Sign-in request was cancelled. Please try again.',
  'auth/too-many-requests': 'Too many attempts detected. Please wait a few minutes before trying again.',
  'auth/requires-recent-login': 'For your security, please re-enter your password or sign in again before deleting your account.',
  'auth/network-request-failed': 'Network error. Please check your internet connection and retry.',
  'auth/user-disabled': 'This account has been deactivated by a PlayGrid administrator.',
  'auth/operation-not-allowed':
    'Email/Password sign-in is not yet enabled in Firebase Console. Enable it under Authentication > Sign-in method or continue with Google.',
  'auth/unauthorized-domain':
    'This domain is not yet authorized in Firebase Console > Authentication > Settings > Authorized domains.',

  // Firestore errors
  'permission-denied': 'You do not have permission for this action. Make sure your email is verified and your account is active.',
  'unavailable': 'Firestore is temporarily unreachable. Please check your network connection.',
  'deadline-exceeded': 'The request timed out. Please try again.',
  'not-found': 'The requested match or profile no longer exists.',
  'already-exists': 'This record already exists.',
  'resource-exhausted': 'Daily Firebase quota limit reached. Please try again later.',
  'failed-precondition': 'This match state changed just before your update. Refreshing latest slots.',

  // Storage errors
  'storage/unauthorized': 'You are not authorized to upload files, or your email is not verified yet.',
  'storage/canceled': 'Upload cancelled.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please try a smaller image.',
  'storage/unknown': 'Could not upload avatar. Verify Firebase Storage is enabled in your project.',
};

export function mapFirebaseError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  if (error instanceof FirebaseError) {
    const cleanCode = error.code.replace('firestore/', '');
    if (FIREBASE_ERROR_MAP[error.code]) return FIREBASE_ERROR_MAP[error.code];
    if (FIREBASE_ERROR_MAP[cleanCode]) return FIREBASE_ERROR_MAP[cleanCode];
    return error.message || fallback;
  }

  if (error instanceof Error) {
    // Check if it's our structured FirestoreErrorInfo JSON string
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission')) {
          return FIREBASE_ERROR_MAP['permission-denied'];
        }
        return parsed.error;
      }
    } catch {
      // Not JSON
    }

    for (const [code, msg] of Object.entries(FIREBASE_ERROR_MAP)) {
      if (error.message.includes(code)) {
        return msg;
      }
    }
    return error.message || fallback;
  }

  return fallback;
}
