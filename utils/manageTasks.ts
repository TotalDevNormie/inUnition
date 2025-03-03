import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { app } from '../firebaseConfig';
import { useAuthStore } from './useAuthStore';
import { useTaskBoardStore } from './manageTaskBoards';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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

const db = getFirestore(app);

interface TaskState {
  tasks: { [key: string]: Task };
  pendingChanges: {
    [key: string]: { timestamp: number };
  };
  lastSyncTimestamp: number;
  tasksFromBoard: (boardUUID: string) => Task[];
  saveTask: (taskBoardUUID: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (uuid: string) => Promise<void>;
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

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      pendingChanges: {},
      lastSyncTimestamp: Date.now(),
      activeTasksArray: () =>
        Object.values(get().tasks).filter(
          ({ status }) => status === 'active' || !status,
        ),
      tasksFromBoard: (boardUUID) =>
        Object.values(get().tasks).filter(
          ({ taskBoardUUID, status }) =>
            taskBoardUUID === boardUUID && status === 'active',
        ) || [],

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

        console.log(
          completionStatuses,
          ' should work ',
          task?.completionStatus,
          completionStatuses.includes(task?.completionStatus),
        );
        let newCompletionStatus: string;
        if (
          task?.completionStatus &&
          completionStatuses.includes(task.completionStatus)
        ) {
          console.log('works');
          newCompletionStatus = task.completionStatus;
        } else if (
          oldTask &&
          oldTask.completionStatus &&
          completionStatuses.includes(oldTask.completionStatus)
        ) {
          console.log('old task');
          newCompletionStatus = oldTask.completionStatus;
        } else {
          console.log('default');
          newCompletionStatus = completionStatuses[0];
        }

        console.log(newCompletionStatus);
        console.log('works', taskBoardUUID);
        const updatedTask: Task = {
          ...currentTasks[uuid],
          ...task,
          taskBoardUUID,
          completionStatus: newCompletionStatus,
          status: 'active',
          uuid,
          updatedAt: new Date().toISOString(),
          createdAt: oldTask?.createdAt || new Date().toISOString(),
        };

        set({
          tasks: {
            ...currentTasks,
            [uuid]: updatedTask,
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

            await setDoc(doc(db, 'tasks', task.uuid), {
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

      deleteTask: async (uuid) => {
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
          tasks: {
            ...currentTasks,
            [uuid]: softDeletedTask,
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

        const state = get();
        const { tasks, pendingChanges } = state;

        try {
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userUid', '==', user.uid),
          );
          const querySnapshot = await getDocs(tasksQuery);
          const firebaseTasks: { [key: string]: Task } = {};

          querySnapshot.forEach((doc) => {
            firebaseTasks[doc.id] = doc.data() as Task;
          });

          const mergedTasks = { ...tasks };

          for (const [uuid, firebaseTask] of Object.entries(firebaseTasks)) {
            const localTask = tasks[uuid];

            if (!localTask) {
              mergedTasks[uuid] = firebaseTask;
              continue;
            }

            const pendingChange = pendingChanges[uuid];
            if (pendingChange) {
              if (localTask.status === 'deleted') {
                mergedTasks[uuid] = localTask;
                continue;
              }
            }

            const mergedTask = { ...localTask };

            if (firebaseTask.updatedAt && localTask.updatedAt) {
              const localUpdateTime = new Date(localTask.updatedAt).getTime();
              const remoteUpdateTime = new Date(
                firebaseTask.updatedAt,
              ).getTime();
              if (remoteUpdateTime > localUpdateTime) {
                Object.assign(mergedTask, firebaseTask);
              }
            } else if (firebaseTask.updatedAt) {
              Object.assign(mergedTask, firebaseTask);
            }

            if (localTask.status === 'deleted') {
              mergedTask.status = 'deleted';
            } else if (firebaseTask.status === 'deleted') {
              mergedTask.status = 'deleted';
            } else {
              mergedTask.status = 'active';
            }

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
              continue;
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

let unsubscribe: (() => void) | null = null;

const setupFirebaseListener = (userId: string | null) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (userId) {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userUid', '==', userId),
    );

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

useAuthStore.subscribe(
  (state) => {
    setupFirebaseListener(state.user?.uid);
  },
  (state) => state.user,
);

setupFirebaseListener(useAuthStore.getState().user?.uid);
