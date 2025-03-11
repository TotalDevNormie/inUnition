import 'ts-node/register'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'inUnition',
  slug: 'inunition',
  scheme: 'inunition',
  version: '1.0.0',
  orientation: 'portrait',
  backgroundColor: '#121517',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: '32478bc0-845f-4e39-a556-a26a34a22f91',
    },
    apiKey: process.env.EXPO_API_KEY,
    authDomain: process.env.EXPO_AUTH_DOMAIN,
    projectId: process.env.EXPO_PROJECT_ID,
    storageBucket: process.env.EXPO_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_APP_ID,
    measurementId: process.env.EXPO_MEASUREMENT_ID,
    databaseURL: process.env.EXPO_DATABASE_URL,
  },
  splash: {
    backgroundColor: '#313749',
    image: './assets/splashIcon.png',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.totalnormie.inunition',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#313749',
      foregroundImage: './assets/icon.png',
    },
  },
  web: {
    bundler: 'metro',
    favicon: './assets/icon.png',
  },
  plugins: ['expo-router', 'expo-secure-store'],
};

export default config;
