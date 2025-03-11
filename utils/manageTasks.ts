import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from './useAuthStore';
import { useTaskBoardStore } from './manageTaskBoards';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type Task = {
  uuid: string;
  name: string;
  description: string;
  taskBoardUUID: string;
  createdAt: string;
  updatedAt: string;
  endsAt: string;
  completionStatus: string;
  status: 'active' | 'deleted';
  tags: string[];
};

const storage = new MMKV();

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

interface TaskState {
  tasks: { [key: string]: Task };
  pendingChanges: { [key: string]: { timestamp: number } };
  lastSyncTimestamp: number;
  tasksFromBoard: (boardUUID: string) => Task[];
  getTask: (uuid: string) => Task | undefined;
  saveTask: (taskBoardUUID: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      pendingChanges: {},
      lastSyncTimestamp: Date.now(),
      tasksFromBoard: (boardUUID) =>
        Object.values(get().tasks).filter(
          ({ taskBoardUUID, status }) =>
            taskBoardUUID === boardUUID && status === 'active',
        ),
      getTask: (uuid) => get().tasks[uuid],

      saveTask: async (taskBoardUUID, task) => {
        const uuid = task.uuid || uuidv4();
        const board = useTaskBoardStore.getState().taskBoards[taskBoardUUID];
        const timestamp = Date.now();
        const currentTasks = get().tasks;
        const pendingChanges = get().pendingChanges;
        const oldTask = currentTasks[uuid];

        if (!board) throw new Error('Task board not found');

        const completionStatuses = board.statusTypes;
        if (!completionStatuses || completionStatuses.length === 0)
          throw new Error('No completion statuses found');

        let newCompletionStatus: string;
        if (
          task.completionStatus &&
          completionStatuses.includes(task.completionStatus)
        ) {
          newCompletionStatus = task.completionStatus;
        } else if (
          oldTask &&
          oldTask.completionStatus &&
          completionStatuses.includes(oldTask.completionStatus)
        ) {
          newCompletionStatus = oldTask.completionStatus;
        } else {
          newCompletionStatus = completionStatuses[0];
        }

        const updatedTask: Task = {
          ...oldTask,
          ...task,
          taskBoardUUID,
          completionStatus: newCompletionStatus,
          status: 'active',
          uuid,
          updatedAt: new Date().toISOString(),
          createdAt: oldTask?.createdAt || new Date().toISOString(),
        };

        set({
          tasks: { ...currentTasks, [uuid]: updatedTask },
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
            await setDoc(doc(db, 'tasks', uuid), {
              ...updatedTask,
              userUid: user.uid,
            });
            const { [uuid]: _, ...remainingChanges } = get().pendingChanges;
            set({ pendingChanges: remainingChanges });
          } catch (error) {
            console.error('Failed to sync with Firebase:', error);
          }
        }
      },

      deleteTask: async (uuid: string) => {
        const timestamp = Date.now();
        const currentTasks = get().tasks;
        const pendingChanges = get().pendingChanges;

        if (!currentTasks[uuid]) return;

        const softDeletedTask: Task = {
          ...currentTasks[uuid],
          status: 'deleted',
          updatedAt: new Date().toISOString(),
        };

        set({
          tasks: { ...currentTasks, [uuid]: softDeletedTask },
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
            await setDoc(doc(db, 'tasks', uuid), {
              ...softDeletedTask,
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
        if (!netInfo.isConnected || !authenticated || !user || !user.uid)
          return;

        const { tasks, pendingChanges } = get();
        try {
          const tasksRef = collection(db, 'tasks');
          const tasksQuery = query(tasksRef, where('userUid', '==', user.uid));
          const querySnapshot = await getDocs(tasksQuery);
          const firebaseTasks: { [key: string]: Task } = {};

          querySnapshot.forEach((docSnap) => {
            firebaseTasks[docSnap.id] = docSnap.data() as Task;
          });

          const mergedTasks = { ...tasks };

          for (const [uuid, firebaseTask] of Object.entries(firebaseTasks)) {
            const localTask = tasks[uuid];
            if (!localTask) {
              mergedTasks[uuid] = firebaseTask;
              continue;
            }

            const pendingChange = pendingChanges[uuid];
            if (pendingChange && localTask.status === 'deleted') {
              mergedTasks[uuid] = localTask;
              continue;
            }

            const mergedTask = { ...localTask };

            if (firebaseTask.updatedAt && localTask.updatedAt) {
              const localTime = new Date(localTask.updatedAt).getTime();
              const remoteTime = new Date(firebaseTask.updatedAt).getTime();
              if (remoteTime > localTime) {
                Object.assign(mergedTask, firebaseTask);
              }
            } else if (firebaseTask.updatedAt) {
              Object.assign(mergedTask, firebaseTask);
            }

            mergedTask.status =
              localTask.status === 'deleted' ||
              firebaseTask.status === 'deleted'
                ? 'deleted'
                : 'active';
            mergedTask.updatedAt = new Date().toISOString();

            mergedTasks[uuid] = mergedTask;
          }

          for (const [uuid, localTask] of Object.entries(tasks)) {
            const firebaseTask = firebaseTasks[uuid];
            const pendingChange = pendingChanges[uuid];
            if (!firebaseTask || pendingChange) {
              try {
                await setDoc(doc(db, 'tasks', uuid), {
                  ...localTask,
                  userUid: user.uid,
                });
              } catch (error) {
                console.error('Failed to sync task to Firebase:', error);
              }
            }
          }

          set({
            tasks: mergedTasks,
            pendingChanges: {},
            lastSyncTimestamp: Date.now(),
          });
        } catch (error) {
          console.error('Failed to sync with Firebase:', error);
        }
      },
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

// Real-time listener for tasks
let unsubscribe: (() => void) | null = null;
export const setupTasksListener = (userId: string | null) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (userId) {
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, where('userUid', '==', userId));
    unsubscribe = onSnapshot(tasksQuery, () => {
      const store = useTaskStore.getState();
      if (store.lastSyncTimestamp < Date.now() - 1000) {
        store.syncWithFirebase();
      }
    });
  }
};

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useTaskStore.getState().syncWithFirebase();
  }
});
