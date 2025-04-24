import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { TagsInput } from '../../components/TagsInput';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import DraggableList from 'react-draggable-list';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import { useUserSettingsStore } from '../(tabs)/user';

type ListItemProps = {
  dragHandleProps?: any;
  item: string;
  editing: string | false;
  editingStatus: string;
  handleEditingStatusChange: (status: string) => void;
  handleEditing: (status: string) => void;
  deleteStatus: (status: string) => void;
};

const ListItem = ({
  dragHandleProps = {},
  item,
  editing,
  editingStatus,
  handleEditingStatusChange,
  handleEditing,
  deleteStatus,
}: ListItemProps) => {
  return (
    <View className="mb-2 flex flex-row gap-2 rounded-xl bg-secondary-850 p-2">
      <Text className="text-text" {...dragHandleProps}>
        <MaterialCommunityIcons name="dots-grid" size={24} />{' '}
      </Text>
      {editing === item ? (
        <TextInput
          className="grow text-center text-text"
          value={editingStatus}
          autoFocus
          onSubmitEditing={() => handleEditing(item)}
          onChangeText={(text) => handleEditingStatusChange(text)}
        />
      ) : (
        <Text className="grow text-center text-text">{item} </Text>
      )}
      <Pressable onPress={() => handleEditing(item)}>
        <Text className="text-text">
          <AntDesign name={editing === item ? 'check' : 'edit'} size={24} />{' '}
        </Text>
      </Pressable>
      <Pressable onPress={() => deleteStatus(item)}>
        <Text className="text-text">
          <AntDesign name="close" size={24} />{' '}
        </Text>
      </Pressable>
    </View>
  );
};

export default function Task() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusTypes, setStatusTypes] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | false>(false);
  const [editingStatus, setEditingStatus] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();

  const { saveTaskBoard } = useTaskBoardStore();
  const { defaultStatusTypes } = useUserSettingsStore(); // Get default status types from settings

  // Initialize status types from user settings
  useEffect(() => {
    if (defaultStatusTypes && defaultStatusTypes.length > 0) {
      setStatusTypes([...defaultStatusTypes]);
    } else {
      // Fallback to default values if settings are not available
      setStatusTypes(['Todo', 'Doing', 'Done']);
    }
  }, [defaultStatusTypes]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the task board');
      return;
    }

    try {
      const uuid = await saveTaskBoard({
        name,
        description,
        statusTypes,
        tags,
      });
      console.log(uuid);
      router.replace(`/taskboard/${uuid}`);
    } catch (error) {
      console.error('Failed to create task board:', error);
    }
  };

  const handleNewStatus = () => {
    if (newStatus === '') return;
    // Limit to 5 status types
    setStatusTypes([...new Set([...statusTypes, newStatus])].slice(0, 5));
    setNewStatus('');
  };

  const deleteStatus = (status: string) => {
    if (statusTypes.length <= 2) {
      alert('You need at least 2 status types');
      return;
    }
    setStatusTypes(statusTypes.filter((s) => s !== status));
  };

  const handleEditing = (status: string) => {
    if (editing) {
      if (!editingStatus.trim()) {
        alert('Status name cannot be empty');
        return;
      }

      setStatusTypes(
        statusTypes.map((s: string): string => (s === editing && editingStatus ? editingStatus : s))
      );

      if (editing === status) {
        setEditing(false);
        setEditingStatus('');
        return;
      }
    }
    setEditing(status);
    setEditingStatus(status);
  };

  const handleEditingStatusChange = (text: string) => {
    setEditingStatus(text.slice(0, 25));
  };

  const resetToDefaults = () => {
    setStatusTypes([...defaultStatusTypes]);
    setEditing(false);
    setEditingStatus('');
  };

  return (
    <GestureHandlerRootView>
      <ScrollView className="mx-auto flex w-full max-w-[50rem] flex-col gap-8 px-4 py-8">
        {Platform.OS !== 'web' && (
          <View className="flex flex-row justify-between pb-8">
            <Pressable onPress={() => router.back()}>
              <Text className="text-text">
                <AntDesign name="arrowleft" size={24} />{' '}
              </Text>
            </Pressable>
          </View>
        )}
        <View className="mb-4 flex flex-col gap-2">
          <Text className="text-text">Name: </Text>
          <TextInput
            className="rounded-lg bg-secondary-850 p-2 text-text"
            value={name}
            onChangeText={(newName) => setName(newName.slice(0, 50))}
            placeholder="Enter task board name"
            placeholderTextColor="#666"
          />
        </View>
        <View className="mb-4 flex flex-col gap-2">
          <Text className="text-text">Description: </Text>
          <TextInput
            className="rounded-lg bg-secondary-850 p-2 text-text"
            value={description}
            onChangeText={(newDescription) => setDescription(newDescription.slice(0, 200))}
            placeholder="Enter description (optional)"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="z-50 flex flex-col gap-2">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-text">Completion statuses: </Text>
            <Pressable onPress={resetToDefaults} className="rounded-lg bg-secondary/50 px-3 py-1">
              <Text className="text-sm text-text">Reset to defaults </Text>
            </Pressable>
          </View>

          <View className="flex flex-row gap-2">
            <TextInput
              className="grow rounded-lg bg-secondary-850 p-2 text-text"
              value={newStatus}
              onChangeText={(status) => setNewStatus(status.slice(0, 25))}
              placeholder="Add new status"
              placeholderTextColor="#666"
            />
            <Pressable className="rounded-lg bg-accent p-2" onPress={handleNewStatus}>
              <Text className="text-background">Add </Text>
            </Pressable>
          </View>

          <View className="z-30 mt-2">
            {Platform.OS === 'web' ? (
              <DraggableList
                itemKey={(item: string) => item}
                list={statusTypes}
                onMoveEnd={(list: string[]) => setStatusTypes(list)}
                template={({ item, dragHandleProps }) => (
                  <ListItem
                    {...{
                      item,
                      dragHandleProps,
                      editing,
                      editingStatus,
                      handleEditingStatusChange,
                      handleEditing,
                      deleteStatus,
                    }}
                  />
                )}
              />
            ) : (
              <DraggableFlatList
                data={statusTypes}
                renderItem={({ item, drag, isActive }) => (
                  <ScaleDecorator activeScale={1.05}>
                    <TouchableOpacity onLongPress={drag} disabled={isActive}>
                      <ListItem
                        {...{
                          item,
                          dragHandleProps: {},
                          editing,
                          editingStatus,
                          handleEditingStatusChange,
                          handleEditing,
                          deleteStatus,
                        }}
                      />
                    </TouchableOpacity>
                  </ScaleDecorator>
                )}
                onDragEnd={({ data }) => setStatusTypes(data)}
                keyExtractor={(item) => item}
              />
            )}
          </View>

          <Text className="mt-1 text-xs text-text/60">
            Drag to reorder. You can have up to 5 status types.{' '}
          </Text>
        </View>

        <TagsInput tags={tags} setTags={setTags} />

        <Pressable onPress={handleSubmit} className="mb-8 rounded-lg bg-primary p-3 text-center">
          <Text className="text-center font-medium text-background">Create Task Board </Text>
        </Pressable>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
