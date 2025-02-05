import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { cleanupTags, getTagsFormUUID, saveTags } from "./manageTags";
import { useAuth } from "../components/auth/AuthContext";
import sendRequest from "./sendrequest";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "../app/_layout";
import { tr } from "react-native-paper-dates";
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

export const getAllNotes = async (
	getFromBuffer: boolean = false,
	skipDBSync = false
) => {
	let notes: null | NoteObject = null;
	if (Platform.OS === "web" || getFromBuffer) {
		const notesStirng = await AsyncStorage.getItem(
			`${NOTES}${getFromBuffer ? "-buffer" : ""}`
		);
		notes = notesStirng ? (JSON.parse(notesStirng) as NoteObject) : null;
	} else {
		const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
		const fileExists = await FileSystem.getInfoAsync(fileUri);
		if (!fileExists.exists) {
			return null;
		}
		const file = await FileSystem.readAsStringAsync(fileUri);
		notes = file ? (JSON.parse(file) as NoteObject) : null;
	}
	if (!getFromBuffer && !skipDBSync) {
		getNotesFromDB();
	}

	return notes;
};

export const compareTimestamps = (
	firstTimestamp: string,
	secondTimestamp: string
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
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	if (!state.isConnected || !user) return;
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

		await Promise.all(deleted.map((entry) => deleteNote(entry.uuid, true)));

		const allNotes = await getAllNotes(false, true);
		const deletedNoteEntries = JSON.parse(
			(await AsyncStorage.getItem("deletedNoteEntries")) || "[]"
		);

		const filteredNotes = notes.filter((entry) => {
			if (deletedNoteEntries.includes(entry.uuid)) return false;
			const note = allNotes?.[entry.uuid];
			if (!note || !allNotes) return true;
			return compareTimestamps(note.updated_at, entry.updated_at);
		});

		for (const newNote of filteredNotes)
			await saveNote({ ...newNote }, [], newNote.uuid, false, true);

		await AsyncStorage.setItem("lastNoteSync", new Date().toISOString());
		queryClient.invalidateQueries({ queryKey: ["notes"] });
	} catch (error) {}
};

export const getNote = async (
	noteUUID: string,
	getFromBuffer: boolean = false
): Promise<FullNote | null> => {
	const notes = await getAllNotes(getFromBuffer, true);
	if (!notes || !notes[noteUUID]) return null;
	console.log(notes[noteUUID]);

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
	withoutDatabase: boolean = false
) => {
	if (!noteUUID) {
		throw new Error("Note UUID is required");
	}
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
		updated_at:
			withoutDatabase && oldNote?.updated_at
				? oldNote.updated_at
				: new Date().toISOString(),
	} as Note;
	const notes = await getAllNotes(saveToBuffer, true);
	const newNotes = notes
		? { ...notes, [noteUUID]: newNote }
		: { [noteUUID]: newNote };
	if (!saveToBuffer && !withoutDatabase) {
		await saveTags(tags, noteUUID, "note");
	}
	if (Platform.OS === "web" || saveToBuffer) {
		await AsyncStorage.setItem(
			`notes${saveToBuffer ? "-buffer" : ""}`,
			JSON.stringify(newNotes)
		);
	} else {
		const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
	}

	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	console.log({ ...newNote, uuid: noteUUID });

	if (state.isConnected && user && !withoutDatabase && !saveToBuffer) {
		try {
			await sendRequest(
				"/notes/save",
				{
					body: JSON.stringify({ ...newNote, uuid: noteUUID }),
					method: "POST",
				},
				true
			);
		} catch (error) {
			console.error("Error sending request:", error);
			if (!saveToBuffer) {
				await saveNote(newNote, [], noteUUID, true);
			}
		}
	} else if (!saveToBuffer && !withoutDatabase) {
		await saveNote(newNote, [], noteUUID, true);
	}
	return note;
};
export const deleteNote = async (noteUUID: string, withoutDatabase = false) => {
	const notes = await getAllNotes(false, true);
	const newNotes = notes ? { ...notes } : {};
	delete newNotes[noteUUID];
	cleanupTags(noteUUID);

	const oldDeletedEntries = await AsyncStorage.getItem("deletedNoteEntries");
	if (oldDeletedEntries) {
		const deleted = JSON.parse(oldDeletedEntries);
		deleted.push(noteUUID);
		await AsyncStorage.setItem(
			"deletedNoteEntries",
			JSON.stringify(deleted)
		);
	} else {
		await AsyncStorage.setItem(
			"deletedNoteEntries",
			JSON.stringify([noteUUID])
		);
	}

	if (Platform.OS === "web") {
		await AsyncStorage.setItem(NOTES, JSON.stringify(newNotes));
	} else {
		const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newNotes));
	}
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	if (state.isConnected && user && !withoutDatabase) {
		sendRequest(
			"/notes/delete",
			{
				body: JSON.stringify({ uuid: noteUUID }),
				method: "POST",
			},
			true
		);
	} else if (!withoutDatabase) {
		const oldDeletedEntriesBuffer = await AsyncStorage.getItem(
			"deletedNoteEntries-buffer"
		);

		if (oldDeletedEntriesBuffer) {
			const deleted = JSON.parse(oldDeletedEntriesBuffer);
			deleted.push(noteUUID);
			await AsyncStorage.setItem(
				"deletedNoteEntries-buffer",
				JSON.stringify(deleted)
			);
		} else {
			await AsyncStorage.setItem(
				"deletedNoteEntries-buffer",
				JSON.stringify([noteUUID])
			);
		}
	}
	return null;
};

export const sendFromBuffer = async () => {
	const oldDeletedEntriesBuffer = await AsyncStorage.getItem(
		"deletedNoteEntries-buffer"
	);
	const notesBuffer = await getAllNotes(true);
	if (!notesBuffer && !oldDeletedEntriesBuffer) return;
	const user = await AsyncStorage.getItem("user");
	const state = await NetInfo.fetch();
	if (state.isConnected && user) {
		if (oldDeletedEntriesBuffer) {
			const deleted = JSON.parse(oldDeletedEntriesBuffer);
			for (const noteUUID of deleted) {
				try {
					await sendRequest(
						"/notes/delete",
						{
							body: JSON.stringify({ uuid: noteUUID }),
							method: "POST",
						},
						true
					);
				} catch (error) {
					console.error("Error sending request:", error);
				}
			}
			await AsyncStorage.removeItem("deletedNoteEntries-buffer");
		}
		if (!notesBuffer) return;
		for (const noteUUID in notesBuffer) {
			try {
				console.log("culprit");
				await sendRequest(
					"/notes/save",
					{
						body: JSON.stringify({
							...notesBuffer[noteUUID],
							uuid: noteUUID,
						}),
						method: "POST",
					},
					true
				);
			} catch (error) {
				console.error("Error sending request:", error);
			}
		}
		console.log("Notes sent from buffer");
		await AsyncStorage.removeItem(NOTES + "-buffer");
	}
};

export const deleteAllLocalNotes = () => {
	AsyncStorage.removeItem("deletedNoteEntries");
	AsyncStorage.removeItem("deletedNoteEntries-buffer");
	AsyncStorage.removeItem("lastNoteSync");
	AsyncStorage.removeItem(NOTES + "-buffer");
	if (Platform.OS === "web") {
		AsyncStorage.removeItem(NOTES);
	} else {
		const fileUri = `${FileSystem.documentDirectory}${NOTES}.json`;
		const buferFileUri = `${FileSystem.documentDirectory}${NOTES}-buffer.json`;
		FileSystem.deleteAsync(fileUri);
		FileSystem.deleteAsync(buferFileUri);
	}
};
