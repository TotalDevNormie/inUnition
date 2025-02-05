import "ts-node/register"; // Add this to import TypeScript files
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "inUnition",
  slug: "inunition",
  scheme: "inunition",
  version: "1.0.0",
  orientation: "portrait",
  backgroundColor: "#121517",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  "newArchEnabled": true,
  extra: {
    eas: {
      projectId: "32478bc0-845f-4e39-a556-a26a34a22f91",
    },
  },
  splash: {
    backgroundColor: "#313749",
    image: "./assets/splashIcon.png",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.totalnormie.inunition",
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#313749",
      foregroundImage: "./assets/icon.png",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/icon.png",
  },
  plugins: ["expo-router", "expo-secure-store"],
};

export default config;
