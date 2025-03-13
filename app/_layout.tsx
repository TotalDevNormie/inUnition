import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';

import '../global.css';
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

const storage = new MMKV();

export default function Layout() {
  const { initializeAuth, isLoading, user } = useAuthStore();
  const router = useRouter();

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

  useEffect(() => {
    if (user?.uid) {
      setupTasksListener(user.uid);
      setupNotesListener(user.uid);
      setupTaskBoardsListener(user.uid);
    } else {
      setupTasksListener(null);
      setupNotesListener(null);
      setupTaskBoardsListener(undefined);
    }
  }, [user]);

  useEffect(() => {
    const alreadyLaunched = storage.contains('alreadyLaunched');

    if (!alreadyLaunched) {
      // If 'alreadyLaunched' doesn't exist, it's the first launch
      router.replace('/landing');
    }
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
            <Stack.Screen name="landing" />
          </Stack>
        </PaperProvider>
      </GestureHandlerRootView>
    </SearchProvider>
  );
}
