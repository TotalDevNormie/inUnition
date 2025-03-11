import { useEffect } from 'react';
import { useAuthStore } from './useAuthStore';
import { setupNotesListener } from './manageNotes';
import { setupTasksListener } from './manageTasks';
import { setupTaskBoardsListener } from './manageTaskBoards';

export const useInitializeSync = () => {
  const { user, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication and get unsubscribe callback if needed
    const unsubscribeAuth = initializeAuth();

    return () => {
      // Clean up auth listener if necessary
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [initializeAuth]);

  useEffect(() => {
    // When user changes (log in or out)
    if (user && user.uid) {
      // Setup Firestore real-time listeners for each store
      setupNotesListener(user.uid);
      setupTasksListener(user.uid);
      setupTaskBoardsListener(user.uid);
    }
  }, [user]);
};
