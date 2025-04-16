import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
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
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
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
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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
          return unsubscribe;
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
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
          set({ error: error.message, isLoading: false });
        }
      },

      register: async (
        email: string,
        password: string,
        displayName: string,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          // Update profile with display name
          await firebaseUpdateProfile(userCredential.user, { displayName });
          const user: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName,
            photoURL: null,
          };
          set({ user, isAuthenticated: true, isLoading: false });
          cleanUpData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false, isLoading: false });
          cleanUpData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error('User not authenticated');

          await firebaseUpdateProfile(currentUser, {
            displayName: data.displayName || currentUser.displayName,
            photoURL: data.photoURL || currentUser.photoURL,
          });

          if (data.email && data.email !== currentUser.email) {
            await firebaseUpdateEmail(currentUser, data.email);
          }

          const updatedUser = { ...get().user, ...data } as User;
          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error('User not authenticated');

          await deleteUser(currentUser);
          set({ user: null, isAuthenticated: false, isLoading: false });
          cleanUpData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordResetEmail(auth, email);
          set({ isLoading: false });
        } catch (error: any) {
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
    },
  ),
);
