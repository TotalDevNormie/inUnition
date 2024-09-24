import AsyncStorage from '@react-native-async-storage/async-storage';

export type Note = {
    title: string,
    content: string,
    created_at: string
    updated_at: string
}

type NoteObject = {
    [key: string]: Note
}

export const getAllNotes = async () => {
    const notes = await AsyncStorage.getItem('notes');

    return notes ? JSON.parse(notes) as NoteObject : null;
}

export const getNote = async (noteUUID: string) => {
    const notes = await getAllNotes();
    if (!notes) return null;
    return notes[noteUUID] ?? null;
}

export const saveNote = async (note: Pick<Note, 'title' | 'content'>, noteUUID: string) => {
    if (!noteUUID) {
        throw new Error('Note UUID is required');
    }
    if (note?.title.length === 0) {
        throw new Error('Note title is required');
    }

    if (note?.content.length === 0) {
        throw new Error('Note content is required');
    }

    const oldNote = await getNote(noteUUID);

    let newNote = {
        title: note.title.slice(0, 255),
        content: note.content,
        created_at: oldNote ? oldNote.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
    } as Note;
    const notes = await getAllNotes();
    const newNotes = notes ? { ...notes, [noteUUID]: newNote } : { [noteUUID]: newNote };
    await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
    return note;
}

export const deleteNote = async (noteUUID: string) => {
    const notes = await getAllNotes();
    const newNotes = notes ? { ...notes } : {};
    delete newNotes[noteUUID];
    await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
    return null;
}
