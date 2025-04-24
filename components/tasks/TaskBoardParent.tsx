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
  taskBoard: ReturnType<typeof useTaskBoardStore>['getTaskBoard'] extends (uuid: string) => infer R
    ? R
    : never;
  tasks: Task[];
};

export type TaskBoardContent = React.FC<TaskBoardContentProps>;

// Add this to your TaskBoardParent type
type TaskBoardParentProps = {
  TaskBoardContent: TaskBoardContent;
  propUuid?: string;
  externalControls?: {
    handleEditTask: (task: Task) => void;
    handleAddTask: () => void;
    handleOpenSettings: () => void;
    isActive: boolean;
    taskEdit: false | Task;
    openModal: 'newTask' | 'settings' | false;
  };
};

export const TaskBoardParent = ({ 
  TaskBoardContent, 
  propUuid, 
  externalControls 
}: TaskBoardParentProps) => {
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);
  const [columnRefs, setColumnRefs] = useState<ColumnRefs>({});
  
  // Only use internal state if external controls aren't provided
  const [taskEdit, setTaskEdit] = useState<false | Task>(false);
  const [openModal, setOpenModal] = useState<'newTask' | 'settings' | false>(false);

  const { getTaskBoard } = useTaskBoardStore();
  const { tasksFromBoard, saveTask } = useTaskStore();

  const uuid = propUuid || useLocalSearchParams().uuid;

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

  // Use internal or external handlers based on what's provided
  const handleEditTask = useCallback((task: Task) => {
    if (externalControls) {
      externalControls.handleEditTask(task);
    } else {
      setTaskEdit(task);
      setOpenModal('newTask');
    }
  }, [externalControls]);

  const handleTaskComplete = useCallback(() => {
    if (!externalControls) {
      setTaskEdit(false);
      setOpenModal(false);
    }
  }, [externalControls]);

  const handleSettingsComplete = useCallback(() => {
    if (!externalControls) {
      setOpenModal(false);
    }
  }, [externalControls]);

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

  const tasks = tasksFromBoard(uuid as string);
  const taskBoard = getTaskBoard(uuid as string);

  // Use external or internal state values
  const effectiveTaskEdit = externalControls && externalControls.isActive 
    ? externalControls.taskEdit 
    : taskEdit;
    
  const effectiveOpenModal = externalControls && externalControls.isActive
    ? externalControls.openModal
    : openModal;

  const effectiveSetTaskEdit = externalControls ? () => {} : setTaskEdit;
  const effectiveSetOpenModal = externalControls 
    ? (val: 'newTask' | 'settings' | false) => {
        if (val === 'newTask') externalControls.handleAddTask();
        else if (val === 'settings') externalControls.handleOpenSettings();
      }
    : setOpenModal;

  if (isInvalidUUID || !taskBoard) {
    return <Redirect href="./new" />;
  }

  return (
    <TaskBoardContent
      uuid={uuid as string}
      taskEdit={effectiveTaskEdit}
      setTaskEdit={effectiveSetTaskEdit}
      openModal={effectiveOpenModal}
      setOpenModal={effectiveSetOpenModal}
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
