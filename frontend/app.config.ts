import 'ts-node/register'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig ={
    name: 'inUnition',
    slug: 'inunition',
    scheme: 'inunition',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#ffffff',
      },
    },
    web: {
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
    ],
}

export default config;