import { useState, useEffect, useCallback } from "react";
import {
	QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { View, Text, TextInput, Pressable } from "react-native";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import "react-native-get-random-values";
import { parse, v4 } from "uuid";
import {
	deleteNote,
	getAllNotes,
	getNote,
	Note,
	saveNote,
} from "../../utils/manageNotes";
import { TagsInput } from "../TagsInput";

// Debounce helper function
const useDebounce = <T,>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
};

export const NoteParent = ({
	NotePageContent,
}: {
	NotePageContent: {
		content: string;
		setContent: (arg: string) => void;
		title: string;
		setTitle: (arg: string) => void;
		tags: string[];
		setTags: (arg: string[]) => void;
		handleSave: ({
			newTitle,
			newContent,
		}: {
			newTitle: string;
			newContent: string;
		}) => void;
		handleDelete: () => void;
		isMarkdown: boolean;
		setIsMarkdown: (arg: boolean) => void;
	};
}) => {
	const { uuid } = useLocalSearchParams();
	const router = useRouter();
	const [isInvalidUUID, setIsInvalidUUID] = useState(false);
	const [content, setContent] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [title, setTitle] = useState("");
	const [dueDate, setDueDate] = useState<undefined | string>(undefined);
	const [isMarkdown, setIsMarkdown] = useState(false);
	const queryClient = useQueryClient();

	const debouncedTags = useDebounce(tags, 1000);
	const debouncedDueDate = useDebounce(dueDate, 1000);

	const [isInitialLoad, setIsInitialLoad] = useState(true);

	useEffect(() => {
		setTitle("");
		setContent("");
		try {
			parse(uuid as string);
			setIsInvalidUUID(false);
		} catch (error) {
			setIsInvalidUUID(true);
		}
	}, [uuid]);

	const { data: noteData } = useQuery({
		queryKey: ["notes", uuid],
		queryFn: async () => {
			const noteFromDB = await getNote(uuid as string);
			if (noteFromDB) {
				setContent(noteFromDB.content);
				setTitle(noteFromDB.title);
				setDueDate(noteFromDB.ends_at);
				setIsInitialLoad(false);
				if (JSON.stringify(noteFromDB.tags) !== JSON.stringify(tags)) {
					setTags(noteFromDB.tags);
				}
			}
			return noteFromDB;
		},
	});

	const { mutate: save } = useMutation({
		mutationKey: ["notes"],
		mutationFn: async (note: Note) => {
			return await saveNote(note, debouncedTags, uuid as string);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
		},
	});

	const { mutate: deleteNoteMutation } = useMutation({
		mutationKey: ["notes"],
		mutationFn: async (noteUUID: string) => {
			return await deleteNote(noteUUID);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			router.back();
		},
	});

	useEffect(() => {
		if (isInitialLoad) return;

		if (noteData) {
			save({
				title,
				content,
				ends_at: debouncedDueDate,
			} as Note);
		}
	}, [debouncedTags, debouncedDueDate]);

	const handleOptionsSave = useCallback(() => {
		save({ title, content, ends_at: dueDate } as Note);
	}, [title, content, dueDate]);

	const handleSave = useCallback(
		({
			newTitle,
			newContent,
		}: {
			newTitle: string;
			newContent: string;
		}) => {
			save({ title: newTitle, content: newContent } as Note);
		},
		[]
	);

	const handleDelete = useCallback(() => {
		deleteNoteMutation(uuid as string);
	}, [uuid]);

	if (isInvalidUUID) return <Redirect href={`/note/${v4()}`} />;

	return (
		<NotePageContent
			{...{
				content,
				setContent,
				title,
				setTitle,
				tags,
				setTags,
				handleSave,
				handleDelete,
				isMarkdown,
				setIsMarkdown,
				dueDate,
				setDueDate,
			}}
		/>
	);
};
