import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native'; // Import Platform

// Import functions from the standard Firebase web Auth SDK
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
} from 'firebase/auth';

// Import functions/module from @react-native-firebase/auth
import nativeAuth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Import the initialized Firebase app instances from your firebaseConfig
// Your firebaseConfig.ts should export 'auth' and 'db' which are
// the correct SDK instances based on the platform.
import { auth } from '../firebaseConfig'; // This will be WebAuth or FirebaseAuthTypes.Module
import { cleanUpData } from './cleanUpData';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
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
                };
                set({ user, isAuthenticated: true, isLoading: false });
              } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
              cleanUpData();
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
                };
                set({ user, isAuthenticated: true, isLoading: false });
              } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
              }
              cleanUpData();
            });
          }
          return unsubscribe;
        } catch (error: any) {
          console.log('Error initializing auth:', error.code, error.message);
          set({
            error: error.message || "Couldn't initialize authentication",
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
            };
            set({ user, isAuthenticated: true, isLoading: false });
            cleanUpData();
          }
        } catch (error: any) {
          console.log('Error logging in:', error.code, error.message);
          set({
            error: error.message.replace(/\[.*?\]/g, '').trim(),
            isLoading: false,
          });
        }
      },

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
            }
          } else {
            userCredential = await nativeAuth().createUserWithEmailAndPassword(email, password); // Corrected
            if (userCredential.user) {
              await userCredential.user.updateProfile({ displayName });
            }
          }

          if (userCredential.user) {
            const user: User = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName, // Use the provided displayName after update
              photoURL: null,
            };
            set({ user, isAuthenticated: true, isLoading: false });
            cleanUpData();
          } else {
            set({ error: 'Registration failed: User not created', isLoading: false });
          }
        } catch (error: any) {
          console.log('Error registering:', error.code, error.message);
          set({ error: error.message.replace(/\[.*?\]/g, '').trim(), isLoading: false });
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
          set({ error: error.message, isLoading: false });
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
          set({ error: error.message, isLoading: false });
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
            currentUser = nativeAuth().currentUser; // Corrected
          }

          if (!currentUser) throw new Error('User not authenticated');

          if (Platform.OS === 'web') {
            await webDeleteUser(currentUser as WebUser);
          } else {
            await currentUser.delete();
          }

          set({ user: null, isAuthenticated: false, isLoading: false });
          cleanUpData();
        } catch (error: any) {
          console.log('Error deleting account:', error.code, error.message);
          set({ error: error.message, isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          if (Platform.OS === 'web') {
            // Use web SDK on web
            await webSendPasswordResetEmail(auth as WebAuth, email);
          } else {
            // Use @react-native-firebase on mobile
            await nativeAuth().sendPasswordResetEmail(email); // Corrected
          }
          set({ isLoading: false });
        } catch (error: any) {
          console.log('Error resetting password:', error.code, error.message);
          set({ error: error.message, isLoading: false });
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
