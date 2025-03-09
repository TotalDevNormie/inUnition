// stores/authStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { useNoteStore } from './manageNotes';
import { useTaskStore } from './manageTasks';
import { useTaskBoardStore } from './manageTaskBoards';
import { app, authentication } from '../firebaseConfig';

app;

// Define the User type
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Add any other user properties you need
};

const clearPreviousUserData = () => {
  useNoteStore.setState({
    pendingChanges: {},
    lastSyncTimestamp: 0,
    notes: {},
  });
  useNoteStore.getState().syncWithFirebase();
  useTaskStore.setState({
    pendingChanges: {},
    lastSyncTimestamp: 0,
    tasks: {},
  });
  useTaskStore.getState().syncWithFirebase();
  useTaskBoardStore.setState({
    pendingChanges: {},
    lastSyncTimestamp: 0,
    taskBoards: {},
  });
  useTaskBoardStore.getState().syncWithFirebase();
};

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
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

// Create the MMKV storage adapter for Zustand
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
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Initialize auth state from Firebase
      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // Set up auth state observer
          const unsubscribe = authentication.onAuthStateChanged((firebaseUser) => {
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
          });

          // Clean up observer on app unmount (you'll need to call this elsewhere)
          return unsubscribe;
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      // Login with email and password
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await authentication.signInWithEmailAndPassword(
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
            // clearPreviousUserData();
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Register new user
      register: async (
        email: string,
        password: string,
        displayName: string,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await authentication.createUserWithEmailAndPassword(
            email,
            password,
          );

          // Update profile with display name
          await userCredential.user.updateProfile({
            displayName,
          });

          const user: User = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName,
            photoURL: null,
          };

          set({ user, isAuthenticated: true, isLoading: false });
          // clearPreviousUserData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Logout user
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await authentication.signOut();
          set({ user: null, isAuthenticated: false, isLoading: false });
          // clearPreviousUserData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Update user profile
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = authentication.currentUser;

          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          await currentUser.updateProfile({
            displayName: data.displayName || currentUser.displayName,
            photoURL: data.photoURL || currentUser.photoURL,
          });

          if (data.email && data.email !== currentUser.email) {
            await currentUser.updateEmail(data.email);
          }

          // Get updated user data
          const updatedUser = {
            ...get().user,
            ...data,
          } as User;

          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Delete user account
      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          const currentUser = authentication.currentUser;

          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          await currentUser.delete();
          set({ user: null, isAuthenticated: false, isLoading: false });
          // clearPreviousUserData();
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Reset password
      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authentication.sendPasswordResetEmail(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Clear any errors
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
