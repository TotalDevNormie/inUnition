import { useState } from "react";
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { TagsInput } from "../../../components/TagsInput";
import { useMutation } from "@tanstack/react-query";
import { createTaskGroup } from "../../../utils/manageTasks";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function task() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [staus, setStaus] = useState(['Todo', 'Doing', 'Done']);
    const [tags, setTags] = useState<string[]>([]);
    const router = useRouter();

    const { mutate } = useMutation({
        mutationKey: ['tasks'],
        mutationFn: async () => {
            return await createTaskGroup(name, description, staus);
        },
        onSuccess: (uuid) => {
            console.log('Task created successfully', uuid);
            router.push('./' + uuid);
        },
        onError: (error) => {
            console.log('Error creating task:', error);
        }
    });

    const handleNewStatus = () => {
        setStaus([...staus, newStatus]);
        setNewStatus('');
    }

    return (
        <GestureHandlerRootView className="flex-1 p-4">
            <View className="p-4 flex flex-col gap-2">
                <Text className="text-text">Name: </Text>
                <TextInput value={name} onChangeText={setName} />

                <Text className="text-text">description: </Text>
                <TextInput value={description} onChangeText={setDescription} />

                <Text className="text-text">Status types: </Text>
                <TextInput value={newStatus} onChangeText={setNewStatus} />
                <Pressable className="text-text bg-secondary p-2 rounded-lg" onPress={handleNewStatus}><Text>Add status</Text></Pressable>
                <DraggableFlatList
                    data={staus}
                    renderItem={({ item, drag, isActive }) => (
                        <ScaleDecorator>
                            <TouchableOpacity
                                onPress={drag}
                                disabled={isActive}
                                accessibilityRole="button"
                                accessibilityLabel={item}
                                accessibilityHint="Long press to drag"
                            >
                                <Text className="text-text text-center">{item}</Text>
                            </TouchableOpacity>
                        </ScaleDecorator>
                    )}
                    onDragEnd={({ data }) => setStaus(data)}
                    keyExtractor={(item) => item}
                />

                <TagsInput tags={tags} setTags={setTags} />

                <Pressable onPress={() => mutate()} className="text-text bg-primary p-2 rounded-lg"><Text>Submit</Text></Pressable>

            </View>
        </GestureHandlerRootView>
    )
}