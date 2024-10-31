import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	Button,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import "react-native-get-random-values";
import { parse } from "uuid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	deleteTaskGroup,
	getTaskGroup,
	getTasks,
	saveTask,
	Task,
	updateTaskGroup,
} from "../../utils/manageTasks";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	runOnJS,
	useAnimatedRef,
	measure,
	withTiming,
	AnimatedRef,
} from "react-native-reanimated";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
	AntDesign,
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
} from "@expo/vector-icons";
import BottomSheet, {
	BottomSheetModal,
	BottomSheetModalProvider,
	BottomSheetTextInput,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import DueDateInput from "../../components/DueDateInput";
import { TagsInput } from "../../components/TagsInput";

// Define a proper type for column refs
type ColumnRefs = {
	[key: string]: AnimatedRef<Animated.View>;
};

type DraggableTaskProps = {
	task: Task;
	onDragEnd: (task: Task, newStatus: string) => void;
	onDragUpdate: () => void;
	columnRefs: ColumnRefs;
};

const DraggableTask = ({
	task,
	onDragEnd,
	onDragUpdate,
	columnRefs,
}: DraggableTaskProps) => {
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const taskRef = useAnimatedRef();
	const isDragging = useSharedValue(false);
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const isLandscape = screenWidth > screenHeight;

	const gesture = Gesture.Pan()
		.onStart(() => {
			isDragging.value = true;
		})
		.onUpdate((event) => {
			translateX.value = event.translationX;
			if (isLandscape) translateY.value = event.translationY;
			runOnJS(onDragUpdate)();
		})
		.onEnd(() => {
			isDragging.value = false;
			const taskMeasurements = measure(taskRef);
			if (!taskMeasurements) return;

			console.log(columnRefs);

			if (!isLandscape) {
				const stateArray = Object.keys(columnRefs);
				const stateIndex = stateArray.findIndex(
					(key) => key === task.status
				);

				if (translateX.value < -taskMeasurements.width / 3) {
					runOnJS(onDragEnd)(
						task,
						stateArray[
							(stateIndex - 1 + stateArray.length) %
								stateArray.length
						]
					);
				} else if (translateX.value > taskMeasurements.width / 3) {
					runOnJS(onDragEnd)(
						task,
						stateArray[(stateIndex + 1) % stateArray.length]
					);
				}
				translateX.value = withSpring(0);
				return;
			}

			const taskCenterX =
				taskMeasurements.pageX + taskMeasurements.width / 2;
			const taskCenterY =
				taskMeasurements.pageY + taskMeasurements.height / 2;

			Object.entries(columnRefs).forEach(([status, ref]) => {
				const columnMeasurements = measure(ref);
				if (!columnMeasurements) return;

				if (
					taskCenterX >= columnMeasurements.pageX &&
					taskCenterX <=
						columnMeasurements.pageX + columnMeasurements.width &&
					taskCenterY >= columnMeasurements.pageY &&
					taskCenterY <=
						columnMeasurements.pageY + columnMeasurements.height
				) {
					if (status !== task.status) {
						runOnJS(onDragEnd)(task, status);
					}
				}
			});

			translateX.value = withSpring(0);
			translateY.value = withTiming(0);
		});

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [
			{ translateX: translateX.value },
			{ translateY: translateY.value },
			{ scale: withTiming(isDragging.value ? 1.05 : 1) },
		],
		zIndex: translateX.value !== 0 || translateY.value !== 0 ? 100 : 0,
	}));

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				ref={taskRef}
				className="p-4 rounded-xl bg-gray-700 border-2 border-gray-600 cursor-grab active:cursor-grabbing"
				style={[animatedStyles]}
			>
				<Text className="text-text text-lg">{task.name}</Text>
				{task?.description && (
					<Text className="text-text/50">{task?.description}</Text>
				)}
			</Animated.View>
		</GestureDetector>
	);
};

type TaskColumnProps = {
	status: string;
	tasks: Task[];
	onDragEnd: (task: Task, status: string) => void;
	updateColumnRef: (status: string, ref: AnimatedRef<Animated.View>) => void;
	columnRefs: ColumnRefs;
};

const TaskColumn = ({
	status,
	tasks,
	onDragEnd,
	updateColumnRef,
	columnRefs,
}: TaskColumnProps) => {
	const columnRef = useAnimatedRef<Animated.View>();
	const isDragging = useSharedValue(false);

	useEffect(() => {
		updateColumnRef(status, columnRef);
	}, [status, columnRef, updateColumnRef]);

	const onDragUpdate = () => {
		isDragging.value = true;
		console.log("works", isDragging.value);
	};

	const onColumnDragEnd = (task: Task, status: string) => {
		isDragging.value = false;
		runOnJS(onDragEnd)(task, status);
	};

	const animatedStyles = useAnimatedStyle(() => ({
		zIndex: isDragging.value ? 1 : 0,
	}));

	return (
		<Animated.View
			className="flex flex-auto items-stretch portrait:w-full landscape:flex-1 gap-2 flex-col min-w-40"
			style={[animatedStyles]}
			ref={columnRef}
		>
			<Text className="text-lg text-text text-center font-semibold">
				{status}
			</Text>
			<View className="bg-secondary-850 p-2 flex flex-col gap-2 rounded-xl min-h-[3rem]">
				{tasks?.map((task) => (
					<DraggableTask
						key={task?.uuid}
						task={task}
						onDragEnd={onColumnDragEnd}
						onDragUpdate={onDragUpdate}
						columnRefs={columnRefs}
					/>
				))}
			</View>
		</Animated.View>
	);
};

export default function Tasks() {
	const { uuid } = useLocalSearchParams();
	const [isInvalidUUID, setIsInvalidUUID] = useState(false);
	const [newTaskName, setNewTaskName] = useState("");
	const [newTaskDescription, setNewTaskDescription] = useState("");
	const [columnRefs, setColumnRefs] = useState<ColumnRefs>({});
	const queryClient = useQueryClient();
	const [isEditName, setIsEditname] = useState(false);
	const [newName, setNewName] = useState("");
	const [isEditDescription, setIsEditDescription] = useState(false);
	const [newDescription, setNewDescription] = useState("");
	const [isNewTask, setIsNewTask] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const newNoteSheet = useRef<BottomSheetModal>(null);
	const settingsSheet = useRef<BottomSheetModal>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [dueDate, setDueDate] = useState("");
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	const updateColumnRef = useCallback(
		(status: string, ref: AnimatedRef<Animated.View>) => {
			setColumnRefs((prev) => ({
				...prev,
				[status]: ref,
			}));
		},
		[]
	);

	useEffect(() => {
		console.log({ isNewTask });
		if (isNewTask) {
			newNoteSheet.current?.present();
		} else {
			newNoteSheet.current?.dismiss();
		}
	}, [isNewTask]);

	useEffect(() => {
		console.log({ settingsOpen });
		if (settingsOpen) {
			settingsSheet.current?.present();
		} else {
			settingsSheet.current?.dismiss();
		}
	}, [settingsOpen]);

	const { data: taskGroup } = useQuery({
		queryKey: ["tasksGroups"],
		queryFn: async () => {
			const data = await getTaskGroup(uuid as string);
			setNewName(data?.name || "");
			setNewDescription(data?.description || "");
			setTags(data?.tags || []);
			setDueDate(data?.ends_at || "");
			setIsInitialLoad(false);
			return data;
		},
	});

	const { data: tasks } = useQuery({
		queryKey: ["tasks", uuid],
		queryFn: async () => {
			return await getTasks(uuid as string, false, true);
		},
	});

	useEffect(() => {
		try {
			parse(uuid as string);
			setIsInvalidUUID(false);
		} catch (error) {
			setIsInvalidUUID(true);
		}
	}, [uuid]);

	useEffect(() => {
		if (isInitialLoad) {
			return;
		}

		updateTaskGroupDetails({
			name: newName,
			description: newDescription,
			tags,
			ends_at: dueDate,
		});
	}, [newName, newDescription, tags, dueDate]);

	const { mutate: createTask } = useMutation({
		mutationFn: async () => {
			return await saveTask(
				{ name: newTaskName, description: newTaskDescription },
				uuid as string
			);
		},
		onSuccess: () => {
			setNewTaskName("");
			setNewTaskDescription("");
			queryClient.invalidateQueries({ queryKey: ["tasks", uuid] });
		},
	});

	const { mutate: updateTaskStatus } = useMutation({
		mutationFn: async ({ taskId, newStatus }) => {
			return await saveTask(
				{ status: newStatus },
				uuid as string,
				taskId
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", uuid] });
		},
	});

	const { mutate: updateTaskGroupDetails } = useMutation({
		mutationKey: ["taskGroups"],
		mutationFn: async (change) => {
			return await updateTaskGroup(uuid as string, change);
		},
		onSuccess: () => {
			console.log("success");
			queryClient.invalidateQueries({ queryKey: ["taskGroups"] });
		},
	});

	const { mutate: handleDeleteTaskGroup } = useMutation({
		mutationKey: ["taskGroups"],
		mutationFn: async () => {
			return await deleteTaskGroup(uuid as string);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["taskGroups"] });
			router.back();
		},
	});

	const handleDragEnd = useCallback(
		(task: Task, newStatus: string) => {
			if (newStatus !== task.status) {
				updateTaskStatus({ taskId: task.uuid, newStatus });
			}
		},
		[updateTaskStatus]
	);

	const handleToggle = (
		state: boolean,
		setState: (arg0: boolean) => void,
		set: (arg0: string) => void,
		change: { [key: string]: string }
	) => {
		if (Object.keys(change).length === 0 || !taskGroup) return;
		if (state) {
			if (Object.values(change)[0].length === 0)
				set(taskGroup[Object.keys(change)[0]]);
			updateTaskGroupDetails(change);
		} else {
			set(taskGroup[Object.keys(change)[0]] ?? "");
		}
		setState(!state);
	};

	const handleNewNoteSheetChanges = useCallback((index: number) => {
		console.log(
			"handleNewNoteSheetChanges ",
			index,
			isNewTask,
			settingsOpen
		);
		if (index == -1) setIsNewTask(false);
	}, []);

	const handleSettingsSheetChanges = useCallback((index: number) => {
		console.log(
			"handleSettingsSheetChanges ",
			index,
			isNewTask,
			settingsOpen
		);
		if (index == -1) setIsNewTask(false);
	}, []);

	if (isInvalidUUID) return <Redirect href="./new" />;
	if (!taskGroup) return null;

	return (
		<BottomSheetModalProvider>
			<GestureHandlerRootView>
				<View className="flex flex-col gap-8 mx-8 my-4">
					<View className="flex flex-row justify-between ">
						<Pressable onPress={() => router.back()}>
							<Text className="text-text">
								<AntDesign name="arrowleft" size={24} />
							</Text>
						</Pressable>
						<View className="flex flex-row gap-2">
							<Pressable
								className="p-2"
								onPress={() => {
									setIsNewTask(!isNewTask);
									// setSettingsOpen(false);
								}}
							>
								<Text className="text-text">
									<MaterialIcons name="add-task" size={24} />
								</Text>
							</Pressable>
							<Pressable
								className="p-2"
								onPress={() => {
									setSettingsOpen(!settingsOpen);
									// setIsNewTask(false);
								}}
							>
								<Text className="text-text">
									<Ionicons name="settings" size={24} />
								</Text>
							</Pressable>
						</View>
					</View>
					<View className="flex flex-row gap-2 items-center">
						{isEditName ? (
							<TextInput
								value={newName}
								onChangeText={(name) =>
									setNewName(name.substr(0, 50))
								}
								className="border-2 border-secondary rounded-xl text-text text-2xl px-2 grow"
							/>
						) : (
							<Text className="text-2xl text-text grow">
								{newName}
							</Text>
						)}
						<Pressable
							onPress={() =>
								handleToggle(
									isEditName,
									setIsEditname,
									setNewName,
									{
										name: newName,
									}
								)
							}
						>
							<Text className="text-text">
								{isEditName ? (
									<MaterialIcons name="save" size={20} />
								) : (
									<MaterialIcons name="edit" size={20} />
								)}
							</Text>
						</Pressable>
					</View>
					<View className="flex flex-row gap-2 ">
						{isEditDescription ? (
							<TextInput
								value={newDescription}
								onChangeText={(description) =>
									setNewDescription(
										description.substr(0, 200)
									)
								}
								className="border-2 border-secondary rounded-xl text-text px-2 grow"
							/>
						) : (
							<Text className="text-text grow">
								{newDescription}
							</Text>
						)}
						<Pressable
							onPress={() =>
								handleToggle(
									isEditDescription,
									setIsEditDescription,
									setNewDescription,
									{
										description: newDescription,
									}
								)
							}
						>
							<Text className="text-text">
								{isEditDescription ? (
									<MaterialIcons name="save" size={20} />
								) : (
									<MaterialIcons name="edit" size={20} />
								)}
							</Text>
						</Pressable>
					</View>

					<View className="flex portrait:flex-col landscape:flex-row gap-2 flex-wrap">
						{taskGroup?.statusType?.map((status) => (
							<TaskColumn
								key={status}
								status={status}
								tasks={tasks?.filter(
									(task) => task.status === status
								)}
								onDragEnd={handleDragEnd}
								updateColumnRef={updateColumnRef}
								columnRefs={columnRefs}
							/>
						))}
					</View>
					<BottomSheetModal
						ref={newNoteSheet}
						onChange={handleNewNoteSheetChanges}
						enablePanDownToClose
						handleStyle={{
							backgroundColor: "#121517",
							borderTopWidth: 2,
							borderTopColor: "#313749",
						}}
						handleIndicatorStyle={{ backgroundColor: "#313749" }}
						backgroundStyle={{ backgroundColor: "#121517" }}
					>
						<BottomSheetView>
							<View className="flex flex-col p-8 pb-10 gap-4">
								<Text className="text-text mb-2">
									Task name:
								</Text>
								<BottomSheetTextInput
									value={newTaskName}
									onChangeText={setNewTaskName}
									className="border text-text border-gray-300 rounded-xl p-2"
									onSubmitEditing={() => createTask()}
								/>
								<Text className="text-text mb-2">
									Task description:
								</Text>
								<BottomSheetTextInput
									value={newTaskDescription}
									onChangeText={setNewTaskDescription}
									className="border text-text border-gray-300 rounded-xl p-2"
									onSubmitEditing={() => createTask()}
								/>
								<Pressable
									className="bg-primary p-2 rounded-xl "
									onPress={() => createTask()}
								>
									<Text className="text-background text-center">
										Add Task
									</Text>
								</Pressable>
							</View>
						</BottomSheetView>
					</BottomSheetModal>

					<BottomSheetModal
						ref={settingsSheet}
						onChange={handleSettingsSheetChanges}
						index={0}
						enablePanDownToClose
						handleStyle={{
							backgroundColor: "#121517",
							borderTopWidth: 2,
							borderTopColor: "#313749",
						}}
						handleIndicatorStyle={{ backgroundColor: "#313749" }}
						backgroundStyle={{ backgroundColor: "#121517" }}
					>
						<BottomSheetView>
							<View className="flex flex-col p-8 pb-10 gap-4">
								<View className="flex flex-row gap-2">
									<Pressable
										onPress={() => handleDeleteTaskGroup()}
										className="bg-red-500 p-2 rounded-xl flex-1"
									>
										<Text className="text-text text-center">
											Delete Task Group{" "}
										</Text>
									</Pressable>
									<Pressable
										onPress={() => router.push("./new")}
										className="bg-accent p-2 rounded-xl flex-1"
									>
										<Text className="text-background text-center">
											New Task Group
										</Text>
									</Pressable>
								</View>
								<TagsInput
									tags={tags}
									setTags={setTags}
									inBottomSheet
								/>
								<DueDateInput
									date={dueDate}
									setDate={setDueDate}
								/>
							</View>
						</BottomSheetView>
					</BottomSheetModal>
				</View>
			</GestureHandlerRootView>
		</BottomSheetModalProvider>
	);
}
