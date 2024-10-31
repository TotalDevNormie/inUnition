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
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Task() {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [newStatus, setNewStatus] = useState("");
	const [statuses, setStatuses] = useState(["Todo", "Doing", "Done"]);
	const [tags, setTags] = useState<string[]>([]);
	const router = useRouter();

	const { mutate } = useMutation({
		mutationKey: ["tasks"],
		mutationFn: async () => {
			return await createTaskGroup(name, description, statuses, tags);
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
		setStatuses([...new Set([...statuses, newStatus])].slice(0, 5));
		setNewStatus("");
	};

	const deleteStatus = (status: string) => {
		if (statuses.length === 2) return;
		setStatuses(statuses.filter((s) => s !== status));
	};

	return (
		<GestureHandlerRootView>
			<View className="px-8 flex flex-col gap-8">
				<View className="flex flex-col gap-2">
					<Text className="text-text">Name: </Text>
					<TextInput
						className="border-2 border-secondary rounded-lg p-2 text-text"
						value={name}
						onChangeText={(newName) =>
							setName(newName.substr(0, 50))
						}
					/>
				</View>
				<View className="flex flex-col gap-2">
					<Text className="text-text">Description: </Text>
					<TextInput
						className="border-2 border-secondary rounded-lg p-2 text-text"
						value={description}
						onChangeText={(newDescription) =>
							setDescription(newDescription.substr(0, 200))
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
						{Platform.OS === "web" ? (
							<DraggableList
								itemKey={(item) => item}
								list={statuses}
								onMoveEnd={(list) => setStatuses(list)}
								template={({ item, dragHandleProps }) => (
									<View
										className="flex flex-row gap-2 mb-2 p-2 rounded-xl bg-secondary-850"
										{...dragHandleProps}
									>
										<Text className="text-text">
											<MaterialCommunityIcons
												name="dots-grid"
												size={24}
											/>
										</Text>
										<Text className="text-text text-center grow">
											{item}
										</Text>
										<Pressable
											onPress={() => deleteStatus(item)}
										>
											<Text className="text-text">
												<AntDesign
													name="close"
													size={24}
												/>
											</Text>
										</Pressable>
									</View>
								)}
							/>
						) : (
							<DraggableFlatList
								data={statuses}
								renderItem={({ item, drag, isActive }) => (
									<ScaleDecorator activeScale={1.05}>
										<TouchableOpacity
											onLongPress={drag}
											disabled={isActive}
										>
											<View className="flex flex-row gap-2 mx-4 mb-2 p-2 rounded-xl bg-secondary-850">
												<Text className="text-text">
													<MaterialCommunityIcons
														name="dots-grid"
														size={24}
													/>
												</Text>
												<Text className="text-text text-center grow">
													{item}
												</Text>
											</View>
										</TouchableOpacity>
									</ScaleDecorator>
								)}
								onDragEnd={({ data }) => setStatuses(data)}
								keyExtractor={(item) => item}
							/>
						)}
					</View>
				</View>

				<TagsInput tags={tags} setTags={setTags} />

				<Pressable
					onPress={() => mutate()}
					className=" bg-primary p-2 rounded-lg text-center"
				>
					<Text className="text-background text-center">Create</Text>
				</Pressable>
			</View>
		</GestureHandlerRootView>
	);
}
