import { useNoteStore } from "./manageNotes";
import { useTaskStore } from "./manageTasks";
import { useTaskBoardStore } from "./manageTaskBoards";

export const cleanUpData = () => {
  useNoteStore.setState({ notes: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
  useTaskStore.setState({ tasks: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
  useTaskBoardStore.setState({ taskBoards: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
};
