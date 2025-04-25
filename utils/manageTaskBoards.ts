import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import firestore from '@react-native-firebase/firestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useTaskStore } from './manageTasks'; // Import the task store
import { useAuthStore } from './useAuthStore';
import { db } from '../firebaseConfig';

const storage = new MMKV();
const TASK_BOARDS = 'taskBoards';

export type TaskBoard = {
  uuid: string;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  endsAt?: string;
  nextReset?: string;
  resetInterval?: string;
  statusTypes?: string[];
  status?: 'active' | 'deleted';
  tags?: string[];
};

interface TaskBoardState {
  taskBoards: { [key: string]: TaskBoard };
  pendingChanges: { [key: string]: { timestamp: number } };
  lastSyncTimestamp: number;
  activeTaskBoards: () => TaskBoard[];
  getTaskBoard: (uuid: string) => TaskBoard | null;
  taskBoardsWithTag: (tag: string) => TaskBoard[];
  saveTaskBoard: (taskBoard: Partial<TaskBoard>) => Promise<void | string>;
  deleteTaskBoard: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

export const useTaskBoardStore = create<TaskBoardState>()(
  persist(
    (set, get) => ({
      taskBoards: {},
      pendingChanges: {},
      lastSyncTimestamp: Date.now(),
      activeTaskBoards: () =>
        Object.values(get().taskBoards).filter((taskBoard) => taskBoard.status === 'active'),
      getTaskBoard: (uuid) => get().taskBoards[uuid] || null,
      taskBoardsWithTag: (tag: string) =>
        Object.values(get().taskBoards).filter((taskBoard) => taskBoard.tags?.includes(tag)),

      saveTaskBoard: async (taskBoard) => {
        const uuid = taskBoard?.uuid || uuidv4();
        const oldTaskBoard = get().taskBoards[uuid];
        taskBoard.uuid = uuid;
        taskBoard.createdAt = new Date().toISOString();
        taskBoard.updatedAt = new Date().toISOString();
        const newTaskBoard: TaskBoard = {
          ...oldTaskBoard,
          ...taskBoard,
          uuid,
          createdAt: oldTaskBoard?.createdAt || new Date().toISOString(),
          status: 'active',
          updatedAt: new Date().toISOString(),
        };
        set({
          taskBoards: {
            ...get().taskBoards,
            [uuid]: newTaskBoard,
          },
          pendingChanges: {
            ...get().pendingChanges,
            [uuid]: { timestamp: Date.now() },
          },
        });

        const netInfo = await NetInfo.fetch();
        const authenticated = useAuthStore.getState().isAuthenticated;

        if (netInfo.isConnected && authenticated) {
          try {
            const user = useAuthStore.getState().user;
            if (!user || !user.uid) throw new Error('User not authenticated');
            // Use collection().doc().set() pattern for react-native-firebase
            await firestore()
              .collection(TASK_BOARDS)
              .doc(uuid)
              .set({
                ...newTaskBoard,
                userUid: user.uid,
              });
            const { [uuid]: _, ...remainingChanges } = get().pendingChanges;
            set({ pendingChanges: remainingChanges });
          } catch (error) {
            console.error('Failed to sync with Firebase:', error);
          }
        }

        return uuid;
      },

      deleteTaskBoard: async (uuid: string) => {
        const timestamp = Date.now();
        const currentTaskBoards = get().taskBoards;
        const pendingChanges = get().pendingChanges;

        if (!currentTaskBoards[uuid]) return;

        const softDeletedTaskBoard: TaskBoard = {
          uuid,
          status: 'deleted',
          updatedAt: new Date().toISOString(),
        };

        set({
          taskBoards: {
            ...currentTaskBoards,
            [uuid]: softDeletedTaskBoard,
          },
          pendingChanges: {
            ...pendingChanges,
            [uuid]: { timestamp },
          },
        });

        const { tasksFromBoard, deleteTask } = useTaskStore.getState();
        const tasksToDelete = tasksFromBoard(uuid);
        for (const task of tasksToDelete) {
          await deleteTask(task.uuid);
        }

        const netInfo = await NetInfo.fetch();
        const authenticated = useAuthStore.getState().isAuthenticated;
        if (netInfo.isConnected && authenticated) {
          try {
            const user = useAuthStore.getState().user;
            if (!user || !user.uid) throw new Error('User not authenticated');
            // Use collection().doc().set() pattern for react-native-firebase
            await firestore()
              .collection(TASK_BOARDS)
              .doc(uuid)
              .set({
                ...softDeletedTaskBoard,
                userUid: user.uid,
              });
            const { [uuid]: _, ...remainingChanges } = get().pendingChanges;
            set({ pendingChanges: remainingChanges });
          } catch (error) {
            console.error('Failed to sync deletion with Firebase:', error);
          }
        }
      },

      syncWithFirebase: async () => {
        const authenticated = useAuthStore.getState().isAuthenticated;
        const user = useAuthStore.getState().user;
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected || !authenticated || !user || !user.uid) return;

        const { taskBoards, pendingChanges } = get();
        try {
          // Use firestore().collection().where() pattern
          const boardsQuery = firestore().collection(TASK_BOARDS).where('userUid', '==', user.uid);
          // Use query.get() pattern
          const querySnapshot = await boardsQuery.get();
          const firebaseTaskBoards: { [key: string]: TaskBoard } = {};

          querySnapshot.forEach((docSnap) => {
            // Use docSnap.data() which is already typed in react-native-firebase
            firebaseTaskBoards[docSnap.id] = docSnap.data() as TaskBoard;
          });

          const mergedTaskBoards = { ...taskBoards };

          for (const [uuid, firebaseTaskBoard] of Object.entries(firebaseTaskBoards)) {
            const localTaskBoard = taskBoards[uuid];
            if (!localTaskBoard) {
              mergedTaskBoards[uuid] = firebaseTaskBoard;
              continue;
            }
            const pendingChange = pendingChanges[uuid];
            if (pendingChange && localTaskBoard.status === 'deleted') {
              mergedTaskBoards[uuid] = localTaskBoard;
              continue;
            }
            const mergedTaskBoard = { ...localTaskBoard };
            if (firebaseTaskBoard.updatedAt && localTaskBoard.updatedAt) {
              const localTime = new Date(localTaskBoard.updatedAt).getTime();
              const remoteTime = new Date(firebaseTaskBoard.updatedAt).getTime();
              if (remoteTime > localTime) {
                Object.assign(mergedTaskBoard, firebaseTaskBoard);
              }
            } else if (firebaseTaskBoard.updatedAt) {
              Object.assign(mergedTaskBoard, firebaseTaskBoard);
            }
            if (
              (localTaskBoard.statusTypes && localTaskBoard.statusTypes.includes('deleted')) ||
              (firebaseTaskBoard.statusTypes && firebaseTaskBoard.statusTypes.includes('deleted'))
            ) {
              mergedTaskBoard.statusTypes = ['deleted'];
            }
            mergedTaskBoard.updatedAt = new Date().toISOString();
            mergedTaskBoards[uuid] = mergedTaskBoard;
          }

          for (const [uuid, localTaskBoard] of Object.entries(taskBoards)) {
            const firebaseTaskBoard = firebaseTaskBoards[uuid];
            const pendingChange = pendingChanges[uuid];
            if (!firebaseTaskBoard || pendingChange) {
              try {
                // Use collection().doc().set() pattern
                await firestore()
                  .collection(TASK_BOARDS)
                  .doc(uuid)
                  .set({
                    ...localTaskBoard,
                    userUid: user.uid,
                  });
              } catch (error) {
                console.error('Failed to sync taskBoard to Firebase:', error);
              }
            }
          }
          set({
            taskBoards: mergedTaskBoards,
            pendingChanges: {},
            lastSyncTimestamp: Date.now(),
          });
        } catch (error) {
          console.error('Failed to sync with Firebase:', error);
        }
      },
    }),
    {
      name: 'task-board-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

let unsubscribe: (() => void) | null = null;

export const setupTaskBoardsListener = (userId?: string | null) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  try {
    if (Platform.OS !== 'web') {
      unsubscribe = firestore()
        .collection(TASK_BOARDS)
        .where('userUid', '==', userId)
        .onSnapshot(() => {
          const store = useTaskBoardStore.getState();
          if (store.lastSyncTimestamp < Date.now() - 1000) {
            store.syncWithFirebase();
          }
        });
    } else {
      const boardsRef = collection(db, TASK_BOARDS);
      const boardsQuery = query(boardsRef, where('userUid', '==', userId));
      unsubscribe = onSnapshot(boardsQuery, () => {
        const store = useTaskBoardStore.getState();
        if (store.lastSyncTimestamp < Date.now() - 1000) {
          store.syncWithFirebase();
        }
      });
    }
  } catch (error) {
    console.error('Error setting up TaskBoards listener:', error);
  }
};
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useTaskBoardStore.getState().syncWithFirebase();
  }
});
