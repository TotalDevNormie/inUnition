import {
  onAuthStateChanged as webOnAuthStateChanged,
  signInWithEmailAndPassword as webSignIn,
  createUserWithEmailAndPassword as webSignUp,
  signOut as webSignOut,
  sendPasswordResetEmail as webSendPasswordReset,
  updateProfile as webUpdateProfile,
  updateEmail as webUpdateEmail,
  sendEmailVerification as webSendEmailVerification,
  deleteUser as webDeleteUser,
  User as WebUser,
  Auth as WebAuth,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

type Unsub = () => void;

export function onAuthStateChanged(cb: (user: WebUser | null) => void): Unsub {
  return webOnAuthStateChanged(auth as WebAuth, cb);
}

export function signIn(email: string, password: string) {
  return webSignIn(auth as WebAuth, email, password);
}

export function signUp(email: string, password: string) {
  return webSignUp(auth as WebAuth, email, password);
}

export function signOut() {
  return webSignOut(auth as WebAuth);
}

export function sendPasswordResetEmail(email: string) {
  return webSendPasswordReset(auth as WebAuth, email);
}

export function updateProfile(data: { displayName?: string; photoURL?: string }) {
  const u = (auth as WebAuth).currentUser;
  if (!u) return Promise.reject('Not authenticated');
  return webUpdateProfile(u, data);
}

export function updateEmail(email: string) {
  const u = (auth as WebAuth).currentUser;
  if (!u) return Promise.reject('Not authenticated');
  return webUpdateEmail(u, email);
}

export function sendEmailVerification() {
  const u = (auth as WebAuth).currentUser;
  if (!u) return Promise.reject('Not authenticated');
  return webSendEmailVerification(u);
}

export function deleteUser() {
  const u = (auth as WebAuth).currentUser;
  if (!u) return Promise.reject('Not authenticated');
  return webDeleteUser(u);
}
