import { useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { TagsInput } from "../../components/TagsInput";
import { useMutation } from "@tanstack/react-query";
import { createTaskGroup } from "../../utils/manageTasks";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableList from "react-draggable-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Task() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [status, setStatus] = useState(["Todo", "Doing", "Done"]);
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();

  const { mutate } = useMutation({
    mutationKey: ["tasks"],
    mutationFn: async () => {
      return await createTaskGroup(name, description, status, tags);
    },
    onSuccess: (uuid) => {
      console.log("Task created successfully", uuid);
      router.replace("./" + uuid);
    },
    onError: (error) => {
      console.log("Error creating task:", error);
    },
  });

  const handleNewStatus = () => {
    setStatus([...new Set([...status, newStatus])]);
    setNewStatus("");
  };

  return (
    <GestureHandlerRootView>
      <View className="px-8 flex flex-col gap-8">
        <View className="flex flex-col gap-2">
          <Text className="text-text">Name: </Text>
          <TextInput
            className="border-2 border-secondary rounded-lg px-2 text-text"
            value={name}
            onChangeText={(newName) => setName(newName.substr(0, 50))}
          />
        </View>
        <View className="flex flex-col gap-2">
          <Text className="text-text">Description: </Text>
          <TextInput
            className="border-2 border-secondary rounded-lg px-2 text-text"
            value={description}
            onChangeText={(newDescription) =>
              setDescription(newDescription.substr(0, 200))
            }
          />
        </View>

        <View className="flex flex-col gap-2">
          <Text className="text-text">Completion status: </Text>
          <View className="flex flex-row gap-2">
            <TextInput
              className="border-2 border-secondary rounded-lg px-2 text-text grow"
              value={newStatus}
              onChangeText={setNewStatus}
            />
            <Pressable
              className="text-text bg-accent p-2 rounded-lg"
              onPress={handleNewStatus}
            >
              <Text>Add status</Text>
            </Pressable>
          </View>
          {Platform.OS === "web" ? (
            <DraggableList
              itemKey={(item) => item}
              list={status}
              onMoveEnd={(list) => setStatus(list)}
              template={({ item, dragHandleProps }) => (
                <View
                  className="flex flex-row gap-2 mb-2 p-2 rounded-xl bg-secondary-850"
                  {...dragHandleProps}
                >
                  <Text className="text-text">
                    <MaterialCommunityIcons name="dots-grid" size={24} />
                  </Text>
                  <Text className="text-text text-center grow">{item}</Text>
                </View>
              )}
            />
          ) : (
            <DraggableFlatList
              data={status}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator activeScale={1.05}>
                  <TouchableOpacity onLongPress={drag} disabled={isActive}>
                    <View className="flex flex-row gap-2 mx-4 mb-2 p-2 rounded-xl bg-secondary-850">
                      <Text className="text-text">
                        <MaterialCommunityIcons name="dots-grid" size={24} />
                      </Text>
                      <Text className="text-text text-center grow">{item}</Text>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
              onDragEnd={({ data }) => setStatus(data)}
              keyExtractor={(item) => item}
            />
          )}
        </View>

        <TagsInput tags={tags} setTags={setTags} />

        <Pressable
          onPress={() => mutate()}
          className="text-text bg-primary p-2 rounded-lg"
        >
          <Text>Submit</Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}
