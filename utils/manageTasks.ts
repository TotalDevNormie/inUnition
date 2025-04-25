import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

import { useTaskBoardStore } from "./manageTaskBoards";
import { useAuthStore } from "./useAuthStore";
import { setDoc, fetchAll, listen } from "../firestoreAdapter";

export type Task = {
  uuid: string;
  name: string;
  description: string;
  taskBoardUUID: string;
  createdAt: string;
  updatedAt: string;
  endsAt: string;
  completionStatus: string;
  status: "active" | "deleted";
  tags: string[];
};

const storage = new MMKV();
const COLLECTION = "tasks";

const zustandStorage = {
  getItem: (key: string) => {
    const v = storage.getString(key);
    return v ? JSON.parse(v) : null;
  },
  setItem: (key: string, val: any) => {
    storage.set(key, JSON.stringify(val));
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

interface TaskState {
  tasks: Record<string, Task>;
  pending: Record<string, { timestamp: number }>;
  lastSync: number;
  activeTasksArray: () => Task[];
  tasksFromBoard: (boardUUID: string) => Task[];
  getTask: (uuid: string) => Task | undefined;
  saveTask: (boardUUID: string, t: Partial<Task>) => Promise<void>;
  deleteTask: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      pending: {},
      lastSync: Date.now(),

      activeTasksArray: () =>
        Object.values(get().tasks).filter((t) => t.status === "active"),

      tasksFromBoard: (boardUUID) =>
        Object.values(get().tasks).filter(
          (t) => t.taskBoardUUID === boardUUID && t.status === "active"
        ),

      getTask: (uuid) => get().tasks[uuid],

      saveTask: async (boardUUID, task) => {
        const uuid = task.uuid || uuidv4();
        const board = useTaskBoardStore.getState().taskBoards[boardUUID];
        if (!board) throw new Error("Board not found");

        const statuses = board.statusTypes || [];
        if (statuses.length === 0) throw new Error("No completion statuses");

        const old = get().tasks[uuid];
        const cs = task.completionStatus && statuses.includes(task.completionStatus)
          ? task.completionStatus
          : old?.completionStatus && statuses.includes(old.completionStatus)
          ? old.completionStatus
          : statuses[0];

        const now = new Date().toISOString();
        const updated: Task = {
          ...old,
          ...task,
          uuid,
          taskBoardUUID: boardUUID,
          completionStatus: cs,
          status: "active",
          createdAt: old?.createdAt || now,
          updatedAt: now,
        };

        const ts = Date.now();
        set({
          tasks: { ...get().tasks, [uuid]: updated },
          pending: { ...get().pending, [uuid]: { timestamp: ts } },
        });

        const net = await NetInfo.fetch();
        if (net.isConnected && useAuthStore.getState().isAuthenticated) {
          const user = useAuthStore.getState().user!;
          await setDoc(COLLECTION, uuid, { ...updated, userUid: user.uid });
          const { [uuid]: _, ...rest } = get().pending;
          set({ pending: rest });
        }
      },

      deleteTask: async (uuid) => {
        const old = get().tasks[uuid];
        if (!old) return;

        const now = new Date().toISOString();
        const soft: Task = { ...old, status: "deleted", updatedAt: now };

        const ts = Date.now();
        set({
          tasks: { ...get().tasks, [uuid]: soft },
          pending: { ...get().pending, [uuid]: { timestamp: ts } },
        });

        const net = await NetInfo.fetch();
        if (net.isConnected && useAuthStore.getState().isAuthenticated) {
          const user = useAuthStore.getState().user!;
          await setDoc(COLLECTION, uuid, { ...soft, userUid: user.uid });
          const { [uuid]: _, ...rest } = get().pending;
          set({ pending: rest });
        }
      },

      syncWithFirebase: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const user = useAuthStore.getState().user!;
        const net = await NetInfo.fetch();
        if (!net.isConnected) return;

        const { tasks, pending } = get();
        const snap = await fetchAll(COLLECTION, user.uid);
        const remote: Record<string, Task> = {};
        snap.forEach((doc) => {
          remote[doc.id] = doc.data() as Task;
        });

        const merged = { ...tasks };
        for (const [id, r] of Object.entries(remote)) {
          const l = tasks[id];
          if (!l) {
            merged[id] = r;
            continue;
          }
          if (pending[id] && l.status === "deleted") {
            merged[id] = l;
            continue;
          }
          const m = { ...l };
          if (r.updatedAt && new Date(r.updatedAt) > new Date(l.updatedAt)) {
            Object.assign(m, r);
          }
          m.status = l.status === "deleted" || r.status === "deleted" ? "deleted" : "active";
          merged[id] = m;
        }
        for (const [id, l] of Object.entries(tasks)) {
          if (!remote[id] || pending[id]) {
            await setDoc(COLLECTION, id, { ...l, userUid: user.uid });
          }
        }

        set({ tasks: merged, pending: {}, lastSync: Date.now() });
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

let unsubscribe: (() => void) | null = null;
export const setupTasksListener = (userId: string | null) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (!userId) return;
  unsubscribe = listen(COLLECTION, userId, () => {
    const s = useTaskStore.getState();
    if (Date.now() - s.lastSync > 1000) {
      s.syncWithFirebase();
    }
  });
};

NetInfo.addEventListener((st) => {
  if (st.isConnected) {
    useTaskStore.getState().syncWithFirebase();
  }
});
