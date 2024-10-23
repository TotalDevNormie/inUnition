import { Stack } from "expo-router/stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../components/auth/AuthContext";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as NavigationBar from "expo-navigation-bar";
import { MD3DarkTheme, Provider as PaperProvider } from "react-native-paper";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      throwOnError: false,
    },
    mutations: {
      networkMode: "offlineFirst",
      throwOnError: false,
    },
  },
});

console.log(MD3DarkTheme.colors);

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#2CC3A5",
    onPrimary: "#121517",
    // accent: "#B2B3EB",
    // background: "#121212",
    primaryContainer: "#121517",
    surface: "#121517",
    surfaceVariant: "#1f222e",
    onSurface: "#E9F1EF",
    onSurfaceVariant: "#E9F1EF",
    // disabled: "rgba(255, 255, 255, 0.38)",
    // placeholder: "rgba(255, 255, 255, 0.54)",
    // backdrop: "rgba(0, 0, 0, 0.5)",
  },
  dark: true,
};

export default function Layout() {
  NavigationBar.setPositionAsync("absolute");
  NavigationBar.setBackgroundColorAsync("#000000");
  NavigationBar.setBehaviorAsync("overlay-swipe");
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="note" />
            </Stack>
          </AuthProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
