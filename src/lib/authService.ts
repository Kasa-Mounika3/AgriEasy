import {
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  confirmPasswordReset,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export const PASSWORD_MIN_LENGTH = 8;

export const languages = [
  'English',
  'Hindi',
  'Marathi',
  'Punjabi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Bengali',
  'Gujarati',
  'Malayalam',
  'Odia',
  'Assamese',
] as const;

export interface AuthProfileInput {
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  language: string;
  photoURL?: string | null;
}

export function logAuthAttempt(method: 'email-password-register' | 'email-password-login' | 'google') {
  console.info('[Auth] Selected sign-in method', { method });
}

export function getFriendlyAuthError(error: any) {
  console.error('[Auth] Firebase error', {
    code: error?.code,
    message: error?.message,
    name: error?.name,
  });

  if (error?.code === 'auth/operation-not-allowed') {
    return 'This login method is not enabled in Firebase Authentication.';
  }

  if (error?.code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Firebase Authentication.';
  }

  if (error?.code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please login instead.';
  }

  if (error?.code === 'auth/invalid-credential') {
    return 'The email/phone and password combination is incorrect.';
  }

  return error?.message || 'Authentication failed. Please try again.';
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(normalizePhone(value));
}

export async function ensureUserProfile(user: User, profile?: Partial<AuthProfileInput>) {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  if (existing.exists() && !profile) {
    return;
  }

  const email = normalizeEmail(profile?.email || user.email || '');
  const phone = profile?.phone ? normalizePhone(profile.phone) : '';
  const name = profile?.name?.trim() || user.displayName || 'AgriEasy Farmer';
  const state = profile?.state || 'Telangana';
  const district = profile?.district || 'Hyderabad';
  const language = profile?.language || 'English';

  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName: name,
      email,
      phone,
      photoURL: profile?.photoURL ?? user.photoURL ?? null,
      location: { state, district },
      language,
      provider: user.providerData[0]?.providerId || 'password',
      createdAt: existing.exists() ? existing.data().createdAt : Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (phone && email) {
    await setDoc(
      doc(db, 'phone_login_index', phone),
      {
        uid: user.uid,
        email,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  }
}

async function resolveEmailOrPhone(identifier: string) {
  const value = identifier.trim();
  if (isEmail(value)) return normalizeEmail(value);

  const phone = normalizePhone(value);
  if (!isValidPhone(phone)) {
    throw new Error('Enter a valid email address or 10-digit Indian mobile number.');
  }

  const lookup = await getDoc(doc(db, 'phone_login_index', phone));
  if (!lookup.exists()) {
    throw new Error('No AgriEasy account is linked to this phone number.');
  }

  return lookup.data().email as string;
}

export async function registerWithEmailPassword(profile: AuthProfileInput, password: string) {
  logAuthAttempt('email-password-register');
  const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(profile.email), password);
  await updateProfile(credential.user, {
    displayName: profile.name.trim(),
    photoURL: profile.photoURL || undefined,
  });
  await ensureUserProfile(credential.user, profile);
  return credential.user;
}

export async function loginWithEmailOrPhone(identifier: string, password: string) {
  logAuthAttempt('email-password-login');
  const email = await resolveEmailOrPhone(identifier);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function continueWithGoogle(profile?: Partial<AuthProfileInput>) {
  logAuthAttempt('google');
  const credential = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
  await ensureUserProfile(credential.user, {
    name: profile?.name || credential.user.displayName || '',
    email: credential.user.email || profile?.email || '',
    phone: profile?.phone || '',
    state: profile?.state || 'Telangana',
    district: profile?.district || 'Hyderabad',
    language: profile?.language || 'English',
    photoURL: credential.user.photoURL,
  });
  return credential.user;
}

export async function sendResetLink(email: string) {
  const origin = window.location.origin;

  await sendPasswordResetEmail(auth, normalizeEmail(email), {
    url: `${origin}/reset-password`,
    handleCodeInApp: true,
  });
}

export async function verifyResetCode(oobCode: string) {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function completePasswordReset(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}
