import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import NetInfo from "@react-native-community/netinfo";
import debounce from "./debounce";
import { useAuthStore } from "./useAuthStore";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebaseConfig";

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
  }
};

interface NoteState {
  notes: { [key: string]: Note };
  pendingChanges: { [key: string]: { timestamp: number } };
  lastSyncTimestamp: number;
  activeNotesArray: () => Note[];
  saveNote: (note: Partial<Note>) => Promise<void>;
  deleteNote: (uuid: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
  notesWithTag: (tag: string) => Note[];
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => {
      const debouncedFirebaseSync = debounce(
        async (updatedNote: Note) => {
          try {
            const user = useAuthStore.getState().user;
            if (!user || !user.uid)
              throw new Error("User not authenticated");
            console.log("sent to firebase", updatedNote.content);
            await setDoc(doc(db, "notes", updatedNote.uuid), {
              ...updatedNote,
              userUid: user.uid
            });
            const { [updatedNote.uuid]: _, ...remainingChanges } =
              get().pendingChanges;
            set({ pendingChanges: remainingChanges });
          } catch (error) {
            console.error("Failed to sync with Firebase:", error);
          }
        },
        2000
      );

      return {
        notes: {},
        pendingChanges: {},
        lastSyncTimestamp: Date.now(),
        activeNotesArray: () =>
          Object.values(get().notes).filter(
            ({ state }) => state === "active"
          ),
        notesWithTag: (tag: string) =>
          Object.values(get().notes).filter((note) => note.tags?.includes(tag)),

        saveNote: async (note: Partial<Note>) => {
          if (!note.uuid) throw new Error("Note uuid is required");
          const timestamp = Date.now();
          const currentNotes = get().notes;
          const pendingChanges = get().pendingChanges;

          // Determine title and content (trimming lengths)
          const title =
            note.title !== undefined
              ? note.title.slice(0, 100)
              : currentNotes[note.uuid]?.title || "";
          const content =
            note.content !== undefined
              ? note.content.slice(0, 10000)
              : currentNotes[note.uuid]?.content || "";

          const updatedNote: Note = {
            ...currentNotes[note.uuid],
            ...note,
            title,
            titleUpdatedAt: note.title
              ? new Date().toISOString()
              : currentNotes[note.uuid]?.titleUpdatedAt ||
                new Date().toISOString(),
            content,
            contentUpdatedAt: note.content
              ? new Date().toISOString()
              : currentNotes[note.uuid]?.contentUpdatedAt ||
                new Date().toISOString(),
            state: "active",
            createdAt:
              currentNotes[note.uuid]?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          set({
            notes: { ...currentNotes, [note.uuid]: updatedNote },
            pendingChanges: {
              ...pendingChanges,
              [note.uuid]: { timestamp }
            }
          });

          const netInfo = await NetInfo.fetch();
          const authenticated =
            useAuthStore.getState().isAuthenticated;
          console.log("saved locally", note.content);

          if (netInfo.isConnected && authenticated) {
            debouncedFirebaseSync(updatedNote);
          }
        },

        deleteNote: async (uuid: string) => {
          const timestamp = Date.now();
          const currentNotes = get().notes;
          const pendingChanges = get().pendingChanges;

          if (!currentNotes[uuid]) return;

          const softDeletedNote: Note = {
            ...currentNotes[uuid],
            uuid,
            state: "deleted",
            updatedAt: new Date().toISOString()
          };

          set({
            notes: { ...currentNotes, [uuid]: softDeletedNote },
            pendingChanges: {
              ...pendingChanges,
              [uuid]: { timestamp }
            }
          });

          const netInfo = await NetInfo.fetch();
          const authenticated =
            useAuthStore.getState().isAuthenticated;
          if (netInfo.isConnected && authenticated) {
            try {
              const user = useAuthStore.getState().user;
              if (!user || !user.uid)
                throw new Error("User not authenticated");
              await setDoc(doc(db, "notes", uuid), {
                ...softDeletedNote,
                userUid: user.uid
              });
              const { [uuid]: _, ...remainingChanges } =
                get().pendingChanges;
              set({ pendingChanges: remainingChanges });
            } catch (error) {
              console.error(
                "Failed to sync deletion with Firebase:",
                error
              );
            }
          }
        },

        syncWithFirebase: async () => {
          const authenticated =
            useAuthStore.getState().isAuthenticated;
          const user = useAuthStore.getState().user;
          const netInfo = await NetInfo.fetch();
          if (
            !netInfo.isConnected ||
            !authenticated ||
            !user ||
            !user.uid
          )
            return;

          const { notes, pendingChanges } = get();
          try {
            const notesRef = collection(db, "notes");
            const notesQuery = query(
              notesRef,
              where("userUid", "==", user.uid)
            );
            const querySnapshot = await getDocs(notesQuery);
            const firebaseNotes: { [key: string]: Note } = {};

            querySnapshot.forEach((docSnap) => {
              firebaseNotes[docSnap.id] = docSnap.data() as Note;
            });

            const mergedNotes = { ...notes };

            for (const [uuid, firebaseNote] of Object.entries(
              firebaseNotes
            )) {
              const localNote = notes[uuid];

              if (!localNote) {
                mergedNotes[uuid] = firebaseNote;
                continue;
              }

              const pendingChange = pendingChanges[uuid];
              if (pendingChange && localNote.state === "deleted") {
                mergedNotes[uuid] = localNote;
                continue;
              }

              const mergedNote = { ...localNote };

              if (
                firebaseNote.titleUpdatedAt &&
                localNote.titleUpdatedAt
              ) {
                const localTitleTime = new Date(
                  localNote.titleUpdatedAt
                ).getTime();
                const remoteTitleTime = new Date(
                  firebaseNote.titleUpdatedAt
                ).getTime();
                if (remoteTitleTime > localTitleTime) {
                  mergedNote.title = firebaseNote.title;
                  mergedNote.titleUpdatedAt =
                    firebaseNote.titleUpdatedAt;
                }
              } else if (firebaseNote.titleUpdatedAt) {
                mergedNote.title = firebaseNote.title;
                mergedNote.titleUpdatedAt =
                  firebaseNote.titleUpdatedAt;
              }

              if (
                firebaseNote.contentUpdatedAt &&
                localNote.contentUpdatedAt
              ) {
                const localContentTime = new Date(
                  localNote.contentUpdatedAt
                ).getTime();
                const remoteContentTime = new Date(
                  firebaseNote.contentUpdatedAt
                ).getTime();
                if (remoteContentTime > localContentTime) {
                  mergedNote.content = firebaseNote.content;
                  mergedNote.contentUpdatedAt =
                    firebaseNote.contentUpdatedAt;
                }
              } else if (firebaseNote.contentUpdatedAt) {
                mergedNote.content = firebaseNote.content;
                mergedNote.contentUpdatedAt =
                  firebaseNote.contentUpdatedAt;
              }

              if (firebaseNote.updatedAt && localNote.updatedAt) {
                const localTime = new Date(
                  localNote.updatedAt
                ).getTime();
                const remoteTime = new Date(
                  firebaseNote.updatedAt
                ).getTime();
                mergedNote.updatedAt =
                  remoteTime > localTime
                    ? firebaseNote.updatedAt
                    : localNote.updatedAt;
              } else if (firebaseNote.updatedAt) {
                mergedNote.updatedAt = firebaseNote.updatedAt;
              }

              mergedNote.state =
                localNote.state === "deleted" ||
                firebaseNote.state === "deleted"
                  ? "deleted"
                  : "active";

              mergedNotes[uuid] = mergedNote;
            }

            for (const [uuid, localNote] of Object.entries(notes)) {
              const firebaseNote = firebaseNotes[uuid];
              const pendingChange = pendingChanges[uuid];
              if (!firebaseNote || pendingChange) {
                try {
                  await setDoc(doc(db, "notes", uuid), {
                    ...localNote,
                    userUid: user.uid
                  });
                } catch (error) {
                  console.error("Failed to sync note to Firebase:", error);
                }
              }
            }

            set({
              notes: mergedNotes,
              pendingChanges: {},
              lastSyncTimestamp: Date.now()
            });
          } catch (error) {
            console.error("Failed to sync with Firebase:", error);
          }
        }
      };
    },
    {
      name: "note-storage",
      storage: createJSONStorage(() => zustandStorage)
    }
  )
);

let unsubscribe: (() => void) | null = null;

export const setupNotesListener = (userId: string | null) => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (userId) {
    const notesRef = collection(db, "notes");
    const notesQuery = query(notesRef, where("userUid", "==", userId));
    unsubscribe = onSnapshot(notesQuery, () => {
      const store = useNoteStore.getState();
      if (store.lastSyncTimestamp < Date.now() - 1000) {
        store.syncWithFirebase();
      }
    });
  }
};

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useNoteStore.getState().syncWithFirebase();
  }
});
