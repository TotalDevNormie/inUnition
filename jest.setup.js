// jest.setup.js
// Define __DEV__ globally before any code that might use it
// It's usually true in testing/development environments
global.__DEV__ = true;

// Import modules needed in setup (no type imports)
const { Platform } = require('react-native');
const firestore = require('@react-native-firebase/firestore').default; // Use .default for default export in CJS
const {
  initializeFirestore,
  connectFirestoreEmulator,
  getFirestore,
} = require('firebase/firestore');
const { initializeApp, getApps } = require('firebase/app');
const { MMKV } = require('react-native-mmkv');
const NetInfo = require('@react-native-community/netinfo').default; // Use .default if it's a default export

// Assuming these exist and are plain JS or handled by Babel
const debounce = require('./debounce').default; // Use .default if it's a default export
const { useAuthStore } = require('./useAuthStore'); // Import what you need

// Add a log here to confirm the setup file is being executed
console.log('--- Jest: Executing jest.setup.js ---');

// Mock Platform FIRST. This mock should replace the real 'react-native' module.
// Place jest.mock calls near the top, after global definitions and initial imports.
jest.mock('react-native', () => {
  // Add a log inside the mock factory to confirm the mock itself is hit
  // console.log('--- Jest: Applying react-native mock ---');
  return {
    Platform: {
      OS: 'web', // Or your chosen test OS
      select: jest.fn((obj) => obj['web']), // Mock select too
      isTesting: true, // Common flag
    },
    // IMPORTANT: Add mocks for ANY other export used from 'react-native'
    // in your code or libraries that are not ignored by transformIgnorePatterns.
    // Provide simple stubs for anything your code imports from 'react-native'.
    // Examples (add what your project uses):
    StyleSheet: { create: jest.fn((styles) => styles) },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    // ... Add more as needed: Dimensions, NativeModules, UIManager, Keyboard, AppState, ScrollView, FlatList, etc.
    // If you're unsure, add a console.log inside the mock factory and see what Jest tries to access.
  };
});

// Mock other modules AFTER 'react-native' if they depend on it indirectly
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    getAllKeys: jest.fn(() => []), // Return an empty array for initial state
    clearStore: jest.fn(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
      details: null,
      isCellularPossible: false,
    })
  ),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('./debounce', () => ({
  __esModule: true, // Important for mocking ES modules in CJS context
  default: jest.fn((fn) => fn), // Mock to make it immediate
}));

jest.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      isAuthenticated: true,
      user: { uid: 'test-user-123' },
      login: jest.fn(),
      logout: jest.fn(),
      setUser: jest.fn(),
    })),
    setState: jest.fn(),
  },
}));

// --- Firebase Emulator Connection Setup ---
// Ensure this part is correct based on where your Firebase app is initialized
// The most reliable way is often to conditionally connect in your actual firebaseConfig.js

// If initializing the app and connecting emulator IN THIS FILE for testing:
const apps = getApps();
// Replace this with your actual firebaseConfig object if initializing here
const firebaseConfig = { projectId: 'your-project-id', apiKey: 'fake-api-key' /* ... */ }; // Need project ID for emulator clear
const firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
const FIREBASE_EMULATOR_PORT = 8080; // Match your emulator port
const PROJECT_ID = 'your-project-id'; // From .firebaserc - needed for clear

// Get db instance - needs to be available if connecting web Firestore emulator
let dbInstance;
try {
  // Try getting existing Firestore instance if initialized elsewhere
  // Need getFirestore import
  // dbInstance = getFirestore(firebaseApp);
} catch (e) {
  // Or initialize it if not found (Need initializeFirestore import)
  // dbInstance = initializeFirestore(firebaseApp, {});
}

// Connect emulators - use the MOCKED Platform.OS value
if (Platform.OS !== 'web') {
  console.log(
    `--- Jest: Connecting @react-native-firebase/firestore to emulator on ${FIREBASE_EMULATOR_PORT} (Mocked RN) ---`
  );
  // @react-native-firebase/firestore module instance useEmulator
  firestore().useEmulator('localhost', FIREBASE_EMULATOR_PORT);
} else {
  console.log(
    `--- Jest: Connecting firebase/firestore (web) to emulator on ${FIREBASE_EMULATOR_PORT} (Mocked Web) ---`
  );
  // connectFirestoreEmulator(dbInstance, 'localhost', FIREBASE_EMULATOR_PORT); // Requires dbInstance
  // If firebaseConfig.js handles web emulator connection, you don't need this line here
}
// --- End Firebase Emulator Connection Setup ---

// Clean up after each test - clear emulator data
afterEach(async () => {
  console.log('--- Jest: Clearing Firestore emulator data ---');
  const port = 8080; // Your emulator port
  const projectId = 'your-project-id'; // Your project ID from .firebaserc
  const url = `http://localhost:${port}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  try {
    // Ensure fetch is available (provided by 'react-native' test env or node-fetch if using node env)
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      console.error(
        'Failed to clear Firestore emulator data:',
        response.status,
        response.statusText
      );
    }
  } catch (e) {
    console.error('Failed to fetch emulator clear endpoint:', e);
  }

  // Optional: Clear MMKV mock storage if needed between tests
  // Access the mock instance if it was stored globally, or clear the mock data object
  // const mockStorage = new MMKV();
  // mockStorage.clearStore(); // If mock has this method

  // Reset zustand store state (make sure useNoteStore is accessible or imported)
  // const { useNoteStore } = require('~/utils/manageNotes'); // Import if needed
  // useNoteStore.setState({ notes: {}, pendingChanges: {}, lastSyncTimestamp: Date.now() });
});
