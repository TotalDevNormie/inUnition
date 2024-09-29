import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { cleanupTags, getTagsFormUUID, saveTags } from './manageTags';
const NOTES = 'notes';
export type Note = {
    title: string,
    content: string,
    created_at: string
    updated_at: string
}

export type FullNote = Note & {
    tags: string[]
}
type NoteObject = {
    [key: string]: Note
}

export const getAllNotes = async () => {
    if (Platform.OS === 'web') {
        const notes = localStorage.getItem(NOTES);
        return notes ? JSON.parse(notes) as NoteObject : null;
    }
    const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
    const fileExists = await FileSystem.getInfoAsync(fileUri);
    if (!fileExists.exists) {
        return null;
    }
    const file = await FileSystem.readAsStringAsync(fileUri);
    return file ? JSON.parse(file) as NoteObject : null;
}
export const getNote = async (noteUUID: string): Promise<FullNote | null> => {
    const notes = await getAllNotes();
    if (!notes || !notes[noteUUID]) return null;

    return {
        ...notes[noteUUID],
        tags: await getTagsFormUUID(noteUUID)
    } as FullNote;
}
export const saveNote = async (note: Pick<Note, 'title' | 'content'>, tags: string[], noteUUID: string) => {
    console.log("works");
    if (!noteUUID) {
        throw new Error('Note UUID is required');
    }
    if (note?.title.length === 0) {
        throw new Error('Note title is required');
    }
    if (note?.content.length === 0) {
        throw new Error('Note content is required');
    }
    console.log("works2");

    console.log('works i guess');
    let oldNote;
    try {
        oldNote = await getNote(noteUUID);
    } catch (error) {
        console.log(error);
    }
    let newNote = {
        title: note.title.slice(0, 255),
        content: note.content,
        created_at: oldNote ? oldNote.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
    } as Note;
    const notes = await getAllNotes();
    const newNotes = notes ? { ...notes, [noteUUID]: newNote } : { [noteUUID]: newNote };

    await saveTags(tags, noteUUID, 'note');

    if (Platform.OS === 'web') {
        localStorage.setItem('notes', JSON.stringify(newNotes));
        console.log("works3");
    } else {
        const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
        console.log("works3");

        try {
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
            console.log("works4");
        } catch (error) {
            console.log(error);
        }
    }
    console.log(newNotes);
    return note;
}
export const deleteNote = async (noteUUID: string) => {
    const notes = await getAllNotes();
    const newNotes = notes ? { ...notes } : {};
    delete newNotes[noteUUID];
    cleanupTags(noteUUID);
    if (Platform.OS === 'web') {
        localStorage.setItem(NOTES, JSON.stringify(newNotes));
    } else {
        const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
    }
    return null;
}
