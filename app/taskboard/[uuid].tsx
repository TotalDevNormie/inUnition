import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useRef, useEffect, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

import { TaskBoardParent, TaskBoardContent } from '../../components/tasks/TaskBoardParent';
import TaskBoardSettings from '../../components/tasks/TaskBoardSettings';
import TaskColumn from '../../components/tasks/TaskColumn';
import TaskForm from '../../components/tasks/TaskForm';

export default function Tasks() {
  return <TaskBoardParent TaskBoardContent={TaskBoardContentMobile} />;
}

export const TaskBoardContentMobile: TaskBoardContent = ({
  uuid,
  taskEdit,
  setTaskEdit,
  openModal,
  setOpenModal,
  columnRefs,
  updateColumnRef,
  handleEditTask,
  handleTaskComplete,
  handleSettingsComplete,
  handleDragEnd,
  taskBoard,
  tasks,
}) => {
  const newTaskSheet = useRef<BottomSheetModal>(null);
  const settingsSheet = useRef<BottomSheetModal>(null);

  // Handle bottom sheet visibility
  useEffect(() => {
    if (openModal === 'settings') {
      settingsSheet.current?.present();
    } else if (openModal === 'newTask' || taskEdit) {
      newTaskSheet.current?.present();
    } else {
      newTaskSheet?.current?.dismiss();
      settingsSheet?.current?.dismiss();
    }
  }, [openModal, taskEdit]);

  const handleNewTaskSheetChanges = useCallback(
    (index: number) => {
      if (index == -1) {
        setTaskEdit(false);
        if (openModal === 'newTask') setOpenModal(false);
      }
    },
    [openModal, setOpenModal, setTaskEdit]
  );

  const handleSettingsSheetChanges = useCallback(
    (index: number) => {
      if (index == -1 && openModal === 'settings') setOpenModal(false);
    },
    [openModal, setOpenModal]
  );

  return (
    <BottomSheetModalProvider>
      <View className="flex flex-col gap-8 p-4">
        <View className="flex flex-row justify-between">
          <Pressable onPress={() => router.back()}>
            <Text className="text-text">
              <AntDesign name="arrowleft" size={24} />{' '}
            </Text>
          </Pressable>
          <View className="flex flex-row gap-2">
            <Pressable
              className="p-2"
              onPress={() => {
                setOpenModal(openModal !== 'newTask' ? 'newTask' : false);
                setTaskEdit(false);
              }}>
              <Text className="text-text">
                <MaterialIcons name="add-task" size={24} />{' '}
              </Text>
            </Pressable>
            <Pressable
              className="p-2"
              onPress={() => {
                setOpenModal(openModal !== 'settings' ? 'settings' : false);
              }}>
              <Text className="text-text">
                <Ionicons name="settings" size={24} />{' '}
              </Text>
            </Pressable>
          </View>
        </View>
        <ScrollView>
          <View className="flex flex-row items-center gap-2">
            <Text className="grow text-2xl text-text">{taskBoard.name} </Text>
            <Text className="grow text-text">{taskBoard.description} </Text>
          </View>

          <View className="flex flex-wrap gap-2 portrait:flex-col landscape:flex-row">
            {taskBoard.statusTypes?.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasks.filter((task) => task.completionStatus === status)}
                onDragEnd={handleDragEnd}
                updateColumnRef={updateColumnRef}
                editTask={handleEditTask}
                columnRefs={columnRefs}
              />
            ))}
          </View>
        </ScrollView>

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
          backgroundStyle={{ backgroundColor: '#121517' }}>
          <BottomSheetView>
            <TaskForm taskEdit={taskEdit} boardUuid={uuid} onComplete={handleTaskComplete} />
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
          backgroundStyle={{ backgroundColor: '#121517' }}>
          <BottomSheetView>
            <TaskBoardSettings boardUuid={uuid} onComplete={handleSettingsComplete} />
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};
