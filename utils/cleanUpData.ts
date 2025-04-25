import { useNoteStore } from './manageNotes';
import { useTaskBoardStore } from './manageTaskBoards';
import { useTaskStore } from './manageTasks';

export const cleanUpData = () => {
  useNoteStore.setState({ notes: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
  useTaskStore.setState({ tasks: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
  useTaskBoardStore.setState({ taskBoards: {}, pendingChanges: {}, lastSyncTimestamp: 0 });
};
