import { Stack } from 'expo-router/stack';
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { useAuthStore } from '../utils/useAuthStore';
import { SearchProvider } from '../utils/SearchContext';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2CC3A5',
    onPrimary: '#121517',
    primaryContainer: '#121517',
    surface: '#121517',
    surfaceVariant: '#1f222e',
    onSurface: '#E9F1EF',
    onSurfaceVariant: '#E9F1EF',
  },
  dark: true,
};

export default function Layout() {
  const { initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('#000000');
    NavigationBar.setBehaviorAsync('overlay-swipe');

    const unsubscribe = initializeAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
  return (
    <SearchProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="note" />
          </Stack>
        </PaperProvider>
      </GestureHandlerRootView>
    </SearchProvider>
  );
}
