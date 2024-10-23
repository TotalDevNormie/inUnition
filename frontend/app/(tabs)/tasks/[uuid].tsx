import React, { useState, useEffect, useCallback } from "react";
import { Text, TextInput, useWindowDimensions, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import "react-native-get-random-values";
import { parse } from "uuid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  getTaskGroup,
  getTasks,
  saveTask,
  Task,
  updateTask,
} from "../../../utils/manageTasks";
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
        const stateIndex = stateArray.findIndex((key) => key === task.status);

        if (translateX.value < -taskMeasurements.width / 3) {
          runOnJS(onDragEnd)(
            task,
            stateArray[
              (stateIndex - 1 + stateArray.length) % stateArray.length
            ],
          );
        } else if (translateX.value > taskMeasurements.width / 3) {
          runOnJS(onDragEnd)(
            task,
            stateArray[(stateIndex + 1) % stateArray.length],
          );
        }
        translateX.value = withSpring(0);
        return;
      }

      const taskCenterX = taskMeasurements.pageX + taskMeasurements.width / 2;
      const taskCenterY = taskMeasurements.pageY + taskMeasurements.height / 2;

      Object.entries(columnRefs).forEach(([status, ref]) => {
        const columnMeasurements = measure(ref);
        if (!columnMeasurements) return;

        if (
          taskCenterX >= columnMeasurements.pageX &&
          taskCenterX <= columnMeasurements.pageX + columnMeasurements.width &&
          taskCenterY >= columnMeasurements.pageY &&
          taskCenterY <= columnMeasurements.pageY + columnMeasurements.height
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
        className="p-3 rounded-lg mb-2 bg-gray-700 border-2 border-gray-600 cursor-grab active:cursor-grabbing"
        style={[animatedStyles]}
      >
        <Text className="text-text">{task.name}</Text>
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
      <View className="bg-background-200 p-2 rounded-md min-h-[3rem]">
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

  const updateColumnRef = useCallback(
    (status: string, ref: AnimatedRef<Animated.View>) => {
      setColumnRefs((prev) => ({
        ...prev,
        [status]: ref,
      }));
    },
    [],
  );

  const { data: taskGroup } = useQuery({
    queryKey: ["tasksGroups", uuid],
    queryFn: async () => {
      return await getTaskGroup(uuid as string);
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", uuid],
    queryFn: async () => {
      const tasks = await getTasks();
      console.log(tasks);
      return await getTasks(uuid as string);
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

  const { mutate: createTask } = useMutation({
    mutationFn: async () => {
      return await saveTask(
        { name: newTaskName, description: newTaskDescription },
        uuid as string,
      );
    },
    onSuccess: () => {
      setNewTaskName("");
      setNewTaskDescription("");
      queryClient.invalidateQueries({ queryKey: ["tasks", uuid] });
    },
    onError: (e) => {
      console.log(e);
    },
  });

  const { mutate: updateTaskStatus } = useMutation({
    mutationFn: async ({ taskId, newStatus }) => {
      console.log(newStatus);
      return await saveTask({ status: newStatus }, uuid as string, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", uuid] });
    },
  });

  const handleDragEnd = useCallback(
    (task: Task, newStatus: string) => {
      if (newStatus !== task.status) {
        console.log;
        updateTaskStatus({ taskId: task.uuid, newStatus });
      }
    },
    [updateTaskStatus],
  );

  if (isInvalidUUID) return <Redirect href="./" />;
  if (!taskGroup) return null;

  return (
    <GestureHandlerRootView className="flex-1 p-4">
      <View className="mb-4">
        <Text className="text-text mb-2">Task name:</Text>
        <TextInput
          value={newTaskName}
          onChangeText={setNewTaskName}
          className="border border-gray-300 rounded-md p-2"
          onSubmitEditing={() => createTask()}
        />
      </View>

      <Text className="text-xl text-text font-bold mb-4">{taskGroup.name}</Text>

      <View className="flex portrait:flex-col landscape:flex-row gap-2 flex-wrap">
        {taskGroup.statusType.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks?.filter((task) => task.status === status)}
            onDragEnd={handleDragEnd}
            updateColumnRef={updateColumnRef}
            columnRefs={columnRefs}
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
}
