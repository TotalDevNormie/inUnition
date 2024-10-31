import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { cleanupTags, getTagsFormUUID, saveTags } from "./manageTags";
import { queryClient } from "../app/_layout";
import { compareTimestamps } from "./manageNotes";
import sendRequest from "./sendrequest";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASK_GROUPS = "taskGroups";
const TASKS = "tasks";

export type Task = {
	uuid: string;
	name: string;
	description: string;
	taskGroupUUID: string;
	created_at: string;
	updated_at: string;
	status: string;
};

export type TaskGroup = {
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
	ends_at?: string;
	next_reset?: string;
	reset_interval?: string;
	statusType: string[];
};
export type TaskGroupFull = TaskGroup & {
	tasks: Task[];
	tags: string[];
};

type TaskGroupWithUUID = TaskGroup & {
	uuid: string;
};

export type TaskGroupObject = {
	[key: string]: TaskGroup;
};

export const getTaskGroups = async (
	getFromBuffer: boolean = false
): Promise<TaskGroupObject | null> => {
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");

	if (Platform.OS === "web" || getFromBuffer) {
		const tasks = await AsyncStorage.getItem(
			`${TASK_GROUPS}${getFromBuffer ? "-buffer" : ""}`
		);

		if (!getFromBuffer && state.isConnected && user) getTaskGroupsFromDB();
		return tasks ? (JSON.parse(tasks) as TaskGroupObject) : null;
	}
	const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
	const fileExists = await FileSystem.getInfoAsync(fileUri);
	if (!fileExists.exists) {
		return null;
	}
	const file = await FileSystem.readAsStringAsync(fileUri);
	if (!getFromBuffer && state.isConnected && user) getTaskGroupsFromDB();
	return file ? (JSON.parse(file) as TaskGroupObject) : null;
};

export const updateTaskGroup = async (
	uuid: string,
	{ name, description, statusType, tags, ends_at },
	saveToBuffer = false,
	withoutDatabase = false
) => {
	try {
		const tasks = await getTaskGroups();
		const oldTaskGroup = tasks ? tasks[uuid] : null;
		const newTasks = tasks ? { ...tasks } : {};
		console.log({ name, description, statusType, tags, ends_at }, tasks);
		newTasks[uuid] = {
			name: name || oldTaskGroup?.name || "",
			description: description || oldTaskGroup?.description || "",
			created_at: oldTaskGroup?.created_at || new Date().toISOString(),
			updated_at:
				withoutDatabase && oldTaskGroup?.updated_at
					? oldTaskGroup.updated_at
					: new Date().toISOString(),
			ends_at: ends_at || null,
			statusType: statusType ||
				oldTaskGroup?.statusType || ["Todo", "Doing", "Done"],
		};

		if (tags && !saveToBuffer) {
			saveTags(tags, uuid, "task");
		}

		if (Platform.OS === "web" || saveToBuffer) {
			await AsyncStorage.setItem(
				`${TASK_GROUPS}${saveToBuffer ? "-buffer" : ""}`,
				JSON.stringify(newTasks)
			);
		} else {
			const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
			await FileSystem.writeAsStringAsync(
				fileUri,
				JSON.stringify(newTasks)
			);
		}

		const state = await NetInfo.fetch();
		const user = await AsyncStorage.getItem("user");

		if (state.isConnected && user && !withoutDatabase) {
			sendRequest(
				"/task-groups/save",
				{
					body: JSON.stringify({
						uuid,
						name,
						description,
						task_statuses: statusType,
						ends_at,
					}),
					method: "POST",
				},
				true
			).catch((e) => {});
		} else if (!withoutDatabase) {
			const oldBuffer = await AsyncStorage.getItem(
				`${TASK_GROUPS}-buffer`
			);
			if (oldBuffer) {
				const buffer = JSON.parse(oldBuffer);
				buffer[uuid] = newTasks[uuid];
				await AsyncStorage.setItem(
					`${TASK_GROUPS}-buffer`,
					JSON.stringify(buffer)
				);
			} else {
				const newBuffer = { [uuid]: newTasks[uuid] };
				await AsyncStorage.setItem(
					`${TASK_GROUPS}-buffer`,
					JSON.stringify(newBuffer)
				);
			}
		}
		return null;
	} catch (error) {
		console.log(error);
	}
};

async function getTaskGroupsFromDB(shouldGetAllTaskGroups = false) {
	const lastSync = await AsyncStorage.getItem("lastTaskGroupSync");
	let options: RequestInit = { method: "POST" };
	if (lastSync && !shouldGetAllTaskGroups) {
		options.body = JSON.stringify({
			timestamp: lastSync,
		});
	}
	try {
		const { taskGroups, deleted } = await sendRequest<{
			taskGroups: TaskGroupWithUUID[];
			deleted: { uuid: string }[];
		}>("/task-groups", options, true);

		console.log({ taskGroups, deleted });

		if (taskGroups.length === 0 && deleted.length === 0) return;

		await Promise.all(
			deleted.map((entry) => deleteTaskGroup(entry.uuid, true))
		);
		const allTaskGroups = await getTaskGroups();
		const deletedEntries = JSON.parse(
			(await AsyncStorage.getItem("deletedEntries")) || "[]"
		);

		const filteredTaskGroups = taskGroups.filter((entry) => {
			// console.log("after deleted");
			if (deletedEntries.includes(entry.uuid)) return false;

			if (!allTaskGroups || !allTaskGroups[entry.uuid]) return true;
			console.log("after exists", allTaskGroups);
			console.log(
				"after exists",
				allTaskGroups[entry.uuid].updated_at,
				entry.updated_at
			);
			return compareTimestamps(
				allTaskGroups[entry.uuid].updated_at,
				entry.updated_at
			);
		});

		for (const newTaskGroup of filteredTaskGroups)
			await updateTaskGroup(
				newTaskGroup.uuid,
				{ ...newTaskGroup, statusType: newTaskGroup.task_statuses },
				false,
				true
			);

		await AsyncStorage.setItem(
			"lastTaskGroupSync",
			new Date().toISOString()
		);
		queryClient.invalidateQueries({ queryKey: ["taskGroups"] });
	} catch (error) {}
}
export const createTaskGroup = async (
	name: string,
	description: string,
	statusType: string[],
	tags: string[]
) => {
	if (!name) {
		throw new Error("Name is required");
	}

	const tasks = await getTaskGroups();
	const newTasks = tasks ? { ...tasks } : {};
	const uuid = uuidv4();
	newTasks[uuid] = {
		name,
		description,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		statusType: statusType,
	};
	saveTags(tags, uuid, "task");
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");

	if (Platform.OS === "web") {
		await AsyncStorage.setItem(TASK_GROUPS, JSON.stringify(newTasks));
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
	}

	if (state.isConnected && user) {
		sendRequest(
			"/task-groups/save",
			{
				body: JSON.stringify({
					uuid,
					name,
					description,
					task_statuses: statusType,
				}),
				method: "POST",
			},
			true
		).catch((e) => {});
	} else {
		const oldBuffer = await AsyncStorage.getItem(`${TASK_GROUPS}-buffer`);
		if (oldBuffer) {
			const buffer = JSON.parse(oldBuffer);
			buffer[uuid] = newTasks[uuid];
			await AsyncStorage.setItem(
				`${TASK_GROUPS}-buffer`,
				JSON.stringify(buffer)
			);
		} else {
			const newBuffer = { [uuid]: newTasks[uuid] };
			await AsyncStorage.setItem(
				`${TASK_GROUPS}-buffer`,
				JSON.stringify(newBuffer)
			);
		}
	}

	return uuid;
};

export const deleteTaskGroup = async (
	uuid: string,
	withoutDatabase = false
) => {
	const taskGroups = await getTaskGroups();
	const newTasks = taskGroups ? { ...taskGroups } : {};
	delete newTasks[uuid];
	console.log("wirkout datanase", withoutDatabase);
	cleanupTags(uuid);
	const tasks = await getTasks(uuid);
	tasks.forEach((task) => {
		deleteTask(task.uuid);
	});
	if (Platform.OS === "web") {
		AsyncStorage.setItem(TASK_GROUPS, JSON.stringify(newTasks));
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
	}

	const oldDeletedTaskGroupEntries = await AsyncStorage.getItem(
		"deletedTaskGroupEntries"
	);
	if (oldDeletedTaskGroupEntries) {
		const deleted = JSON.parse(oldDeletedTaskGroupEntries);
		deleted.push(uuid);
		await AsyncStorage.setItem(
			"deletedTaskGroupEntries",
			JSON.stringify(deleted)
		);
	} else {
		await AsyncStorage.setItem(
			"deletedTaskGroupEntries",
			JSON.stringify([uuid])
		);
	}

	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");

	if (state.isConnected && user && !withoutDatabase) {
		sendRequest(
			"/task-groups/delete",
			{
				body: JSON.stringify({
					uuid,
				}),
				method: "POST",
			},
			true
		);
	} else if (!withoutDatabase) {
		const oldBuffer = await AsyncStorage.getItem(
			`deletedTaskGroups-buffer`
		);
		if (oldBuffer) {
			const buffer = JSON.parse(oldBuffer);
			buffer.push(uuid);
			await AsyncStorage.setItem(
				`deletedTaskGroups-buffer`,
				JSON.stringify(buffer)
			);
		} else {
			await AsyncStorage.setItem(
				`deletedTaskGroups-buffer`,
				JSON.stringify([uuid])
			);
		}
	}

	return null;
};

export const getTaskGroup = async (
	uuid: string
): Promise<TaskGroupFull | null> => {
	const tasks = await getTaskGroups();
	if (!tasks || !tasks[uuid]) return null;
	return {
		...tasks[uuid],
		tags: await getTagsFormUUID(uuid),
	} as TaskGroupFull;
};

export async function getTasks(
	taskGroupUUID?: string,
	getFromBuffer = false,
	skipDBSync = true
): Promise<Task[]> {
	let tasks: Task[] = [];
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");

	if (Platform.OS === "web" || getFromBuffer) {
		const tasksJson = await AsyncStorage.getItem(
			`${TASKS}${getFromBuffer ? "-buffer" : ""}`
		);
		if (tasksJson) {
			tasks = JSON.parse(tasksJson) as Task[];
		}
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASKS}.json`;
		const fileExists = await FileSystem.getInfoAsync(fileUri);
		if (fileExists.exists) {
			const file = await FileSystem.readAsStringAsync(fileUri);
			tasks = JSON.parse(file) as Task[];
		}
	}

	console.log("from here", skipDBSync, taskGroupUUID);
	if (!getFromBuffer && state.isConnected && user && !skipDBSync)
		console.log("works");

	if (!getFromBuffer && state.isConnected && user && !skipDBSync)
		getTasksFromDB();

	if (taskGroupUUID && !getFromBuffer) {
		return tasks.filter((task) => task.taskGroupUUID === taskGroupUUID);
	}
	return tasks;
}

const getTasksFromDB = async (shouldGetAllTasks = false) => {
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	if (!state.isConnected || !user) return;
	const lastSync = await AsyncStorage.getItem("lastTaskSync");
	let options: RequestInit = { method: "POST" };
	if (lastSync && !shouldGetAllTasks) {
		options.body = JSON.stringify({
			timestamp: lastSync,
		});
	}
	try {
		const { tasks, deleted } = await sendRequest<{
			tasks: Task[];
			deleted: { uuid: string }[];
		}>("/tasks", options, true);

		console.log({ tasks, deleted });

		if (tasks.length === 0 && deleted.length === 0) return;

		await Promise.all(deleted.map((entry) => deleteTask(entry.uuid)));
		const allTasks = await getTasks();
		const deletedEntries = JSON.parse(
			(await AsyncStorage.getItem("deletedTaskEntries")) || "[]"
		);

		const filteredTasks = tasks.filter((entry) => {
			console.log("after deleted");
			if (deletedEntries.includes(entry.uuid)) return false;
			const task = allTasks.find((task) => task.uuid === entry.uuid);
			console.log("after check");

			if (!task || allTasks.length === 0) return true;
			console.log("after not found");

			return compareTimestamps(task.updated_at, entry.updated_at);
		});
		console.log(filteredTasks);
		for (const entry of filteredTasks)
			saveTask(entry, entry.task_group_uuid, entry.uuid, true);
		await AsyncStorage.setItem("lastTaskSync", new Date().toISOString());
	} catch (error) {}
};

const getTask = async (uuid: string) => {
	const tasks = await getTasks();
	const task = tasks.find((task) => task.uuid === uuid);
	return task ?? null;
};

export const saveTask = async (
	task: { name?: string; description?: string; status?: string },
	taskGroupUUID: string,
	taskUUID?: string,
	saveToBuffer = false
): Promise<Task> => {
	let oldTask: Task | null = null;
	if (taskUUID) {
		try {
			oldTask = await getTask(taskUUID);
		} catch (error) {
			console.error(error);
		}
	}

	const taskGroup = await getTaskGroup(taskGroupUUID);
	if (!taskGroup) throw new Error("Task group not found");

	const newStatus: string =
		task.status && taskGroup.statusType.includes(task.status)
			? task.status
			: taskGroup.statusType[0];

	const newTask: Task = {
		uuid: taskUUID ?? uuidv4(),
		name: task?.name?.slice(0, 50) || oldTask?.name || "",
		description:
			task?.description?.slice(0, 200) || oldTask?.description || "",
		created_at: oldTask ? oldTask.created_at : new Date().toISOString(),
		updated_at: new Date().toISOString(),
		taskGroupUUID,
		status: newStatus,
	};
	const tasks = await getTasks(false, saveToBuffer);
	let newTasks: Task[] = [];
	if (oldTask) {
		newTasks = tasks.map((oldTask) => {
			if (newTask.uuid === oldTask.uuid) return newTask;
			return oldTask;
		});
	} else {
		newTasks = tasks;
		newTasks.push(newTask);
	}

	console.log({ newTasks });
	if (Platform.OS === "web" || saveToBuffer) {
		AsyncStorage.setItem(
			`${TASKS}${saveToBuffer ? "-buffer" : ""}`,
			JSON.stringify(newTasks)
		);
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASKS}.json`;
		try {
			await FileSystem.writeAsStringAsync(
				fileUri,
				JSON.stringify(newTasks)
			);
		} catch (error) {
			console.error(error);
		}
	}
	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	if (state.isConnected && user && !saveToBuffer) {
		sendRequest(
			"/tasks/save",
			{
				body: JSON.stringify({
					...newTask,
					task_group_uuid: taskGroupUUID,
				}),
				method: "POST",
			},
			true
		).catch((e) => {});
	} else if (!saveToBuffer) {
		saveTask(newTask, taskGroupUUID, taskUUID, true);
	}

	return newTask;
};

export const deleteTask = async (taskUUID: string): Promise<void> => {
	const tasks = await getTasks();
	const newTasks = { ...tasks };
	delete newTasks[taskUUID];

	const oldDeletedEntries = await AsyncStorage.getItem("deletedTaskEntries");
	if (oldDeletedEntries) {
		const deleted = JSON.parse(oldDeletedEntries);
		deleted.push(taskUUID);
		await AsyncStorage.setItem(
			"deletedTaskEntries",
			JSON.stringify(deleted)
		);
	} else {
		await AsyncStorage.setItem(
			"deletedTaskEntries",
			JSON.stringify([taskUUID])
		);
	}

	if (Platform.OS === "web") {
		await AsyncStorage.setItem(TASKS, JSON.stringify(newTasks));
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASKS}.json`;
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
	}

	const state = await NetInfo.fetch();
	const user = await AsyncStorage.getItem("user");
	if (state.isConnected && user) {
		sendRequest(
			"/tasks/delete",
			{ body: JSON.stringify({ uuid: taskUUID }), method: "POST" },
			true
		).catch((e) => {});
	} else {
		const oldDeletedEntriesBuffer = await AsyncStorage.getItem(
			"deletedEntries-buffer"
		);
		if (oldDeletedEntriesBuffer) {
			const deleted = JSON.parse(oldDeletedEntriesBuffer);
			deleted.push(taskUUID);
			await AsyncStorage.setItem(
				"deletedEntries-buffer",
				JSON.stringify(deleted)
			);
		} else {
			await AsyncStorage.setItem(
				"deletedEntries-buffer",
				JSON.stringify([taskUUID])
			);
		}
	}
};

export const deleteAllLocalTasks = () => {
	AsyncStorage.removeItem("deletedTaskGroupEntries");
	AsyncStorage.removeItem("deletedTaskGroupEntries-buffer");
	AsyncStorage.removeItem("deletedTaskEntries");
	AsyncStorage.removeItem("deletedTaskEntries-buffer");
	AsyncStorage.removeItem("lastTaskSync");
	AsyncStorage.removeItem("lastTaskGroupSync");

	AsyncStorage.removeItem(TASKS + "-buffer");
	AsyncStorage.removeItem(TASK_GROUPS + "-buffer");

	if (Platform.OS === "web") {
		AsyncStorage.removeItem(TASKS);
		AsyncStorage.removeItem(TASK_GROUPS);
	} else {
		const fileUri = `${FileSystem.documentDirectory}${TASKS}.json`;
		const taskGroupFileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
		FileSystem.deleteAsync(fileUri);
		FileSystem.deleteAsync(taskGroupFileUri);
	}
};
