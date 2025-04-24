// jest.setup.js
import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web', // Or 'android', 'ios' depending on what you want to test primarily
  },
}));

// Configure @react-native-firebase/firestore to use emulator
if (Platform.OS !== 'web') {
  // Use a non-default port if necessary, default is 8080
  firestore().useEmulator('localhost', 8080);
}

// Configure firebase/firestore (web) to use emulator
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id', // Replace with your actual project ID
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: 'fake-sender-id',
  appId: 'fake-app-id',
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}); // Use initializeFirestore

// Connect to Firestore emulator for web
if (Platform.OS === 'web') {
  // Use a non-default port if necessary, default is 8080
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// Export for use in tests if needed
export { db, firestore as rnFirestore };

// Mock MMKV and NetInfo
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })), // Default to connected
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock debounce to be immediate for easier testing
jest.mock('./debounce', () => ({
  __esModule: true,
  default: jest.fn((fn) => fn),
}));

// Mock useAuthStore
jest.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      isAuthenticated: true,
      user: { uid: 'test-user-123' },
    })),
  },
}));

// Clean up after each test
afterEach(async () => {
  // Clear Firestore data from the emulator
  // Note: This endpoint might vary slightly based on emulator version/setup
  // Make sure to match your project ID and emulator port
  try {
    const projectId = firebaseConfig.projectId;
    const port = 8080;
    await fetch(`http://localhost:${port}/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.error('Failed to clear Firestore emulator data:', e);
  }

  // Reset zustand store state (optional, but good practice)
  // Get the store instance and reset it if your store provides a reset method
  // For this store, we can just reload the module or clear MMKV mock, clearing emulator data is enough
});
