import { useState, useEffect, useCallback, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import "react-native-get-random-values";
import { parse } from "uuid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTask,
  deleteTaskGroup,
  getTaskGroup,
  getTasks,
  saveTask,
  Task,
  updateTaskGroup,
} from "../../utils/manageTasks";
import Animated, { AnimatedRef } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import DueDateInput from "../../components/DueDateInput";
import { TagsInput } from "../../components/TagsInput";
import TaskColumn, { ColumnRefs } from "../../components/tasks/TaskColumn";

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
  const newTaskSheet = useRef<BottomSheetModal>(null);
  const settingsSheet = useRef<BottomSheetModal>(null);
  const [openModal, setOpenModal] = useState<"newTask" | "settings" | false>(
    false
  );
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [taskEdit, setTaskEdit] = useState<false | Task>(false);

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
    console.log({ openModal });
    if (openModal === "settings") {
      settingsSheet.current?.present();
    } else if (openModal === "newTask" || taskEdit) {
      newTaskSheet.current?.present();
    } else {
      newTaskSheet?.current?.dismiss();
      settingsSheet?.current?.dismiss();
    }
  }, [openModal, taskEdit]);

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
      return await getTasks(uuid as string, false, false);
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
      console.log("create task", newTaskName, newTaskDescription);
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

  const { mutate: updateTask } = useMutation({
    mutationFn: async ({
      taskId,
      newStatus,
      newName,
      newDescription,
    }: {
      taskId: string;
      newStatus?: string;
      newName?: string;
      newDescription?: string;
    }) => {
      console.log("updateTask", taskId, newStatus, newName, newDescription);
      return await saveTask(
        { status: newStatus, name: newName, description: newDescription },
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
        updateTask({ taskId: task.uuid, newStatus });
      }
    },
    [updateTask]
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

  const handlenewTaskSheetChanges = useCallback(
    (index: number) => {
      if (index == -1) {
        handleTaskEditEnd();
        if (openModal === "newTask") setOpenModal(false);
      }
    },
    [openModal]
  );

  const handleSettingsSheetChanges = useCallback(
    (index: number) => {
      if (index == -1 && openModal === "settings") setOpenModal(false);
    },
    [openModal]
  );

  const handleEditTask = useCallback((task: Task) => {
    console.log("handleEditTask", task);
    setTaskEdit(task);
    setNewTaskName(task.name);
    setNewTaskDescription(task.description);
  }, []);

  const updateEditedTask = useCallback(() => {
    console.log("updateEditedTask", taskEdit);
    if (taskEdit) {
      updateTask({
        taskId: taskEdit.uuid,
        newName: newTaskName,
        newDescription: newTaskDescription,
      });
      handleTaskEditEnd();
    }
  }, [taskEdit, newTaskName, newTaskDescription, updateTask]);

  const handleTaskEditEnd = useCallback(() => {
    console.log("SET TASK EDIT END");
    setTaskEdit(false);
    setNewTaskName("");
    setNewTaskDescription("");
  }, []);

  const { mutate: handleDeleteTask } = useMutation({
    mutationKey: ["tasks"],
    mutationFn: async ({ uuid }: { uuid: string }) => {
      return await deleteTask(uuid as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", uuid] });
    },
  });

  console.log(tasks);

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
                  setOpenModal(openModal !== "newTask" ? "newTask" : false);
                  handleTaskEditEnd();
                }}
              >
                <Text className="text-text">
                  <MaterialIcons name="add-task" size={24} />
                </Text>
              </Pressable>
              <Pressable
                className="p-2"
                onPress={() => {
                  setOpenModal(openModal !== "settings" ? "settings" : false);
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
                onChangeText={(name) => setNewName(name.slice(0, 50))}
                className="border-2 border-secondary rounded-xl text-text text-2xl px-2 grow"
              />
            ) : (
              <Text className="text-2xl text-text grow">{newName}</Text>
            )}
            <Pressable
              onPress={() =>
                handleToggle(isEditName, setIsEditname, setNewName, {
                  name: newName,
                })
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
                  setNewDescription(description.slice(0, 200))
                }
                className="border-2 border-secondary rounded-xl text-text px-2 grow"
              />
            ) : (
              <Text className="text-text grow">{newDescription}</Text>
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
                tasks={
                  tasks ? tasks.filter((task) => task.status === status) : []
                }
                onDragEnd={handleDragEnd}
                updateColumnRef={updateColumnRef}
                editTask={handleEditTask}
                columnRefs={columnRefs}
              />
            ))}
          </View>
          <BottomSheetModal
            ref={newTaskSheet}
            onChange={handlenewTaskSheetChanges}
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
                {taskEdit && (
                  <Pressable
                    onPress={() => handleDeleteTask({ uuid: taskEdit.uuid })}
                    className="bg-red-500 p-2 rounded-xl flex-1"
                  >
                    <Text className="text-text text-center">Delete Task </Text>
                  </Pressable>
                )}
                <Text className="text-text mb-2">Task name:</Text>
                <BottomSheetTextInput
                  value={newTaskName}
                  onChangeText={setNewTaskName}
                  className="border text-text border-gray-300 rounded-xl p-2"
                  onSubmitEditing={() =>
                    taskEdit ? updateEditedTask() : createTask()
                  }
                />
                <Text className="text-text mb-2">Task description:</Text>
                <BottomSheetTextInput
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  className="border text-text border-gray-300 rounded-xl p-2"
                  onSubmitEditing={() =>
                    taskEdit ? updateEditedTask() : createTask()
                  }
                />
                <Pressable
                  className="bg-primary p-2 rounded-xl "
                  onPress={() => (taskEdit ? updateEditedTask() : createTask())}
                >
                  <Text className="text-background text-center">
                    {taskEdit ? "Save" : "Add Task"}
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
                <TagsInput tags={tags} setTags={setTags} inBottomSheet />
                <DueDateInput date={dueDate} setDate={setDueDate} />
              </View>
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
}
