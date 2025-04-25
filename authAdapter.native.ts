import nativeAuth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

type Unsub = () => void;
type User = FirebaseAuthTypes.User;
type UserCredential = FirebaseAuthTypes.UserCredential;

export function onAuthStateChanged(
  cb: (user: User | null) => void
): Unsub {
  return nativeAuth().onAuthStateChanged(cb);
}

export function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  return nativeAuth().signInWithEmailAndPassword(email, password);
}

export function signUp(
  email: string,
  password: string
): Promise<UserCredential> {
  return nativeAuth().createUserWithEmailAndPassword(email, password);
}

export function signOut(): Promise<void> {
  return nativeAuth().signOut();
}

export function sendPasswordResetEmail(
  email: string
): Promise<void> {
  return nativeAuth().sendPasswordResetEmail(email);
}

export function updateProfile(data: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> {
  const user = nativeAuth().currentUser;
  if (!user) return Promise.reject("Not authenticated");
  return user.updateProfile(data);
}

export function updateEmail(email: string): Promise<void> {
  const user = nativeAuth().currentUser;
  if (!user) return Promise.reject("Not authenticated");
  return user.updateEmail(email);
}

export function sendEmailVerification(): Promise<void> {
  const user = nativeAuth().currentUser;
  if (!user) return Promise.reject("Not authenticated");
  return user.sendEmailVerification();
}

export function deleteUser(): Promise<void> {
  const user = nativeAuth().currentUser;
  if (!user) return Promise.reject("Not authenticated");
  return user.delete();
}
