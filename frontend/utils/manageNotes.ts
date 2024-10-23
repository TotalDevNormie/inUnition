import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { cleanupTags, getTagsFormUUID, saveTags } from "./manageTags";
import { useAuth } from "../components/auth/AuthContext";
import sendRequest from "./sendrequest";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "../app/_layout";
const NOTES = "notes";
export type Note = {
  title: string;
  content: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
};

export type NoteWithUUID = Note & {
  uuid: string;
};

export type FullNote = Note & {
  tags: string[];
};
type NoteObject = {
  [key: string]: Note;
};

export const getAllNotes = async (getFromBuffer: boolean = false) => {
  let notes: null | NoteObject = null;
  if (Platform.OS === "web") {
    const notesStirng = localStorage.getItem(NOTES);
    notes = notesStirng ? (JSON.parse(notesStirng) as NoteObject) : null;
  } else {
    const fileUri = `${FileSystem.documentDirectory}${NOTES}${getFromBuffer ? "-buffer" : ""}.json`;
    const fileExists = await FileSystem.getInfoAsync(fileUri);
    if (!fileExists.exists) {
      return null;
    }
    const file = await FileSystem.readAsStringAsync(fileUri);
    notes = file ? (JSON.parse(file) as NoteObject) : null;
  }
  if (!getFromBuffer) {
    getNotesFromDB();
  }

  return notes;
};

export const compareTimestamps = (
  firstTimestamp: string,
  secondTimestamp: string,
) => {
  const firstDate = new Date(firstTimestamp);

  const secondDate = new Date(secondTimestamp);

  if (firstDate.getTime() === secondDate.getTime()) {
    return 0;
  } else if (firstDate.getTime() > secondDate.getTime()) {
    return 1;
  } else {
    return -1;
  }
};

export const getNotesFromDB = async (shouldGetAllNotes: boolean = false) => {
  const lastSync = await AsyncStorage.getItem("lastNoteSync");
  let options: RequestInit = { method: "POST" };
  if (lastSync && !shouldGetAllNotes) {
    options.body = JSON.stringify({
      timestamp: lastSync,
    });
  }
  try {
    const { notes, deleted } = await sendRequest<{
      notes: NoteWithUUID[];
      deleted: { uuid: string }[];
    }>("/notes", options, true);

    if (notes.length === 0 && deleted.length === 0) return;

    await Promise.all(deleted.map((entry) => deleteNote(entry.uuid)));

    const allNotes = await getAllNotes();
    const deletedEntries = JSON.parse(
      (await AsyncStorage.getItem("deletedEntries")) || "[]",
    );

    notes.map((newNote) => {
      if (deletedEntries && deletedEntries.includes(newNote.uuid)) {
        return;
      }

      if (
        !allNotes ||
        !allNotes[newNote.uuid] ||
        compareTimestamps(
          newNote.updated_at,
          allNotes[newNote.uuid].updated_at,
        ) > 0
      ) {
        saveNote({ ...newNote }, [], newNote.uuid);
      }
    }),
      await AsyncStorage.setItem("lastNoteSync", new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["notes"] });
  } catch (error) {}
};

export const getNote = async (
  noteUUID: string,
  getFromBuffer: boolean = false,
): Promise<FullNote | null> => {
  const notes = await getAllNotes(getFromBuffer);
  if (!notes || !notes[noteUUID]) return null;

  return {
    ...notes[noteUUID],
    tags: await getTagsFormUUID(noteUUID),
  } as FullNote;
};
export const saveNote = async (
  note: Pick<Note, "title" | "content" | "ends_at">,
  tags: string[],
  noteUUID: string,
  saveToBuffer: boolean = false,
) => {
  if (!noteUUID) {
    throw new Error("Note UUID is required");
  }
  try {
    let oldNote: null | Note = null;
    try {
      oldNote = await getNote(noteUUID);
    } catch (error) {
      console.log("Error fetching old note:", error);
    }
    let newNote = {
      title: note.title.slice(0, 100),
      content: note.content,
      ends_at: note.ends_at,
      created_at: oldNote ? oldNote.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Note;
    const notes = await getAllNotes(saveToBuffer);
    const newNotes = notes
      ? { ...notes, [noteUUID]: newNote }
      : { [noteUUID]: newNote };
    if (!saveToBuffer) {
      await saveTags(tags, noteUUID, "note");
    }
    if (Platform.OS === "web") {
      localStorage.setItem(
        `notes${saveToBuffer ? "-buffer" : ""}`,
        JSON.stringify(newNotes),
      );
    } else {
      const fileUri = `${FileSystem.documentDirectory}${NOTES}${saveToBuffer ? "-buffer" : ""}.json`;
      try {
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
      } catch (error) {
        console.error("Error writing to file:", error);
        throw error; // Rethrow to be caught by outer try-catch
      }
    }

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        await sendRequest(
          "/notes/save",
          {
            body: JSON.stringify({ ...newNote, uuid: noteUUID }),
            method: "POST",
          },
          true,
        );
      } catch (error) {
        console.error("Error sending request:", error);
        if (!saveToBuffer) {
          await saveNote(newNote, [], noteUUID, true);
        }
      }
    } else if (!saveToBuffer) {
      await saveNote(newNote, [], noteUUID, true);
    }
    return note;
  } catch (e) {
    console.error("Error in saveNote:", e);
    throw e; // Rethrow the error for the caller to handle
  }
};
export const deleteNote = async (noteUUID: string) => {
  const notes = await getAllNotes();
  const newNotes = notes ? { ...notes } : {};
  delete newNotes[noteUUID];
  cleanupTags(noteUUID);

  const oldDeletedEntries = await AsyncStorage.getItem("deletedEntries");
  if (oldDeletedEntries) {
    const deleted = JSON.parse(oldDeletedEntries);
    deleted.push(noteUUID);
    await AsyncStorage.setItem("deletedEntries", JSON.stringify(deleted));
  } else {
    await AsyncStorage.setItem("deletedEntries", JSON.stringify([noteUUID]));
  }

  if (Platform.OS === "web") {
    localStorage.setItem(NOTES, JSON.stringify(newNotes));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
  }
  NetInfo.fetch().then(async (state) => {
    if (state.isConnected) {
      try {
        sendRequest(
          "/notes/delete",
          { body: JSON.stringify({ uuid: noteUUID }), method: "POST" },
          true,
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    } else {
      const oldDeletedEntriesBuffer = await AsyncStorage.getItem(
        "deletedEntries-buffer",
      );

      if (oldDeletedEntriesBuffer) {
        const deleted = JSON.parse(oldDeletedEntriesBuffer);
        deleted.push(noteUUID);
        await AsyncStorage.setItem(
          "deletedEntries-buffer",
          JSON.stringify(deleted),
        );
      } else {
        await AsyncStorage.setItem(
          "deletedEntries-buffer",
          JSON.stringify([noteUUID]),
        );
      }
    }
  });
  return null;
};
