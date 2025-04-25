import NetInfo from "@react-native-community/netinfo";
import { MMKV } from "react-native-mmkv";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  onAuthStateChanged,
  signIn,
  signUp,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  sendEmailVerification,
  deleteUser,
} from "../authAdapter";
import { cleanUpData } from "./cleanUpData";

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
  initializeAuth: () => Promise<() => void | undefined>;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, d: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (d: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  clearError: () => void;
}

const storage = new MMKV();
const zustandStorage = {
  getItem: (name: string) => {
    const v = storage.getString(name);
    return v ? JSON.parse(v) : null;
  },
  setItem: (name: string, v: any) => {
    storage.set(name, JSON.stringify(v));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

function getCleanFirebaseErrorMessage(err: any): string {
  const code = (err.code || "").replace("auth/", "");
  const map: Record<string, string> = {
    "invalid-email": "Please enter a valid email address",
    "wrong-password": "Incorrect password",
    "user-not-found": "No account found with this email",
    "email-already-in-use": "This email is already registered",
    "weak-password": "Password should be at least 6 characters",
    "network-request-failed": "Network error. Check connection",
  };
  return map[code] || `Error: ${code || err.message || "unknown"}`;
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
          const unsub = await onAuthStateChanged((fu) => {
            if (fu) {
              set({
                user: {
                  uid: fu.uid,
                  email: fu.email,
                  displayName: fu.displayName,
                  photoURL: fu.photoURL,
                  emailVerified: fu.emailVerified,
                },
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          });
          return unsub;
        } catch (e: any) {
          set({
            error: getCleanFirebaseErrorMessage(e),
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const uc = await signIn(email, password);
          const fu = uc.user;
          if (get().isAuthenticated) cleanUpData();
          set({
            user: {
              uid: fu.uid,
              email: fu.email,
              displayName: fu.displayName,
              photoURL: fu.photoURL,
              emailVerified: fu.emailVerified,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          const uc = await signUp(email, password);
          await updateProfile({ displayName });
          await sendEmailVerification();
          const fu = (uc.user as any) || (auth as any).currentUser;
          if (get().isAuthenticated) cleanUpData();
          set({
            user: {
              uid: fu.uid,
              email: fu.email,
              displayName,
              photoURL: fu.photoURL,
              emailVerified: fu.emailVerified,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await signOut();
          cleanUpData();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          if (data.displayName || data.photoURL) {
            await updateProfile(data);
          }
          if (data.email) {
            await updateEmail(data.email);
          }
          set({
            user: { ...get().user!, ...data },
            isLoading: false,
          });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          await deleteUser();
          cleanUpData();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      sendEmailVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          await sendEmailVerification();
          set({ isLoading: false });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordResetEmail(email);
          set({ isLoading: false });
        } catch (e: any) {
          set({ error: getCleanFirebaseErrorMessage(e), isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    /* you could trigger a store‐wide refresh here if desired */
  }
});
