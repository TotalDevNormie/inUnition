import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const AUTH_PERSISTENCE_KEY = 'auth_persistence';

export const getCurrentUserId = (): string | null => {
  try {
    const persistedData = storage.getString(AUTH_PERSISTENCE_KEY);
    if (persistedData) {
      const authData = JSON.parse(persistedData);
      return authData.user?.uid || null;
    }
    return null;
  } catch (error) {
    console.error('Error reading user ID from storage:', error);
    return null;
  }
};
