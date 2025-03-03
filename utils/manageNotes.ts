import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { app } from '../firebaseConfig';
import debounce from './debounce';
import { useAuthStore } from './useAuthStore';

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
  state: 'active' | 'deleted';
};

const storage = new MMKV();

const db = getFirestore(app);

interface NoteState {
  notes: { [key: string]: Note };
  pendingChanges: {
    [key: string]: { timestamp: number };
  };
  lastSyncTimestamp: number;
  activeNotesArray: () => Note[];
  saveNote: (note: Note) => Promise<void>;
  deleteNote: (uuid: string) => Promise<void>;
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

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: {},
      pendingChanges: {},
      lastSyncTimestamp: Date.now(),
      activeNotesArray: () =>
        Object.values(get().notes).filter(({ state }) => state === 'active'),

      saveNote: async (note: Partial<Note>) => {
        if (!note.uuid || note.uuid == undefined)
          throw new Error('Note uuid is required');
        const timestamp = Date.now();
        const currentNotes = get().notes;
        const pendingChanges = get().pendingChanges;

        const title = note?.title
          ? note.title?.slice(0, 100)
          : currentNotes[note.uuid]?.title || '';

        const content = note?.content
          ? note.content?.slice(0, 10000)
          : currentNotes[note.uuid]?.content || '';

        const updatedNote: Note = {
          ...currentNotes[note.uuid],
          ...note,
          title,
          titleUpdatedAt: note?.title
            ? new Date().toISOString()
            : currentNotes[note.uuid]?.titleUpdatedAt ||
              new Date().toISOString(),
          content,
          contentUpdatedAt: note?.content
            ? new Date().toISOString()
            : currentNotes[note.uuid]?.contentUpdatedAt ||
              new Date().toISOString(),
          state: 'active',
          createdAt:
            currentNotes[note.uuid]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          notes: {
            ...currentNotes,
            [note.uuid]: updatedNote,
          },
          pendingChanges: {
            ...pendingChanges,
            [note.uuid]: { timestamp },
          },
        });

        const netInfo = await NetInfo.fetch();
        const authenticated = useAuthStore.getState().isAuthenticated;

        if (netInfo.isConnected && authenticated) {
          debounce(async () => {
            try {
              const user = useAuthStore.getState().user;
              if (!user || !user.uid) throw new Error('User not authenticated');

              await setDoc(doc(db, 'notes', note.uuid), {
                ...updatedNote,
                userUid: user.uid,
              });
              const { [note.uuid]: _, ...remainingChanges } =
                get().pendingChanges;
              set({ pendingChanges: remainingChanges });
            } catch (error) {
              console.error('Failed to sync with Firebase:', error);
            }
          }, 500);
        }
      },

      deleteNote: async (uuid: string) => {
        const timestamp = Date.now();
        const currentNotes = get().notes;
        const pendingChanges = get().pendingChanges;

        if (!currentNotes[uuid]) return;
        // Soft delete by updating the state
        const softDeletedNote: Note = {
          uuid,
          state: 'deleted',
          updatedAt: new Date().toISOString(),
        };

        set({
          notes: {
            ...currentNotes,
            [uuid]: softDeletedNote,
          },
          pendingChanges: {
            ...pendingChanges,
            [uuid]: { timestamp },
          },
        });

        // Try to sync with Firebase if online
        const netInfo = await NetInfo.fetch();
        const authenticated = useAuthStore.getState().isAuthenticated;
        if (netInfo.isConnected && authenticated) {
          try {
            const user = useAuthStore.getState().user;
            if (!user || !user.uid) throw new Error('User not authenticated');
            await setDoc(doc(db, 'notes', uuid), {
              ...softDeletedNote,
              userUid: user.uid,
            });
            // Remove from pending changes if sync successful
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
        const { notes, pendingChanges } = state;

        try {
          // 1. Fetch notes from Firebase
          const notesQuery = query(
            collection(db, 'notes'),
            where('userUid', '==', user.uid),
          );
          const querySnapshot = await getDocs(notesQuery);
          const firebaseNotes: { [key: string]: Note } = {};

          querySnapshot.forEach((doc) => {
            firebaseNotes[doc.id] = { ...doc.data() } as Note;
          });

          const mergedNotes = { ...notes };

          // 2. Merge Firebase notes into local notes
          for (const [uuid, firebaseNote] of Object.entries(firebaseNotes)) {
            const localNote = notes[uuid];

            // If the note doesn't exist locally, add it from Firebase
            if (!localNote) {
              mergedNotes[uuid] = firebaseNote;
              continue;
            }

            // Handle pending changes
            const pendingChange = pendingChanges[uuid];
            if (pendingChange) {
              // If there's a pending delete, respect the local deletion
              if (localNote.state === 'deleted') {
                mergedNotes[uuid] = localNote;
                continue;
              }
            }

            // Field-level conflict resolution
            const mergedNote = { ...localNote }; // Start with local note

            // Compare timestamps and merge fields
            if (firebaseNote.titleUpdatedAt && localNote.titleUpdatedAt) {
              const localTitleTime = new Date(
                localNote.titleUpdatedAt,
              ).getTime();
              const remoteTitleTime = new Date(
                firebaseNote.titleUpdatedAt,
              ).getTime();
              if (remoteTitleTime > localTitleTime) {
                mergedNote.title = firebaseNote.title;
                mergedNote.titleUpdatedAt = firebaseNote.titleUpdatedAt;
              }
            } else if (firebaseNote.titleUpdatedAt) {
              mergedNote.title = firebaseNote.title;
              mergedNote.titleUpdatedAt = firebaseNote.titleUpdatedAt;
            }

            if (firebaseNote.contentUpdatedAt && localNote.contentUpdatedAt) {
              const localContentTime = new Date(
                localNote.contentUpdatedAt,
              ).getTime();
              const remoteContentTime = new Date(
                firebaseNote.contentUpdatedAt,
              ).getTime();
              if (remoteContentTime > localContentTime) {
                mergedNote.content = firebaseNote.content;
                mergedNote.contentUpdatedAt = firebaseNote.contentUpdatedAt;
              }
            } else if (firebaseNote.contentUpdatedAt) {
              mergedNote.content = firebaseNote.content;
              mergedNote.contentUpdatedAt = firebaseNote.contentUpdatedAt;
            }

            // Handle state (soft delete) - local takes precedence
            if (localNote.state === 'deleted') {
              mergedNote.state = 'deleted';
            } else if (firebaseNote.state === 'deleted') {
              mergedNote.state = 'deleted';
            } else {
              mergedNote.state = 'active';
            }

            mergedNote.updatedAt = new Date().toISOString();
            mergedNotes[uuid] = mergedNote;
          }

          // 3. Process local notes that are not in Firebase or have pending changes
          for (const [uuid, localNote] of Object.entries(notes)) {
            const firebaseNote = firebaseNotes[uuid];
            const pendingChange = pendingChanges[uuid];

            // If the note doesn't exist in Firebase or has pending changes, update Firebase
            if (!firebaseNote || pendingChange) {
              // If it's a new note or has pending changes, push to Firebase
              try {
                await setDoc(doc(db, 'notes', uuid), {
                  ...localNote,
                  userUid: user.uid,
                });
              } catch (error) {
                console.error('Failed to sync note to Firebase:', error);
              }
              continue;
            }
          }

          // 4. Update local state
          set({
            notes: mergedNotes,
            pendingChanges: {},
            lastSyncTimestamp: Date.now(),
          });
        } catch (error) {
          console.error('Failed to sync with Firebase:', error);
        }
      },
    }),
    {
      name: 'note-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

// Set up real-time sync listener only when needed
let unsubscribe: (() => void) | null = null;

// Setup listener function
const setupFirebaseListener = (userId: string | null) => {
  // Clean up any existing listener
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  // Only setup listener if there's a logged-in user
  if (userId) {
    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
    );

    unsubscribe = onSnapshot(notesQuery, () => {
      const store = useNoteStore.getState();
      if (store.lastSyncTimestamp < Date.now() - 1000) {
        // Prevent sync loops
        store.syncWithFirebase();
      }
    });
  }
};

// Setup network state listener
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useNoteStore.getState().syncWithFirebase();
  }
});
