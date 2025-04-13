import { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { TagsInput } from '../../components/TagsInput';
import { useRouter } from 'expo-router';
import {
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler';
import DraggableList from 'react-draggable-list';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';

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
    <View className="flex flex-row gap-2 mb-2 p-2 rounded-xl bg-secondary-850">
      <Text className="text-text" {...dragHandleProps}>
        <MaterialCommunityIcons name="dots-grid" size={24} />
      </Text>
      {editing === item ? (
        <TextInput
          className="text-text text-center grow"
          value={editingStatus}
          autoFocus
          onSubmitEditing={() => handleEditing(item)}
          onChangeText={(text) => handleEditingStatusChange(text)}
        />
      ) : (
        <Text className="text-text text-center grow">{item}</Text>
      )}
      <Pressable onPress={() => handleEditing(item)}>
        <Text className="text-text">
          <AntDesign name={editing === item ? 'check' : 'edit'} size={24} />
        </Text>
      </Pressable>
      <Pressable onPress={() => deleteStatus(item)}>
        <Text className="text-text">
          <AntDesign name="close" size={24} />
        </Text>
      </Pressable>
    </View>
  );
};

export default function Task() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusTypes, setStatusTypes] = useState(['Todo', 'Doing', 'Done']);
  const [editing, setEditing] = useState<string | false>(false);
  const [editingStatus, setEditingStatus] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();

  const { saveTaskBoard } = useTaskBoardStore();

  const handleSubmit = async () => {
    try {
      const uuid = await saveTaskBoard({
        name,
        description,
        statusTypes,
        tags,
      });
      console.log(uuid);
      router.push(`/taskboard/${uuid}`);
    } catch (error) {
      console.error('Failed to create task board:', error);
    }
  };

  const handleNewStatus = () => {
    if (newStatus === '') return;
    setStatusTypes([...new Set([...statusTypes, newStatus])].slice(0, 5));
    setNewStatus('');
  };

  const deleteStatus = (status: string) => {
    if (statusTypes.length === 2) return;
    setStatusTypes(statusTypes.filter((s) => s !== status));
  };

  const handleEditing = (status: string) => {
    if (editing) {
      setStatusTypes(
        statusTypes.map((s: string): string =>
          s === editing && editingStatus ? editingStatus : s,
        ),
      );
      if (editing == status) {
        setEditing(false);
        setEditingStatus('');
        return;
      }
    }
    setEditing(status);
    setEditingStatus(status);
  };

  const handleEditingStatusChange = (text: string) => {
    setEditingStatus(text);
  };

  return (
    <GestureHandlerRootView>
      <ScrollView className="px-8 flex flex-col gap-8 mx-auto max-w-[50rem] w-full">
        <View className="flex flex-col gap-2">
          <Text className="text-text">Name: </Text>
          <TextInput
            className="border-2 border-secondary rounded-lg p-2 text-text"
            value={name}
            onChangeText={(newName) => setName(newName.slice(0, 50))}
          />
        </View>
        <View className="flex flex-col gap-2">
          <Text className="text-text">Description: </Text>
          <TextInput
            className="border-2 border-secondary rounded-lg p-2 text-text"
            value={description}
            onChangeText={(newDescription) =>
              setDescription(newDescription.slice(0, 200))
            }
          />
        </View>

        <View className="flex flex-col gap-2 z-50">
          <Text className="text-text">Completion statuses: </Text>
          <View className="flex flex-row gap-2">
            <TextInput
              className="border-2 border-secondary rounded-lg p-2 text-text grow"
              value={newStatus}
              onChangeText={setNewStatus}
            />
            <Pressable
              className="text-text bg-accent p-2 rounded-lg"
              onPress={handleNewStatus}
            >
              <Text>Add statuses</Text>
            </Pressable>
          </View>
          <View className="z-30">
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
        </View>

        <TagsInput tags={tags} setTags={setTags} />

        <Pressable
          onPress={() => handleSubmit()}
          className=" bg-primary p-2 rounded-lg text-center"
        >
          <Text className="text-background text-center">Create</Text>
        </Pressable>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
