import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
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
  saveTaskBoard: (taskBoard: Partial<TaskBoard>) => Promise<void | string>;
  deleteTaskBoard: (uuid: string) => Promise<void>;
  deleteAllTaskBoards: (local: boolean) => Promise<void>;
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
        Object.values(get().taskBoards).filter(
          (taskBoard) => taskBoard.status === 'active',
        ),
      getTaskBoard: (uuid) => get().taskBoards[uuid] || null,

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
            await setDoc(doc(db, TASK_BOARDS, uuid), {
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

        const netInfo = await NetInfo.fetch();
        const authenticated = useAuthStore.getState().isAuthenticated;
        if (netInfo.isConnected && authenticated) {
          try {
            const user = useAuthStore.getState().user;
            if (!user || !user.uid) throw new Error('User not authenticated');
            await setDoc(doc(db, TASK_BOARDS, uuid), {
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

      deleteAllTaskBoards: async (local: boolean) => {
        if (local) {
          set({ taskBoards: {}, pendingChanges: {} });
        } else {
          const user = useAuthStore.getState().user;
          if (!user || !user.uid) {
            console.log('deleteAllTaskBoards user not logged');
            return;
          }
          const taskBoards = get().taskBoards;
          for (const uuid in taskBoards) {
            await get().deleteTaskBoard(uuid);
          }
        }
      },

      syncWithFirebase: async () => {
        const authenticated = useAuthStore.getState().isAuthenticated;
        const user = useAuthStore.getState().user;
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected || !authenticated || !user || !user.uid)
          return;

        const { taskBoards, pendingChanges } = get();
        try {
          const boardsRef = collection(db, TASK_BOARDS);
          const boardsQuery = query(
            boardsRef,
            where('userUid', '==', user.uid),
          );
          const querySnapshot = await getDocs(boardsQuery);
          const firebaseTaskBoards: { [key: string]: TaskBoard } = {};

          querySnapshot.forEach((docSnap) => {
            firebaseTaskBoards[docSnap.id] = docSnap.data() as TaskBoard;
          });

          const mergedTaskBoards = { ...taskBoards };

          for (const [uuid, firebaseTaskBoard] of Object.entries(
            firebaseTaskBoards,
          )) {
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
              const remoteTime = new Date(
                firebaseTaskBoard.updatedAt,
              ).getTime();
              if (remoteTime > localTime) {
                Object.assign(mergedTaskBoard, firebaseTaskBoard);
              }
            } else if (firebaseTaskBoard.updatedAt) {
              Object.assign(mergedTaskBoard, firebaseTaskBoard);
            }
            if (
              (localTaskBoard.statusTypes &&
                localTaskBoard.statusTypes.includes('deleted')) ||
              (firebaseTaskBoard.statusTypes &&
                firebaseTaskBoard.statusTypes.includes('deleted'))
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
                await setDoc(doc(db, TASK_BOARDS, uuid), {
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
    },
  ),
);

let unsubscribe: (() => void) | null = null;
export const setupTaskBoardsListener = (userId?: string) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (userId) {
    const boardsRef = collection(db, TASK_BOARDS);
    const boardsQuery = query(boardsRef, where('userUid', '==', userId));
    unsubscribe = onSnapshot(boardsQuery, () => {
      const store = useTaskBoardStore.getState();
      if (store.lastSyncTimestamp < Date.now() - 1000) {
        store.syncWithFirebase();
      }
    });
  }
};

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useTaskBoardStore.getState().syncWithFirebase();
  }
});
