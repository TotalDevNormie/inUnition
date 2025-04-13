import { useState, useEffect, useCallback, useRef } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import 'react-native-get-random-values';
import { parse } from 'uuid';
import { Task, useTaskStore } from '../../utils/manageTasks';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import Animated, { AnimatedRef } from 'react-native-reanimated';

export type ColumnRefs = Record<string, AnimatedRef<Animated.View>>;

export type TaskBoardContentProps = {
  uuid: string;
  taskEdit: Task | false;
  setTaskEdit: (task: Task | false) => void;
  openModal: 'newTask' | 'settings' | false;
  setOpenModal: (modal: 'newTask' | 'settings' | false) => void;
  columnRefs: ColumnRefs;
  updateColumnRef: (status: string, ref: any) => void;
  handleEditTask: (task: Task) => void;
  handleTaskComplete: () => void;
  handleSettingsComplete: () => void;
  handleDragEnd: (task: Task, newStatus: string) => void;
  taskBoard: ReturnType<typeof useTaskBoardStore>['getTaskBoard'] extends 
    (uuid: string) => infer R ? R : never;
  tasks: Task[];
};

export type TaskBoardContent = React.FC<TaskBoardContentProps>;

type TaskBoardParentProps = {
  TaskBoardContent: TaskBoardContent;
};

export const TaskBoardParent = ({ TaskBoardContent }: TaskBoardParentProps) => {
  const { uuid } = useLocalSearchParams();
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);
  const [columnRefs, setColumnRefs] = useState<ColumnRefs>({});
  const [taskEdit, setTaskEdit] = useState<false | Task>(false);
  const [openModal, setOpenModal] = useState<'newTask' | 'settings' | false>(false);

  const { getTaskBoard } = useTaskBoardStore();
  const { tasksFromBoard, saveTask } = useTaskStore();

  // Validate UUID
  useEffect(() => {
    try {
      parse(uuid as string);
      setIsInvalidUUID(false);
    } catch (error) {
      setIsInvalidUUID(true);
    }
  }, [uuid]);

  const updateColumnRef = useCallback((status: string, ref: any) => {
    setColumnRefs((prev) => ({
      ...prev,
      [status]: ref,
    }));
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskEdit(task);
    setOpenModal('newTask');
  }, []);

  const handleTaskComplete = useCallback(() => {
    setTaskEdit(false);
    setOpenModal(false);
  }, []);

  const handleSettingsComplete = useCallback(() => {
    setOpenModal(false);
  }, []);

  const handleDragEnd = useCallback(
    (task: Task, newStatus: string) => {
      if (newStatus !== task.status) {
        saveTask(task.taskBoardUUID, {
          uuid: task.uuid,
          completionStatus: newStatus,
        });
      }
    },
    [saveTask]
  );

  if (isInvalidUUID || !getTaskBoard(uuid as string)) {
    return <Redirect href="./new" />;
  }

  const tasks = tasksFromBoard(uuid as string);
  const taskBoard = getTaskBoard(uuid as string);

  if (!taskBoard) {
    return <Redirect href="./new" />;
  }

  return (
    <TaskBoardContent
      uuid={uuid as string}
      taskEdit={taskEdit}
      setTaskEdit={setTaskEdit}
      openModal={openModal}
      setOpenModal={setOpenModal}
      columnRefs={columnRefs}
      updateColumnRef={updateColumnRef}
      handleEditTask={handleEditTask}
      handleTaskComplete={handleTaskComplete}
      handleSettingsComplete={handleSettingsComplete}
      handleDragEnd={handleDragEnd}
      taskBoard={taskBoard}
      tasks={tasks}
    />
  );
};
