import { Stack } from 'expo-router/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { useAuthStore } from '../utils/useAuthStore';
import { SearchProvider } from '../utils/SearchContext';
import { setupTasksListener } from '../utils/manageTasks';
import { setupTaskBoardsListener } from '../utils/manageTaskBoards';
import { setupNotesListener } from '../utils/manageNotes';

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
  const { initializeAuth, isLoading, user } = useAuthStore();

  // Initialize auth listener for Firebase auth state changes
  useEffect(() => {
    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('#000000');
    NavigationBar.setBehaviorAsync('overlay-swipe');

    const unsubscribeAuth = initializeAuth();
    return () => {
      if (typeof unsubscribeAuth === 'function') {
        unsubscribeAuth();
      }
    };
  }, []);

  // Set up Firebase data listeners once auth state is known
  useEffect(() => {
    if (user?.uid) {
      // User is authenticated, so set up Firebase listeners
      setupTasksListener(user.uid);
      setupNotesListener(user.uid);
      setupTaskBoardsListener(user.uid);
    } else {
      // No user logged in, unsubscribing by passing null/undefined
      setupTasksListener(null);
      setupNotesListener(null);
      setupTaskBoardsListener(undefined);
    }
    // Optionally, you can return cleanup functions here if your setup
    // functions support returning unsubscribes (if they maintained local state)
  }, [user]);

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
