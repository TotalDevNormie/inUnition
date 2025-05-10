import '../globalPolyfills';
import * as NavigationBar from 'expo-navigation-bar';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { StatusBar } from 'expo-status-bar';
import { Slot, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MMKV } from 'react-native-mmkv';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import 'expo-dev-client';

import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setupNotesListener, useNoteStore } from '../utils/manageNotes';
import { setupTaskBoardsListener, useTaskBoardStore } from '../utils/manageTaskBoards';
import { setupTasksListener, useTaskStore } from '../utils/manageTasks';
import { useAuthStore } from '../utils/useAuthStore';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

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

const BACKGROUND_TASK_IDENTIFIER = 'sync-with-firebase';

// Register and create the task so that it is available also when the background task screen
// (a React component defined later in this example) is not visible.
// Note: This needs to be called in the global scope, not in a React component.
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
  try {
    const { syncWithFirebase: noteSync } = useNoteStore.getState();
    const { syncWithFirebase: taskSync } = useTaskStore.getState();
    const { syncWithFirebase: taskBoardSync } = useTaskBoardStore.getState();
    await noteSync();
    await taskSync();
    await taskBoardSync();
    console.log('Synced with Firebase');
  } catch (error) {
    console.error('Failed to execute the background task:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.Success;
});

const storage = new MMKV();

export default function Layout() {
  const { initializeAuth, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('#000000');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER);
    const unsubscribeAuth = initializeAuth();
    const alreadyLaunched = storage.contains('alreadyLaunched');
    if (!alreadyLaunched) {
      // If 'alreadyLaunched' doesn't exist, it's the first launch
      router.replace('/landing');
    }
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
      setupTaskBoardsListener(null);
    }
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar style="light" backgroundColor="transparent" translucent={true} />
            <Slot />
          </PaperProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
