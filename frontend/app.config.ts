import 'ts-node/register'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';
import { useColorScheme } from 'react-native';
// const colorScheme = useColorScheme();

const config: ExpoConfig = {
  name: 'inUnition',
  slug: 'inunition',
  scheme: 'inunition',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    backgroundColor: '#242A29',
    image: './assets/splashIcon.png',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: './assets/icon.png',
    },
  },
  web: {
    bundler: 'metro',
    favicon: './assets/icon.png',
  },
  plugins: [
    'expo-router',
    "expo-secure-store",
  ],
}

export default config;