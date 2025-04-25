import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, Pressable, Text } from 'react-native';

import Modal from '../../components/Modal';
import { TaskBoardParent, TaskBoardContent } from '../../components/tasks/TaskBoardParent';
import TaskBoardSettings from '../../components/tasks/TaskBoardSettings';
import TaskColumn from '../../components/tasks/TaskColumn';
import TaskForm from '../../components/tasks/TaskForm';

export default function WebTasks() {
  return <TaskBoardParent TaskBoardContent={TaskBoardContentWeb} />;
}

export const TaskBoardContentWeb: TaskBoardContent = ({
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
  const isTaskModalOpen = openModal === 'newTask' || !!taskEdit;
  const isSettingsModalOpen = openModal === 'settings';

  const handleCloseTaskModal = (open: boolean) => {
    if (!open) {
      setOpenModal(false);
      setTaskEdit(false);
    }
  };

  const handleCloseSettingsModal = (open: boolean) => {
    if (!open) {
      setOpenModal(false);
    }
  };

  console.log('tasks', tasks);
  console.log('task board statuses', taskBoard.statusTypes);

  return (
    <View className=" my-4 flex flex-col gap-8">
      <View className="flex flex-row justify-between ">
        <View className="flex flex-1 flex-col gap-2">
          <Text className="grow text-2xl text-text">{taskBoard.name} </Text>
          <Text className="grow text-text">{taskBoard.description} </Text>
        </View>
        <View className="flex flex-row gap-2">
          <Pressable
            className="p-2"
            onPress={() => {
              setOpenModal('newTask');
              setTaskEdit(false);
            }}>
            <Text className="text-text">
              <MaterialIcons name="add-task" size={24} />{' '}
            </Text>
          </Pressable>
          <Pressable
            className="p-2"
            onPress={() => {
              setOpenModal('settings');
            }}>
            <Text className="text-text">
              <Ionicons name="settings" size={24} />{' '}
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="flex flex-wrap gap-2 portrait:flex-col landscape:flex-row">
        {taskBoard.statusTypes?.map((status: string) => (
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
      <Modal
        open={isTaskModalOpen}
        setOpen={handleCloseTaskModal}
        title={taskEdit ? 'Edit Task' : 'New Task'}>
        <TaskForm
          taskEdit={taskEdit}
          boardUuid={uuid}
          onComplete={handleTaskComplete}
          inBottomSheet={false}
        />
      </Modal>
      <Modal open={isSettingsModalOpen} setOpen={handleCloseSettingsModal} title="Board Settings">
        <TaskBoardSettings
          boardUuid={uuid}
          onComplete={handleSettingsComplete}
          inBottomSheet={false}
        />
      </Modal>
    </View>
  );
};
