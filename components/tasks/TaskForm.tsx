import { useState, useEffect } from 'react';
import { Pressable, Text, View, TextInput } from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ScrollView } from 'react-native-gesture-handler';
import { TagsInput } from '../TagsInput';
import DueDateInput from '../DueDateInput';
import { Task, useTaskStore } from '../../utils/manageTasks';

type TaskFormContentProps = {
  taskEdit: Task | false;
  boardUuid: string;
  onComplete: () => void;
  inBottomSheet?: boolean;
};

export default function TaskFormContent({
  taskEdit,
  boardUuid,
  onComplete,
  inBottomSheet = true,
}: TaskFormContentProps) {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [taskDueDate, setTaskDueDate] = useState('');
  const { saveTask, deleteTask } = useTaskStore();

  // Initialize form when taskEdit changes
  useEffect(() => {
    if (taskEdit) {
      setTaskName(taskEdit.name || '');
      setTaskDescription(taskEdit.description || '');
      setTaskTags(taskEdit.tags || []);
      setTaskDueDate(taskEdit.endsAt || '');
    } else {
      setTaskName('');
      setTaskDescription('');
      setTaskTags([]);
      setTaskDueDate('');
    }
  }, [taskEdit]);

  const handleSubmit = async () => {
    try {
      if (taskEdit) {
        await saveTask(boardUuid, {
          uuid: taskEdit.uuid,
          name: taskName,
          description: taskDescription,
          tags: taskTags,
          endsAt: taskDueDate,
        });
      } else {
        await saveTask(boardUuid, {
          name: taskName,
          description: taskDescription,
          tags: taskTags,
          endsAt: taskDueDate,
        });
      }
      
      // Reset form and notify parent
      setTaskName('');
      setTaskDescription('');
      setTaskTags([]);
      setTaskDueDate('');
      onComplete();
    } catch (error) {
      console.error('Failed to save task:', error);
      // Handle error state (could add error state and display)
    }
  };
  
  const handleDelete = async () => {
    if (!taskEdit) return;
    
    try {
      await deleteTask(taskEdit.uuid);
      onComplete();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Use appropriate components based on whether we're in a bottom sheet
  const TextInputComponent = inBottomSheet ? BottomSheetTextInput : TextInput;
  const ScrollViewComponent = inBottomSheet ? BottomSheetScrollView : ScrollView;

  return (
    <View className="flex flex-col gap-4 p-8 pb-10">
      <ScrollViewComponent>
        {taskEdit && (
          <Pressable
            onPress={handleDelete}
            className="flex-1 rounded-xl bg-red-500 p-2 mb-4">
            <Text className="text-center text-text">Delete Task</Text>
          </Pressable>
        )}
        <Text className="mb-2 text-text">Task name:</Text>
        <TextInputComponent
          value={taskName}
          onChangeText={setTaskName}
          className="rounded-xl bg-secondary-850 p-2 text-text"
          onSubmitEditing={handleSubmit}
        />
        <Text className="mb-2 mt-4 text-text">Task description:</Text>
        <TextInputComponent
          value={taskDescription}
          onChangeText={setTaskDescription}
          className="rounded-xl bg-secondary-850 p-2 text-text"
          onSubmitEditing={handleSubmit}
        />
        <TagsInput tags={taskTags} setTags={setTaskTags} inBottomSheet={inBottomSheet} />
        <DueDateInput date={taskDueDate} setDate={setTaskDueDate} />
      </ScrollViewComponent>
      <Pressable
        className="rounded-xl bg-primary p-2 mt-4"
        onPress={handleSubmit}>
        <Text className="text-center text-background">
          {taskEdit ? 'Save Changes' : 'Add Task'}
        </Text>
      </Pressable>
    </View>
  );
}
