import { useState, useEffect, useCallback, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import 'react-native-get-random-values';
import { parse } from 'uuid';
import { Task, useTaskStore } from '../../utils/manageTasks';
import Animated, { AnimatedRef } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import DueDateInput from '../../components/DueDateInput';
import { TagsInput } from '../../components/TagsInput';
import TaskColumn, { ColumnRefs } from '../../components/tasks/TaskColumn';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';

export default function Tasks() {
  const { uuid } = useLocalSearchParams();
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [columnRefs, setColumnRefs] = useState<ColumnRefs>({});
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const newTaskSheet = useRef<BottomSheetModal>(null);
  const settingsSheet = useRef<BottomSheetModal>(null);
  const [openModal, setOpenModal] = useState<'newTask' | 'settings' | false>(
    false,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [taskEdit, setTaskEdit] = useState<false | Task>(false);

  const { getTaskBoard, saveTaskBoard, deleteTaskBoard } = useTaskBoardStore();
  const { tasksFromBoard, tasks, saveTask, deleteTask } = useTaskStore();
  console.log(tasks, tasksFromBoard(uuid as string));

  const updateColumnRef = useCallback(
    (status: string, ref: AnimatedRef<Animated.View>) => {
      setColumnRefs((prev) => ({
        ...prev,
        [status]: ref,
      }));
    },
    [],
  );

  useEffect(() => {
    console.log('openModal', openModal, taskEdit);
    if (openModal === 'settings') {
      setNewName(getTaskBoard(uuid as string)?.name || '');
      setNewDescription(getTaskBoard(uuid as string)?.description || '');
      setTags(getTaskBoard(uuid as string)?.tags || []);
      setDueDate(getTaskBoard(uuid as string)?.endsAt || '');
      setIsInitialLoad(false);
      settingsSheet.current?.present();
    } else if (openModal === 'newTask' || taskEdit) {
      newTaskSheet.current?.present();
    } else {
      console.log('dismiss', openModal, taskEdit);
      newTaskSheet?.current?.dismiss();
      settingsSheet?.current?.dismiss();
    }
  }, [openModal, taskEdit]);

  useEffect(() => {
    try {
      parse(uuid as string);
      setIsInvalidUUID(false);
    } catch (error) {
      setIsInvalidUUID(true);
    }
  }, [uuid]);

  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    saveTaskBoard({
      name: newName,
      description: newDescription,
      tags,
      endsAt: dueDate,
    });
  }, [newName, newDescription, tags, dueDate]);

  const createTask = async () => {
    try {
      console.log('works');
      await saveTask(uuid as string, {
        name: newTaskName,
        description: newTaskDescription,
      });
      setNewTaskName('');
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleNewTaskSheetChanges = useCallback(
    (index: number) => {
      if (index == -1) {
        handleTaskEditEnd();
        if (openModal === 'newTask') setOpenModal(false);
      }
    },
    [openModal],
  );

  const handleSettingsSheetChanges = useCallback(
    (index: number) => {
      if (index == -1 && openModal === 'settings') setOpenModal(false);
    },
    [openModal],
  );

  const handleEditTask = useCallback((task: Task) => {
    setTaskEdit(task);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description);
  }, []);

  const updateEditedTask = useCallback(() => {
    console.log('works');

    if (taskEdit) {
      saveTask(uuid as string, {
        uuid: taskEdit.uuid,
        name: newTaskName,
        description: newTaskDescription,
      });
      handleTaskEditEnd();
    }
  }, [taskEdit, newTaskName, newTaskDescription]);

  const handleTaskEditEnd = useCallback(() => {
    setTaskEdit(false);
    setNewTaskName('');
    setNewTaskDescription('');
  }, []);

  const handleDragEnd = useCallback(
    (task: Task, newStatus: string) => {
      console.log(newStatus);

      if (newStatus !== task.status) {
        saveTask(task.taskBoardUUID, {
          uuid: task.uuid,
          completionStatus: newStatus,
        });
      }
    },
    [saveTask],
  );

  if (isInvalidUUID || !getTaskBoard(uuid as string))
    return <Redirect href="./new" />;

  return (
    <BottomSheetModalProvider>
      <GestureHandlerRootView>
        <View className="flex flex-col gap-8 mx-8 my-4">
          <View className="flex flex-row justify-between ">
            <Pressable onPress={() => router.back()}>
              <Text className="text-text">
                <AntDesign name="arrowleft" size={24} />
              </Text>
            </Pressable>
            <View className="flex flex-row gap-2">
              <Pressable
                className="p-2"
                onPress={() => {
                  setOpenModal(openModal !== 'newTask' ? 'newTask' : false);
                  handleTaskEditEnd();
                }}
              >
                <Text className="text-text">
                  <MaterialIcons name="add-task" size={24} />
                </Text>
              </Pressable>
              <Pressable
                className="p-2"
                onPress={() => {
                  setOpenModal(openModal !== 'settings' ? 'settings' : false);
                }}
              >
                <Text className="text-text">
                  <Ionicons name="settings" size={24} />
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="flex flex-row gap-2 items-center">
            <Text className="text-2xl text-text grow">
              {getTaskBoard(uuid as string)?.name}
            </Text>
            <Text className="text-text grow">
              {getTaskBoard(uuid as string)?.description}
            </Text>
          </View>
          <View className="flex portrait:flex-col landscape:flex-row gap-2 flex-wrap">
            {getTaskBoard(uuid as string)?.statusTypes?.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasksFromBoard(uuid as string).filter(
                  (task) => task.completionStatus === status,
                )}
                onDragEnd={handleDragEnd}
                updateColumnRef={updateColumnRef}
                editTask={handleEditTask}
                columnRefs={columnRefs}
              />
            ))}
          </View>
          <BottomSheetModal
            ref={newTaskSheet}
            onChange={handleNewTaskSheetChanges}
            enablePanDownToClose
            handleStyle={{
              backgroundColor: '#121517',
              borderTopWidth: 2,
              borderTopColor: '#313749',
            }}
            handleIndicatorStyle={{ backgroundColor: '#313749' }}
            backgroundStyle={{ backgroundColor: '#121517' }}
          >
            <BottomSheetView>
              <View className="flex flex-col p-8 pb-10 gap-4">
                {taskEdit && (
                  <Pressable
                    onPress={() => {
                      deleteTask(taskEdit.uuid);
                      handleTaskEditEnd();
                    }}
                    className="bg-red-500 p-2 rounded-xl flex-1"
                  >
                    <Text className="text-text text-center">Delete Task </Text>
                  </Pressable>
                )}
                <Text className="text-text mb-2">Task name:</Text>
                <BottomSheetTextInput
                  value={newTaskName}
                  onChangeText={setNewTaskName}
                  className="border text-text border-gray-300 rounded-xl p-2"
                  onSubmitEditing={() =>
                    taskEdit ? updateEditedTask() : createTask()
                  }
                />
                <Text className="text-text mb-2">Task description:</Text>
                <BottomSheetTextInput
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  className="border text-text border-gray-300 rounded-xl p-2"
                  onSubmitEditing={() =>
                    taskEdit ? updateEditedTask() : createTask()
                  }
                />
                <Pressable
                  className="bg-primary p-2 rounded-xl "
                  onPress={() => (taskEdit ? updateEditedTask() : createTask())}
                >
                  <Text className="text-background text-center">
                    {taskEdit ? 'Save' : 'Add Task'}
                  </Text>
                </Pressable>
              </View>
            </BottomSheetView>
          </BottomSheetModal>

          <BottomSheetModal
            ref={settingsSheet}
            onChange={handleSettingsSheetChanges}
            index={0}
            enablePanDownToClose
            handleStyle={{
              backgroundColor: '#121517',
              borderTopWidth: 2,
              borderTopColor: '#313749',
            }}
            handleIndicatorStyle={{ backgroundColor: '#313749' }}
            backgroundStyle={{ backgroundColor: '#121517' }}
          >
            <BottomSheetView>
              <View className="flex flex-col p-8 pb-10 gap-4">
                <View className="flex flex-row gap-2">
                  <Pressable
                    onPress={() => deleteTaskBoard(uuid as string)}
                    className="bg-red-500 p-2 rounded-xl flex-1"
                  >
                    <Text className="text-text text-center">
                      Delete Task Board{' '}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('./new')}
                    className="bg-accent p-2 rounded-xl flex-1"
                  >
                    <Text className="text-background text-center">
                      New Task Board
                    </Text>
                  </Pressable>
                </View>
                <TagsInput tags={tags} setTags={setTags} inBottomSheet />
                <DueDateInput date={dueDate} setDate={setDueDate} />
              </View>
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
