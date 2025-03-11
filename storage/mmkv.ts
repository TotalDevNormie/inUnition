import { MMKV } from 'react-native-mmkv';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import * as Crypto from 'expo-crypto'; // Import expo-crypto
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'mmkv-encryption-key';

async function getEncryptionKey(): Promise<string> {
  try {
    console.log('SecureStore:', SecureStore); // Log the entire SecureStore object
    console.log('getItemAsync:', SecureStore.getItemAsync); // Log the getItemAsync function
    let encryptionKey = await SecureStore.getItemAsync('encryptionKey');

    const existingKey = await getItemAsync(KEY_ALIAS);
    if (existingKey) {
      return existingKey;
    }

    // Generate a new key if one doesn't exist
    const newKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Crypto.randomUUID(),
    );

    await setItemAsync(KEY_ALIAS, newKey);
    return newKey;
  } catch (error) {
    console.error('Error accessing secure store:', error);
    throw new Error('Failed to access secure storage.');
  }
}

let encryptionKey: string | null = null;

async function initializeMMKV() {
  try {
    encryptionKey = await getEncryptionKey();
    return new MMKV({
      id: 'auth-storage',
      encryptionKey: encryptionKey,
    });
  } catch (error) {
    console.error('Failed to initialize MMKV:', error);
    return null; // Or handle the error appropriately
  }
}

let storage: MMKV | null = null;

async function getStorage() {
  if (!storage) {
    storage = await initializeMMKV();
  }
  return storage;
}

export { getStorage };
