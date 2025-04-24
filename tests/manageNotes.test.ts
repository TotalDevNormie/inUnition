import { useNoteStore, setupNotesListener } from '~/utils/manageNotes';
import firestore from '@react-native-firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Assuming '../firebaseConfig' exports the web db instance
import { Platform } from 'react-native';

describe('useNoteStore', () => {
  const userId = 'test-user-123'; // Must match the mocked useAuthStore UID

  beforeEach(() => {
    // Ensure the listener is set up before tests that rely on sync
    setupNotesListener(userId);
  });

  afterEach(() => {
    // Clear the store state (another way to reset)
    useNoteStore.setState({
      notes: {},
      pendingChanges: {},
      lastSyncTimestamp: Date.now(),
    });
  });

  it('should initialize with empty notes', () => {
    const store = useNoteStore.getState();
    expect(Object.keys(store.notes).length).toBe(0);
  });

  it('should save a note locally', async () => {
    const store = useNoteStore.getState();
    const newNoteUuid = 'note-abc-123';
    const noteData = {
      uuid: newNoteUuid,
      title: 'My first note',
      content: 'This is the content.',
    };

    await store.saveNote(noteData);

    const stateAfterSave = useNoteStore.getState();
    expect(stateAfterSave.notes[newNoteUuid]).toBeDefined();
    expect(stateAfterSave.notes[newNoteUuid].title).toBe('My first note');
    expect(stateAfterSave.pendingChanges[newNoteUuid]).toBeDefined();
  });

  it('should sync a saved note to Firebase', async () => {
    const store = useNoteStore.getState();
    const newNoteUuid = 'note-def-456';
    const noteData = {
      uuid: newNoteUuid,
      title: 'Note to sync',
      content: 'Content to be synced.',
    };

    // Since debounce is mocked to be immediate, this should trigger the sync
    await store.saveNote(noteData);

    // Give Firestore a moment to process the write (though emulator is usually fast)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check if the note exists in the emulator
    let firebaseNoteData;
    if (Platform.OS !== 'web') {
      const docSnap = await firestore().collection('notes').doc(newNoteUuid).get();
      firebaseNoteData = docSnap.exists ? docSnap.data() : undefined;
    } else {
      // Use the web SDK syntax if Platform.OS is 'web'
      const notesCollectionRef = collection(db, 'notes');
      const q = query(notesCollectionRef, where('uuid', '==', newNoteUuid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        firebaseNoteData = querySnapshot.docs[0].data();
      }
    }


    expect(firebaseNoteData).toBeDefined();
    expect(firebaseNoteData?.title).toBe('Note to sync');
    expect(firebaseNoteData?.userUid).toBe(userId);

    // Check that pending changes are cleared after successful sync
    const stateAfterSync = useNoteStore.getState();
    expect(stateAfterSync.pendingChanges[newNoteUuid]).toBeUndefined();
  });

  it('should soft delete a note locally and sync to Firebase', async () => {
    const store = useNoteStore.getState();
    const noteToDeleteUuid = 'note-ghi-789';
    const initialNoteData = {
      uuid: noteToDeleteUuid,
      title: 'Note to delete',
      content: 'Should be deleted.',
      state: 'active' as 'active' | 'deleted',
      updatedAt: new Date().toISOString(),
    };

    // Manually add a note first to simulate it existing
    useNoteStore.setState((state) => ({
      notes: { ...state.notes, [noteToDeleteUuid]: initialNoteData },
    }));

    await store.deleteNote(noteToDeleteUuid);

    const stateAfterDelete = useNoteStore.getState();
    expect(stateAfterDelete.notes[noteToDeleteUuid].state).toBe('deleted');
    expect(stateAfterDelete.pendingChanges[noteToDeleteUuid]).toBeDefined();

    // Give Firestore a moment to process the write
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check if the note is marked as deleted in the emulator
    let firebaseNoteData;
    if (Platform.OS !== 'web') {
      const docSnap = await firestore().collection('notes').doc(noteToDeleteUuid).get();
      firebaseNoteData = docSnap.exists ? docSnap.data() : undefined;
    } else {
      const notesCollectionRef = collection(db, 'notes');
      const q = query(notesCollectionRef, where('uuid', '==', noteToDeleteUuid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        firebaseNoteData = querySnapshot.docs[0].data();
      }
    }


    expect(firebaseNoteData).toBeDefined();
    expect(firebaseNoteData?.state).toBe('deleted');

    // Check that pending changes are cleared after successful sync
    const stateAfterSync = useNoteStore.getState();
    expect(stateAfterSync.pendingChanges[noteToDeleteUuid]).toBeUndefined();
  });

  // You could add more tests for syncWithFirebase merging logic, etc.
});
