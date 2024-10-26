import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const TAGS = "tags";

type Tag = {
  uuid: string;
  type: "note" | "task";
};

export type Tags = {
  [key: string]: Tag[];
};

export const getAllTags = async (): Promise<Tags | null> => {
  if (Platform.OS === "web") {
    const tags = localStorage.getItem(TAGS);
    return tags ? JSON.parse(tags) : null;
  }
  const fileUri = `${FileSystem.documentDirectory}${TAGS}.json`;
  const fileExists = await FileSystem.getInfoAsync(fileUri);
  if (!fileExists.exists) {
    return null;
  }
  const file = await FileSystem.readAsStringAsync(fileUri);
  return file ? (JSON.parse(file) as Tags) : null;
};

export const getTags = async (): Promise<string[]> => {
  const tags = await getAllTags();
  if (!tags) return [];
  return Object.keys(tags);
};

export const getTagsFormUUID = async (noteUUID: string): Promise<string[]> => {
  const tags = await getAllTags();
  if (!tags) return [];
  let entryTags: string[] = [];
  for (const [key, value] of Object.entries(tags)) {
    if (value.find((tag) => tag.uuid === noteUUID)) {
      entryTags.push(key);
    }
  }
  return entryTags;
};

export const saveTags = async (
  newTags: string[],
  uuid: string,
  type: "note" | "task",
): Promise<void> => {
  try {
    const oldTags = await getAllTags();
    let updatedTags: Tags = oldTags ? { ...oldTags } : {};

    for (const tag in updatedTags) {
      updatedTags[tag] = updatedTags[tag].filter((item) => item.uuid !== uuid);
      if (updatedTags[tag].length === 0) {
        delete updatedTags[tag];
      }
    }

    for (const tag of newTags) {
      if (!updatedTags[tag]) {
        updatedTags[tag] = [];
      }
      updatedTags[tag].push({ uuid, type });
    }

    if (Platform.OS === "web") {
      localStorage.setItem(TAGS, JSON.stringify(updatedTags));
    } else {
      const fileUri = `${FileSystem.documentDirectory}${TAGS}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(updatedTags));
    }
  } catch (error) {
    console.error("Error saving tags:", error);
  }
};

export const cleanupTags = async (uuid: string) => {
  const oldTags = await getAllTags();
  if (!oldTags) return;
  const newTags = { ...oldTags };
  for (const tag in newTags) {
    newTags[tag] = newTags[tag].filter((item) => item.uuid !== uuid);
    if (newTags[tag].length === 0) {
      delete newTags[tag];
    }
  }
  if (Platform.OS === "web") {
    localStorage.setItem(TAGS, JSON.stringify(newTags));
  } else {
    const fileUri = `${FileSystem.documentDirectory}${TAGS}.json`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(newTags));
  }
};

