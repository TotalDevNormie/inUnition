// src/stores/useTaskBoardStore.ts
import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

import { useTaskStore } from "./manageTasks";
import { useAuthStore } from "./useAuthStore";
import {
  setDoc,
  fetchAll,
  listen
} from "../firestoreAdapter";

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
  status?: "active" | "deleted";
  tags?: string[];
};

const storage = new MMKV();
const COLLECTION = "taskBoards";

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

interface TaskBoardState {
  taskBoards: Record<string, TaskBoard>;
  pending: Record<string, { timestamp: number }>;
  lastSync: number;

  // renamed methods:
  activeTaskBoards: () => TaskBoard[];
  taskBoardsWithTag: (tag: string) => TaskBoard[];

  getTaskBoard: (uuid: string) => TaskBoard | null;
  saveTaskBoard: (tb: Partial<TaskBoard>) => Promise<string>;
  deleteTaskBoard: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

export const useTaskBoardStore = create<TaskBoardState>()(
  persist(
    (set, get) => ({
      taskBoards: {},
      pending: {},
      lastSync: Date.now(),

      activeTaskBoards: () =>
        Object.values(get().taskBoards).filter((b) => b.status === "active"),

      taskBoardsWithTag: (tag: string) =>
        Object.values(get().taskBoards).filter((b) => b.tags?.includes(tag)),

      getTaskBoard: (uuid: string) => get().taskBoards[uuid] || null,

      saveTaskBoard: async (board) => {
        const uuid = board.uuid || uuidv4();
        const old = get().taskBoards[uuid];
        const now = new Date().toISOString();
        const newBoard: TaskBoard = {
          ...old,
          ...board,
          uuid,
          createdAt: old?.createdAt || now,
          updatedAt: now,
          status: "active",
        };
        set({
          taskBoards: { ...get().taskBoards, [uuid]: newBoard },
          pending: { ...get().pending, [uuid]: { timestamp: Date.now() } },
        });
        const net = await NetInfo.fetch();
        if (net.isConnected && useAuthStore.getState().isAuthenticated) {
          const user = useAuthStore.getState().user!;
          await setDoc(COLLECTION, uuid, { ...newBoard, userUid: user.uid });
          const { [uuid]: _, ...rest } = get().pending;
          set({ pending: rest });
        }
        return uuid;
      },

      deleteTaskBoard: async (uuid: string) => {
        const old = get().taskBoards[uuid];
        if (!old) return;
        const now = new Date().toISOString();
        const soft: TaskBoard = { uuid, status: "deleted", updatedAt: now };
        set({
          taskBoards: { ...get().taskBoards, [uuid]: soft },
          pending: { ...get().pending, [uuid]: { timestamp: Date.now() } },
        });

        // cascade delete tasks
        const tasks = useTaskStore.getState().tasksFromBoard(uuid);
        await Promise.all(tasks.map((t) => useTaskStore.getState().deleteTask(t.uuid)));

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
        const { taskBoards, pending } = get();
        const snap = await fetchAll(COLLECTION, user.uid);
        const remote: Record<string, TaskBoard> = {};
        snap.forEach((doc) => {
          remote[doc.id] = doc.data() as TaskBoard;
        });

        const merged = { ...taskBoards };
        for (const [id, r] of Object.entries(remote)) {
          const l = taskBoards[id];
          if (!l) {
            merged[id] = r;
            continue;
          }
          if (pending[id] && l.status === "deleted") {
            merged[id] = l;
            continue;
          }
          const m = { ...l };
          if (r.updatedAt && new Date(r.updatedAt) > new Date(l.updatedAt!)) {
            Object.assign(m, r);
          }
          m.status = r.status === "deleted" || l.status === "deleted" ? "deleted" : "active";
          merged[id] = m;
        }

        for (const [id, l] of Object.entries(taskBoards)) {
          if (!remote[id] || pending[id]) {
            await setDoc(COLLECTION, id, { ...l, userUid: user.uid });
          }
        }

        set({ taskBoards: merged, pending: {}, lastSync: Date.now() });
      },
    }),
    {
      name: "task-board-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// listener
let unsub: (() => void) | null = null;
export const setupTaskBoardsListener = (userId: string | null) => {
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (!userId) return;
  unsub = listen(COLLECTION, userId, () => {
    const s = useTaskBoardStore.getState();
    if (Date.now() - s.lastSync > 1000) {
      s.syncWithFirebase();
    }
  });
};

NetInfo.addEventListener((st) => {
  if (st.isConnected) {
    useTaskBoardStore.getState().syncWithFirebase();
  }
});
