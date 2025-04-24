import '../globalPolyfills';
import { Slot, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as NavigationBar from 'expo-navigation-bar';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import 'expo-dev-client';

import '../global.css';
import { useAuthStore } from '../utils/useAuthStore';
import { setupTasksListener } from '../utils/manageTasks';
import { setupTaskBoardsListener } from '../utils/manageTaskBoards';
import { setupNotesListener } from '../utils/manageNotes';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
