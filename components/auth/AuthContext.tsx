import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getFirestore, getDoc } from 'firebase/firestore';
import { app } from '../../firebaseConfig';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Initialize Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize MMKV storage
const storage = new MMKV();

// Register for redirect URI
WebBrowser.maybeCompleteAuthSession();

// Set persistence based on platform
setPersistence(
  auth,
  Platform.OS === 'web' ? browserLocalPersistence : inMemoryPersistence,
);

const AUTH_PERSISTENCE_KEY = 'auth_persistence';
const AUTH_EXPIRY_KEY = 'auth_expiry';
const OFFLINE_EXPIRY_DAYS = 14;

type User = {
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  uid: string;
  photoURL?: string;
};

type CredentialsType = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type LoginCredentialsType = Pick<CredentialsType, 'email' | 'password'>;

const createUserObject = (firebaseUser: FirebaseUser): User => {
  return {
    name: firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    uid: firebaseUser.uid,
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    updatedAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
    photoURL: firebaseUser.photoURL || undefined,
  };
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoadingUser: true,
      isOnline: true,
      lastSyncTime: null,

      // Initialize
      init: () => {
        const request = Google.useAuthRequest({
          clientId:
            Platform.OS === 'ios'
              ? GOOGLE_IOS_CLIENT_ID
              : Platform.OS === 'android'
                ? GOOGLE_ANDROID_CLIENT_ID
                : GOOGLE_WEB_CLIENT_ID,
          scopes: ['profile', 'email'],
        });

        const handleGoogleSignInResponse = async () => {
          if (response?.type === 'success') {
            try {
              const { id_token } = response.params;
              const credential = GoogleAuthProvider.credential(id_token);
              const userCredential = await signInWithCredential(
                auth,
                credential,
              );
              const firebaseUser = userCredential.user;

              const userRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userRef);

              if (!userDoc.exists()) {
                await setDoc(userRef, {
                  name: firebaseUser.displayName || '',
                  email: firebaseUser.email || '',
                  photoURL: firebaseUser.photoURL || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              } else {
                await setDoc(
                  userRef,
                  {
                    updatedAt: new Date().toISOString(),
                  },
                  { merge: true },
                );
              }

              const userObject = createUserObject(firebaseUser);
              set({ user: userObject, lastSyncTime: new Date() });
              storage.set(AUTH_PERSISTENCE_KEY, JSON.stringify(userObject));
            } catch (error) {
              console.error('Google sign in error:', error);
              throw error;
            }
          }
        };

        if (response) {
          handleGoogleSignInResponse();
        }
      },

      // Load user data
      loadUserData: async () => {
        set({ isLoadingUser: true });
        try {
          const persistedData = storage.getString(AUTH_PERSISTENCE_KEY);
          if (persistedData) {
            const authData = JSON.parse(persistedData);
            const expiryDate = new Date(authData.expiryDate);
            if (expiryDate > new Date()) {
              set({ user: authData.user, isLoadingUser: false });
              return;
            }
          }

          if (!get((state) => state.isOnline)) {
            set({ user: null, isLoadingUser: false });
            return;
          }

          const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
              if (firebaseUser) {
                const userObject = createUserObject(firebaseUser);
                set({ user: userObject, isLoadingUser: false });
                storage.set(AUTH_PERSISTENCE_KEY, JSON.stringify(userObject));
                set({ lastSyncTime: new Date() });
              } else {
                set({ user: null, isLoadingUser: false });
                storage.delete(AUTH_PERSISTENCE_KEY);
                storage.delete(AUTH_EXPIRY_KEY);
              }
            },
            (error) => {
              console.error('Auth state error:', error);
              set({ user: null, isLoadingUser: false });
            },
          );

          return () => unsubscribe();
        } catch (error) {
          console.error('Error loading user data:', error);
          set({ user: null, isLoadingUser: false });
        }
      },

      // Network status monitoring
      setupNetworkListener: () => {
        const unsubscribe = NetInfo.addEventListener((state) => {
          const newIsOnline = !!state.isConnected;

          if (newIsOnline && !get((state) => state.isOnline)) {
            get((state) => state.loadUserData)();
          }

          set({ isOnline: newIsOnline });
        });

        return () => unsubscribe();
      },

      // Login
      login: async (credentials: LoginCredentialsType) => {
        if (!get((state) => state.isOnline)) {
          throw new Error('Initial login requires an internet connection');
        }

        try {
          const { user: firebaseUser } = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password,
          );

          const userObject = createUserObject(firebaseUser);
          set({ user: userObject });
          storage.set(AUTH_PERSISTENCE_KEY, JSON.stringify(userObject));
          set({ lastSyncTime: new Date() });
          return userObject;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      // Register
      register: async (credentials: CredentialsType) => {
        if (!get((state) => state.isOnline)) {
          throw new Error('Registration requires an internet connection');
        }

        if (credentials.password !== credentials.password_confirmation) {
          throw new Error('Passwords do not match');
        }

        try {
          const { user: firebaseUser } = await createUserWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password,
          );

          await updateProfile(firebaseUser, {
            displayName: credentials.name,
          });

          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, {
            name: credentials.name,
            email: credentials.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          const userObject = createUserObject(firebaseUser);
          set({ user: userObject });
          storage.set(AUTH_PERSISTENCE_KEY, JSON.stringify(userObject));
          set({ lastSyncTime: new Date() });
          return userObject;
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          if (get((state) => state.isOnline)) {
            await signOut(auth);
          }

          set({ user: null, lastSyncTime: null });
          storage.delete(AUTH_PERSISTENCE_KEY);
          storage.delete(AUTH_EXPIRY_KEY);
          // Add your delete local data functions here
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },

      // Google Sign In
      signInWithGoogle: async () => {
        if (!get((state) => state.isOnline)) {
          throw new Error('Google sign-in requires an internet connection');
        }

        try {
          const { promptAsync } = Google.useAuthRequest({
            clientId:
              Platform.OS === 'ios'
                ? GOOGLE_IOS_CLIENT_ID
                : Platform.OS === 'android'
                  ? GOOGLE_ANDROID_CLIENT_ID
                  : GOOGLE_WEB_CLIENT_ID,
            scopes: ['profile', 'email'],
          });

          await promptAsync();
        } catch (error) {
          console.error('Google sign in prompt error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth', // name of the store
      getStorage: () => storage, // MMKV storage
    },
  ),
);

export const useAuth = () => useAuthStore();
