// src/stores/useNoteStore.ts
import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

import { useAuthStore } from "./useAuthStore";
import {
  setDoc,
  deleteDoc,
  fetchAll,
  listen
} from "../firestoreAdapter";

export type Note = {
  uuid: string;
  title?: string;
  titleUpdatedAt?: string;
  content?: string;
  contentUpdatedAt?: string;
  tags?: string[];
  endsAt?: string;
  createdAt?: string;
  updatedAt: string;
  state: "active" | "deleted";
};

const storage = new MMKV();
const CST = "notes";
const zustandStorage = {
  getItem: (name: string) => {
    const v = storage.getString(name);
    return v ? JSON.parse(v) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  }
};

interface NoteState {
  notes: Record<string, Note>;
  pending: Record<string, { timestamp: number }>;
  lastSync: number;
  activeNotesArray: () => Note[];
  notesWithTag: (tag: string) => Note[];
  saveNote: (note: Partial<Note>) => Promise<void>;
  deleteNote: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: {},
      pending: {},
      lastSync: Date.now(),
      activeNotesArray: () =>
        Object.values(get().notes).filter((n) => n.state === "active"),
      notesWithTag: (tag) =>
        Object.values(get().notes).filter((n) => n.tags?.includes(tag)),

      saveNote: async (note) => {
        const uuid = note.uuid || uuidv4();
        const nowIso = new Date().toISOString();
        const old = get().notes[uuid] || {};
        const title =
          note.title !== undefined
            ? note.title.slice(0, 100)
            : old.title || "";
        const content =
          note.content !== undefined
            ? note.content.slice(0, 10000)
            : old.content || "";
        const updated: Note = {
          ...old,
          ...note,
          uuid,
          title,
          titleUpdatedAt:
            note.title !== undefined
              ? nowIso
              : old.titleUpdatedAt || nowIso,
          content,
          contentUpdatedAt:
            note.content !== undefined
              ? nowIso
              : old.contentUpdatedAt || nowIso,
          state: "active",
          createdAt: old.createdAt || nowIso,
          updatedAt: nowIso
        };
        const ts = Date.now();
        set({
          notes: { ...get().notes, [uuid]: updated },
          pending: { ...get().pending, [uuid]: { timestamp: ts } }
        });
        const info = await NetInfo.fetch();
        if (
          info.isConnected &&
          useAuthStore.getState().isAuthenticated
        ) {
          const user = useAuthStore.getState().user!;
          await setDoc(CST, uuid, { ...updated, userUid: user.uid });
          const { [uuid]: _, ...rest } = get().pending;
          set({ pending: rest });
        }
      },

      deleteNote: async (uuid) => {
        const old = get().notes[uuid];
        if (!old) return;
        const nowIso = new Date().toISOString();
        const soft: Note = {
          ...old,
          state: "deleted",
          updatedAt: nowIso
        };
        const ts = Date.now();
        set({
          notes: { ...get().notes, [uuid]: soft },
          pending: { ...get().pending, [uuid]: { timestamp: ts } }
        });
        const info = await NetInfo.fetch();
        if (
          info.isConnected &&
          useAuthStore.getState().isAuthenticated
        ) {
          const user = useAuthStore.getState().user!;
          await setDoc(CST, uuid, { ...soft, userUid: user.uid });
          const { [uuid]: _, ...rest } = get().pending;
          set({ pending: rest });
        }
      },

      syncWithFirebase: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;
        const user = useAuthStore.getState().user!;
        const info = await NetInfo.fetch();
        if (!info.isConnected) return;
        const { notes, pending } = get();
        const snap = await fetchAll(CST, user.uid);
        const remote: Record<string, Note> = {};
        snap.forEach((doc) => {
          remote[doc.id] = doc.data() as Note;
        });
        const merged = { ...notes };
        for (const [id, r] of Object.entries(remote)) {
          const l = notes[id];
          if (!l) {
            merged[id] = r;
            continue;
          }
          if (pending[id] && l.state === "deleted") {
            merged[id] = l;
            continue;
          }
          const m = { ...l };
          if (r.updatedAt && new Date(r.updatedAt) > new Date(l.updatedAt)) {
            Object.assign(m, r);
          }
          m.state =
            l.state === "deleted" || r.state === "deleted"
              ? "deleted"
              : "active";
          merged[id] = m;
        }
        for (const [id, l] of Object.entries(notes)) {
          if (!remote[id] || pending[id]) {
            await setDoc(CST, id, { ...l, userUid: user.uid });
          }
        }
        set({
          notes: merged,
          pending: {},
          lastSync: Date.now()
        });
      }
    }),
    {
      name: "note-storage",
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);

let unsub: (() => void) | null = null;
export const setupNotesListener = (userId: string | null) => {
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (!userId) return;
  unsub = listen(CST, userId, () => {
    const s = useNoteStore.getState();
    if (Date.now() - s.lastSync > 1000) {
      s.syncWithFirebase();
    }
  });
};

NetInfo.addEventListener((st) => {
  if (st.isConnected) {
    useNoteStore.getState().syncWithFirebase();
  }
});
