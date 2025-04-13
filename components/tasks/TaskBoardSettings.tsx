import { useState, useEffect } from 'react';
import { Pressable, Text, View, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { TagsInput } from '../TagsInput';
import DueDateInput from '../DueDateInput';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import { router } from 'expo-router';

type TaskBoardSettingsContentProps = {
  boardUuid: string;
  onComplete: () => void;
  inBottomSheet?: boolean;
};

export default function TaskBoardSettingsContent({
  boardUuid,
  onComplete,
  inBottomSheet = true,
}: TaskBoardSettingsContentProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const { getTaskBoard, saveTaskBoard, deleteTaskBoard } = useTaskBoardStore();

  // Load initial data
  useEffect(() => {
    const board = getTaskBoard(boardUuid);
    if (board) {
      setName(board.name || '');
      setDescription(board.description || '');
      setTags(board.tags || []);
      setDueDate(board.endsAt || '');
    }
  }, [boardUuid, getTaskBoard]);

  // Save board data when form values change
  useEffect(() => {
    // Skip the initial render
    if (!name) return;
    
    const saveData = async () => {
      try {
        await saveTaskBoard({
          uuid: boardUuid,
          name,
          description,
          tags,
          endsAt: dueDate,
        });
      } catch (error) {
        console.error('Failed to save board settings:', error);
      }
    };
    
    saveData();
  }, [name, description, tags, dueDate, boardUuid, saveTaskBoard]);

  const handleDeleteBoard = async () => {
    try {
      await deleteTaskBoard(boardUuid);
      router.replace('/tasks');
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleNewBoard = () => {
    router.push('./new');
  };

  const TextInputComponent = inBottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View className="flex flex-col gap-4 p-8 pb-10">
      <View className="flex flex-row gap-2 mb-2">
        <Pressable
          onPress={handleDeleteBoard}
          className="flex-1 rounded-xl bg-red-500 p-2">
          <Text className="text-center text-text">Delete Task Board</Text>
        </Pressable>
        <Pressable
          onPress={handleNewBoard}
          className="flex-1 rounded-xl bg-accent p-2">
          <Text className="text-center text-background">New Task Board</Text>
        </Pressable>
      </View>

      <Text className="text-text">Board name:</Text>
      <TextInputComponent
        value={name}
        onChangeText={setName}
        className="rounded-xl bg-secondary-850 p-2 text-text"
      />

      <Text className="text-text">Description:</Text>
      <TextInputComponent
        value={description}
        onChangeText={setDescription}
        className="rounded-xl bg-secondary-850 p-2 text-text"
      />

      <TagsInput tags={tags} setTags={setTags} inBottomSheet={inBottomSheet} />
      <DueDateInput date={dueDate} setDate={setDueDate} />
    </View>
  );
}
