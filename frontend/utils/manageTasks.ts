import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { cleanupTags, getTagsFormUUID, saveTags } from "./manageTags";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "../app/_layout";
import { compareTimestamps } from "./manageNotes";
import sendRequest from "./sendrequest";

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

export const getTaskGroups = async (): Promise<TaskGroupObject | null> => {
  if (Platform.OS === "web") {
    const tasks = localStorage.getItem(TASK_GROUPS);
    getTaskGroupsFromDB();
    return tasks ? (JSON.parse(tasks) as TaskGroupObject) : null;
  }
  const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
  const fileExists = await FileSystem.getInfoAsync(fileUri);
  if (!fileExists.exists) {
    return null;
  }
  const file = await FileSystem.readAsStringAsync(fileUri);
  getTaskGroupsFromDB().catch((error) =>
    console.log("Background sync error:", error),
  );
  return file ? (JSON.parse(file) as TaskGroupObject) : null;
};

const getTaskGroupsFromDB = async (shouldGetAllTaskGroups = false) => {
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

    if (taskGroups.length === 0 && deleted.length === 0) return;

    await Promise.all(deleted.map((entry) => deleteTaskGroup(entry.uuid)));
    const allTaskGroups = await getTaskGroups();
    const deletedEntries = JSON.parse(
      (await AsyncStorage.getItem("deletedEntries")) || "[]",
    );

    taskGroups.map((newTaskGroup) => {
      if (deletedEntries && deletedEntries.includes(newTaskGroup.uuid)) {
        return;
      }
      if (
        !allTaskGroups ||
        !allTaskGroups[newTaskGroup.uuid] ||
        compareTimestamps(
          newTaskGroup.updated_at,
          allTaskGroups[newTaskGroup.uuid].updated_at,
        ) > 0
      ) {
        updateTaskGroup(newTaskGroup.uuid, { ...newTaskGroup });
      }
    });

    await AsyncStorage.setItem("lastTaskGroupSync", new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["taskGroups"] });
  } catch (error) {
    // Empty catch block, just like in notes
  }
};
export const createTaskGroup = async (
  name: string,
  description: string,
  statusType: string[],
  tags: string[],
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

  if (Platform.OS === "web") {
    localStorage.setItem(TASK_GROUPS, JSON.stringify(newTasks));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
  }

  NetInfo.fetch().then((state) => {
    if (state.isConnected) {
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
        true,
      ).catch((e) => {});
    }
  });

  return uuid;
};

export const deleteTaskGroup = async (uuid: string) => {
  const taskGroups = await getTaskGroups();
  const newTasks = taskGroups ? { ...taskGroups } : {};
  delete newTasks[uuid];
  cleanupTags(uuid);
  const tasks = await getTasks(uuid);
  tasks.forEach((task) => {
    deleteTask(task.uuid);
  });
  if (Platform.OS === "web") {
    localStorage.setItem(TASK_GROUPS, JSON.stringify(newTasks));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
  }
  return null;
};

export const updateTaskGroup = async (
  uuid: string,
  { name, description, statusType, tags, ends_at },
) => {
  const tasks = await getTaskGroups();
  if (!tasks) return;
  if (!tasks[uuid]) {
    throw new Error("Task group not found");
  }
  const newTasks = tasks ? { ...tasks } : {};
  console.log({ name, description, statusType, tags, ends_at });
  newTasks[uuid] = {
    name: name || tasks[uuid].name || "",
    description: description || tasks[uuid].description || "",
    created_at: newTasks[uuid].created_at,
    updated_at: new Date().toISOString(),
    ends_at: ends_at || tasks[uuid].ends_at || null,
    statusType: statusType ||
      tasks[uuid].statusType || ["Todo", "Doing", "Done"],
  };

  if (tags) {
    saveTags(tags, uuid, "task");
  }

  if (Platform.OS === "web") {
    localStorage.setItem(TASK_GROUPS, JSON.stringify(newTasks));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TASK_GROUPS}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
  }
  return null;
};

export const getTaskGroup = async (
  uuid: string,
): Promise<TaskGroupFull | null> => {
  const tasks = await getTaskGroups();
  if (!tasks || !tasks[uuid]) return null;
  return {
    ...tasks[uuid],
    tags: await getTagsFormUUID(uuid),
  } as TaskGroupFull;
};

export const getTasks = async (
  taskGroupUUID?: string,
  getFromBuffer = false,
): Promise<Task[]> => {
  let tasks: Task[] = [];

  if (Platform.OS === "web") {
    const tasksJson = await AsyncStorage.getItem(
      `${TASKS}${getFromBuffer ? "-buffer" : ""}`,
    );
    if (tasksJson) {
      tasks = JSON.parse(tasksJson) as Task[];
    }
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TASKS}${getFromBuffer ? "-buffer" : ""}.json`;
    const fileExists = await FileSystem.getInfoAsync(fileUri);
    if (fileExists.exists) {
      const file = await FileSystem.readAsStringAsync(fileUri);
      tasks = JSON.parse(file) as Task[];
    }
  }

  if (taskGroupUUID && !getFromBuffer) {
    return tasks.filter((task) => task.taskGroupUUID === taskGroupUUID);
  }
  return tasks;
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
  saveToBuffer: boolean = false,
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
    description: task?.description?.slice(0, 200) || oldTask?.description || "",
    created_at: oldTask ? oldTask.created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    taskGroupUUID,
    status: newStatus,
  };
  const tasks = await getTasks();
  let newTasks: Task[] = [];
  if (oldTask) {
    newTasks = tasks.map((oldTask) => {
      if (oldTask.uuid === newTask.uuid) console.log("same");
      if (newTask.uuid === oldTask.uuid) return newTask;
      return oldTask;
    });
  } else {
    newTasks = tasks;
    newTasks.push(newTask);
  }

  if (Platform.OS === "web") {
    localStorage.setItem(
      `${TASKS}${saveToBuffer ? "-buffer" : ""}`,
      JSON.stringify(newTasks),
    );
  } else {
    const fileName = `${TASKS}${saveToBuffer ? "-buffer" : ""}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
    } catch (error) {
      console.error(error);
    }
  }

  NetInfo.fetch().then((state) => {
    if (state.isConnected) {
      sendRequest(
        "/tasks/save",
        {
          body: JSON.stringify(newTask),
          method: "POST",
        },
        true,
      ).catch((e) => {});
    } else if (!saveToBuffer) {
      saveTask(task, taskGroupUUID, taskUUID, true);
    }
  });

  return newTask;
};

export const deleteTask = async (taskUUID: string): Promise<void> => {
  const tasks = await getTasks();
  const newTasks = { ...tasks };
  delete newTasks[taskUUID];

  const oldDeletedEntries = await AsyncStorage.getItem("deletedEntries");
  if (oldDeletedEntries) {
    const deleted = JSON.parse(oldDeletedEntries);
    deleted.push(taskUUID);
    await AsyncStorage.setItem("deletedEntries", JSON.stringify(deleted));
  } else {
    await AsyncStorage.setItem("deletedEntries", JSON.stringify([taskUUID]));
  }

  if (Platform.OS === "web") {
    localStorage.setItem(TASKS, JSON.stringify(newTasks));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TASKS}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTasks));
  }

  NetInfo.fetch().then(async (state) => {
    if (state.isConnected) {
      sendRequest(
        "/tasks/delete",
        { body: JSON.stringify({ uuid: taskUUID }), method: "POST" },
        true,
      ).catch((e) => {});
    } else {
      const oldDeletedEntriesBuffer = await AsyncStorage.getItem(
        "deletedEntries-buffer",
      );
      if (oldDeletedEntriesBuffer) {
        const deleted = JSON.parse(oldDeletedEntriesBuffer);
        deleted.push(taskUUID);
        await AsyncStorage.setItem(
          "deletedEntries-buffer",
          JSON.stringify(deleted),
        );
      } else {
        await AsyncStorage.setItem(
          "deletedEntries-buffer",
          JSON.stringify([taskUUID]),
        );
      }
    }
  });
};
