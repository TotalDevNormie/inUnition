import { View, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import TaskColumn from '../../components/tasks/TaskColumn';
import { TaskBoardParent, TaskBoardContent } from '../../components/tasks/TaskBoardParent';
import TaskForm from '../../components/tasks/TaskForm';
import TaskBoardSettings from '../../components/tasks/TaskBoardSettings';
import Modal from '../../components/Modal';

const WebTasks = () => <TaskBoardParent TaskBoardContent={TaskBoardContentWeb} />;

const TaskBoardContentWeb: TaskBoardContent = ({
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
  return (
    <View className="mx-8 my-4 flex flex-col gap-8">
      <View className="flex flex-row justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text">
            <AntDesign name="arrowleft" size={24} />
          </Text>
        </Pressable>
        <View className="flex flex-row gap-2">
          <Pressable
            className="p-2"
            onPress={() => {
              setOpenModal('newTask');
              setTaskEdit(false);
            }}>
            <Text className="text-text">
              <MaterialIcons name="add-task" size={24} />
            </Text>
          </Pressable>
          <Pressable
            className="p-2"
            onPress={() => {
              setOpenModal('settings');
            }}>
            <Text className="text-text">
              <Ionicons name="settings" size={24} />
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="flex flex-row items-center gap-2">
        <Text className="grow text-2xl text-text">{taskBoard.name}</Text>
        <Text className="grow text-text">{taskBoard.description}</Text>
      </View>
      <View className="flex flex-wrap gap-4">
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

export default WebTasks;
