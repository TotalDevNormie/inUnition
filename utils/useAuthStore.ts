import nativeAuth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  onAuthStateChanged as webOnAuthStateChanged,
  signInWithEmailAndPassword as webSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as webCreateUserWithEmailAndPassword,
  updateProfile as webUpdateProfile,
  updateEmail as webUpdateEmail,
  signOut as webSignOut,
  sendPasswordResetEmail as webSendPasswordResetEmail,
  deleteUser as webDeleteUser,
  Auth as WebAuth,
  User as WebUser,
  sendEmailVerification as webSendEmailVerification,
} from 'firebase/auth';
import { Platform } from 'react-native'; // Import Platform
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Import functions from the standard Firebase web Auth SDK

// Import functions/module from @react-native-firebase/auth

// Import the initialized Firebase app instances from your firebaseConfig
// Your firebaseConfig.ts should export 'auth' and 'db' which are
// the correct SDK instances based on the platform.
import { auth } from '../firebaseConfig'; // This will be WebAuth or FirebaseAuthTypes.Module
import { cleanUpData } from './cleanUpData';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<(() => void) | undefined>;
}

const storage = new MMKV();

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

function getCleanFirebaseErrorMessage(error: any): string {
  const errorCode = error.code.replace('auth/', '');

  console.log('errorCode', errorCode);

  if (!errorCode) {
    return 'An unknown error occurred';
  }

  const errorMessages: Record<string, string> = {
    'invalid-email': 'Please enter a valid email address',
    'invalid-credential': 'Email or password is incorrect',
    'user-disabled': 'This account has been disabled',
    'user-not-found': 'No account found with this email',
    'wrong-password': 'Incorrect password',
    'email-already-in-use': 'This email is already registered',
    'weak-password': 'Password should be at least 6 characters',
    'operation-not-allowed': 'This email is already registered',
    'popup-closed-by-user': 'Sign-in popup was closed before completing the operation',
    'network-request-failed': 'Network error. Please check your connection',
  };

  return errorMessages[errorCode] || `Error: ${errorCode}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          let unsubscribe;
          if (Platform.OS === 'web') {
            // Use web SDK on web
            unsubscribe = webOnAuthStateChanged(auth as WebAuth, (firebaseUser) => {
              if (firebaseUser) {
                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  emailVerified: firebaseUser.emailVerified,
                };
                set({ user, isAuthenticated: true, isLoading: false });
              } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
            });
          } else {
            // Use @react-native-firebase on mobile
            unsubscribe = nativeAuth().onAuthStateChanged((firebaseUser) => {
              // Corrected
              if (firebaseUser) {
                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  emailVerified: firebaseUser.emailVerified,
                };
                set({ user, isAuthenticated: true, isLoading: false });
              } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
            });
          }
          return unsubscribe;
        } catch (error: any) {
          console.log('Error initializing auth:', error.code, error.message);
          set({
            error: getCleanFirebaseErrorMessage(error),
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          let userCredential;
          if (Platform.OS === 'web') {
            // Use web SDK on web
            userCredential = await webSignInWithEmailAndPassword(auth as WebAuth, email, password);
          } else {
            // Use @react-native-firebase on mobile
            userCredential = await nativeAuth().signInWithEmailAndPassword(email, password); // Corrected
          }

          if (userCredential.user) {
            const user: User = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
              emailVerified: userCredential.user.emailVerified,
            };
            if (get().isAuthenticated) cleanUpData();
            set({ user, isAuthenticated: true, isLoading: false });
          }
        } catch (error: any) {
          console.log('Error logging in:', error.code, error.message);
          set({
            error: getCleanFirebaseErrorMessage(error),
            isLoading: false,
          });
        }
      },

      // In your register function in useAuthStore.ts
      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          let userCredential;
          if (Platform.OS === 'web') {
            userCredential = await webCreateUserWithEmailAndPassword(
              auth as WebAuth,
              email,
              password
            );
            if (userCredential.user) {
              await webUpdateProfile(userCredential.user as WebUser, { displayName });

              // Send verification email
              await webSendEmailVerification(userCredential.user as WebUser);
            }
          } else {
            userCredential = await nativeAuth().createUserWithEmailAndPassword(email, password);
            if (userCredential.user) {
              await userCredential.user.updateProfile({ displayName });

              // Send verification email
              await userCredential.user.sendEmailVerification();
            }
          }

          if (userCredential.user) {
            const user: User = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName,
              photoURL: null,
              emailVerified: false,
            };
            if (get().isAuthenticated) cleanUpData();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ error: 'Registration failed: User not created', isLoading: false });
          }
        } catch (error: any) {
          console.log('Error registering:', error.code, error.message);
          set({ error: getCleanFirebaseErrorMessage(error), isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          if (Platform.OS === 'web') {
            // Use web SDK on web
            await webSignOut(auth as WebAuth);
          } else {
            // Use @react-native-firebase on mobile
            await nativeAuth().signOut(); // Corrected
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
          cleanUpData();
        } catch (error: any) {
          console.log('Error logging out:', error.code, error.message);
          set({ error: getCleanFirebaseErrorMessage(error), isLoading: false });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          let currentUser;
          if (Platform.OS === 'web') {
            // Use web SDK on web
            currentUser = (auth as WebAuth).currentUser;
          } else {
            // Use @react-native-firebase on mobile
            currentUser = nativeAuth().currentUser; // Corrected
          }

          if (!currentUser) throw new Error('User not authenticated');

          if (Platform.OS === 'web') {
            await webUpdateProfile(currentUser as WebUser, {
              displayName: data.displayName || currentUser.displayName,
              photoURL: data.photoURL || currentUser.photoURL,
            });

            if (data.email && data.email !== currentUser.email) {
              await webUpdateEmail(currentUser as WebUser, data.email);
            }
          } else {
            await currentUser.updateProfile({
              displayName: data.displayName || currentUser.displayName,
              photoURL: data.photoURL || currentUser.photoURL,
            });

            if (data.email && data.email !== currentUser.email) {
              await currentUser.updateEmail(data.email);
            }
          }

          const updatedUser = { ...get().user, ...data } as User;
          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          console.log('Error updating profile:', error.code, error.message);
          set({ error: getCleanFirebaseErrorMessage(error), isLoading: false });
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          let currentUser;
          if (Platform.OS === 'web') {
            // Use web SDK on web
            currentUser = (auth as WebAuth).currentUser;
          } else {
            // Use @react-native-firebase on mobile
            currentUser = nativeAuth().currentUser;
          }

          if (!currentUser) throw new Error('User not authenticated');

          if (Platform.OS === 'web') {
            await webDeleteUser(currentUser as WebUser);
          } else {
            await currentUser.delete();
          }

          if (get().isAuthenticated) cleanUpData();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
          console.log('Error deleting account:', error.code, error.message);
          set({ error: error.message, isLoading: false });
        }
      },
      sendEmailVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          let currentUser;
          if (Platform.OS === 'web') {
            // Use web SDK on web
            currentUser = (auth as WebAuth).currentUser;
            if (!currentUser) throw new Error('User not authenticated');

            // Import the function from firebase/auth
            await webSendEmailVerification(currentUser as WebUser);
          } else {
            // Use @react-native-firebase on mobile
            currentUser = nativeAuth().currentUser;
            if (!currentUser) throw new Error('User not authenticated');

            await currentUser.sendEmailVerification();
          }
          set({ isLoading: false });
        } catch (error: any) {
          console.log('Error sending verification email:', error.code, error.message);
          set({ error: getCleanFirebaseErrorMessage(error), isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          if (Platform.OS === 'web') {
            await webSendPasswordResetEmail(auth as WebAuth, email);
          } else {
            await nativeAuth().sendPasswordResetEmail(email);
          }
          set({ isLoading: false });
        } catch (error: any) {
          console.log('Error resetting password:', error.code, error.message);
          set({ error: getCleanFirebaseErrorMessage(error), isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
