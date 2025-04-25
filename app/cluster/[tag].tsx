import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Platform, Text, View } from 'react-native';
import { Pressable, ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';

import { TaskBoardContentWeb } from '../taskboard/[uuid].web';

import NotesSlider from '~/components/NotesSlider';
import { Hr } from '~/components/WebTabLayout';
import { TaskBoardParent } from '~/components/tasks/TaskBoardParent';
import TaskBoardSettings from '~/components/tasks/TaskBoardSettings';
import TaskColumn from '~/components/tasks/TaskColumn';
import TaskForm from '~/components/tasks/TaskForm';
import { useNoteStore } from '~/utils/manageNotes';
import { useTaskBoardStore } from '~/utils/manageTaskBoards';
import { Task, useTaskStore } from '~/utils/manageTasks';

export default function TagCluster() {
  const { tag } = useLocalSearchParams();
  const { notesWithTag } = useNoteStore();
  const { taskBoardsWithTag } = useTaskBoardStore();
  const { tasksFromBoard, saveTask } = useTaskStore();

  // State for controlling bottom sheets
  const [activeTaskBoardId, setActiveTaskBoardId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState<false | Task>(false);
  const [openModal, setOpenModal] = useState<'newTask' | 'settings' | false>(false);
  const [columnRefs, setColumnRefs] = useState({});

  // Bottom sheet refs
  const newTaskSheet = useRef<BottomSheetModal>(null);
  const settingsSheet = useRef<BottomSheetModal>(null);

  if (!tag) return <Redirect href="/" />;

  const notes = notesWithTag(tag as string);
  const taskBoards = taskBoardsWithTag(tag as string);

  if (!notes.length && !taskBoards.length) return <Redirect href="/" />;

  // Handle bottom sheet visibility
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (openModal === 'settings') {
        settingsSheet.current?.present();
      } else if (openModal === 'newTask' || taskEdit) {
        newTaskSheet.current?.present();
      } else {
        newTaskSheet?.current?.dismiss();
        settingsSheet?.current?.dismiss();
      }
    }
  }, [openModal, taskEdit]);

  const handleNewTaskSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setTaskEdit(false);
        if (openModal === 'newTask') setOpenModal(false);
      }
    },
    [openModal]
  );

  const handleSettingsSheetChanges = useCallback(
    (index: number) => {
      if (index === -1 && openModal === 'settings') setOpenModal(false);
    },
    [openModal]
  );

  const handleTaskComplete = useCallback(() => {
    setTaskEdit(false);
    setOpenModal(false);
  }, []);

  const handleSettingsComplete = useCallback(() => {
    setOpenModal(false);
  }, []);

  const handleEditTask = useCallback((task: Task, boardId: string) => {
    setActiveTaskBoardId(boardId);
    setTaskEdit(task);
    setOpenModal('newTask');
  }, []);

  const handleAddTask = useCallback((boardId: string) => {
    setActiveTaskBoardId(boardId);
    setTaskEdit(false);
    setOpenModal('newTask');
  }, []);

  const handleOpenSettings = useCallback((boardId: string) => {
    setActiveTaskBoardId(boardId);
    setOpenModal('settings');
  }, []);

  const handleDragEnd = useCallback(
    (task: Task, newStatus: string, boardId: string) => {
      if (newStatus !== task.completionStatus) {
        saveTask(boardId, {
          uuid: task.uuid,
          completionStatus: newStatus,
        });
      }
    },
    [saveTask]
  );

  const updateColumnRef = useCallback((status: string, ref: any) => {
    setColumnRefs((prev) => ({
      ...prev,
      [status]: ref,
    }));
  }, []);

  const renderWebContent = () => (
    <ScrollView>
      <Text className="pb-8 text-3xl text-text">
        <Text className="font-extrabold capitalize text-text">{tag} </Text> Cluster
      </Text>

      {notes.length > 0 && (
        <>
          <Text className="pb-4 text-xl text-text">Notes</Text>
          <View className="flex flex-col gap-2">
            <NotesSlider notes={notes} />
          </View>
        </>
      )}

      {taskBoards.length > 0 && <Text className="py-4 text-xl text-text">Task Boards</Text>}

      {taskBoards.map((taskBoard) => (
        <View key={taskBoard.uuid}>
          <Hr />
          <TaskBoardParent propUuid={taskBoard.uuid} TaskBoardContent={TaskBoardContentWeb} />
        </View>
      ))}
    </ScrollView>
  );

  const renderMobileContent = () => (
    <ScrollView>
      <View className="flex flex-row justify-between pb-8 pt-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text">
            <AntDesign name="arrowleft" size={24} />
          </Text>
        </Pressable>
        <Text className="text-3xl text-text">
          <Text className="font-extrabold capitalize text-text">{tag} </Text> Cluster{' '}
        </Text>
      </View>

      {notes.length > 0 && (
        <>
          <Text className="pb-4 text-xl text-text">Notes</Text>
          <View className="flex flex-col gap-2">
            <NotesSlider notes={notes} />
          </View>
        </>
      )}

      {taskBoards.length > 0 && <Text className="py-4 text-xl text-text">Task Boards</Text>}

      {taskBoards.map((taskBoard) => {
        const tasks = tasksFromBoard(taskBoard.uuid);

        return (
          <View key={taskBoard.uuid} className="mb-6 border-t border-gray-700 pt-4">
            <View className="mb-4 flex flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-text">{taskBoard.name}</Text>
              <View className="flex flex-row gap-2">
                <Pressable className="p-2" onPress={() => handleAddTask(taskBoard.uuid)}>
                  <MaterialIcons name="add-task" size={24} color="#fff" />
                </Pressable>
                <Pressable className="p-2" onPress={() => handleOpenSettings(taskBoard.uuid)}>
                  <Ionicons name="settings" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>

            <Text className="mb-4 text-sm text-gray-400">{taskBoard.description}</Text>

            <View className="flex flex-wrap gap-2 portrait:flex-col landscape:flex-row">
              {taskBoard.statusTypes?.map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
                  tasks={tasks.filter((task) => task.completionStatus === status)}
                  onDragEnd={(task, newStatus) => handleDragEnd(task, newStatus, taskBoard.uuid)}
                  updateColumnRef={updateColumnRef}
                  editTask={(task) => handleEditTask(task, taskBoard.uuid)}
                  columnRefs={columnRefs}
                />
              ))}
            </View>
          </View>
        );
      })}

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
        index={0}
        snapPoints={['70%']}>
        <BottomSheetView>
          {activeTaskBoardId && (
            <TaskForm
              taskEdit={taskEdit}
              boardUuid={activeTaskBoardId}
              onComplete={handleTaskComplete}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={settingsSheet}
        onChange={handleSettingsSheetChanges}
        index={0}
        snapPoints={['70%']}
        enablePanDownToClose
        handleStyle={{
          backgroundColor: '#121517',
          borderTopWidth: 2,
          borderTopColor: '#313749',
        }}
        handleIndicatorStyle={{ backgroundColor: '#313749' }}
        backgroundStyle={{ backgroundColor: '#121517' }}>
        <BottomSheetView>
          {activeTaskBoardId && (
            <TaskBoardSettings boardUuid={activeTaskBoardId} onComplete={handleSettingsComplete} />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </ScrollView>
  );

  // For web, just return the web content
  if (Platform.OS === 'web') {
    return renderWebContent();
  }

  // For mobile, wrap with necessary providers
  return (
    <BottomSheetModalProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>{renderMobileContent()}</GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
