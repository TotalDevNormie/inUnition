import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import 'react-native-get-random-values';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedRef,
  measure,
  withTiming,
} from 'react-native-reanimated';

import { ColumnRefs } from './TaskColumn';
import { Task } from '../../utils/manageTasks';

import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';

type DraggableTaskProps = {
  task: Task;
  onDragEnd: (task: Task, newStatus: string) => void;
  onDragUpdate: () => void;
  columnRefs: ColumnRefs;
  editTask: (task: Task) => void;
};

export default function DraggableTask({
  task,
  onDragEnd,
  onDragUpdate,
  columnRefs,
  editTask,
}: DraggableTaskProps) {
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

      if (!isLandscape) {
        const stateArray = Object.keys(columnRefs);
        const stateIndex = stateArray.findIndex((key) => key === task.completionStatus);

        if (translateX.value < -taskMeasurements.width / 3) {
          runOnJS(onDragEnd)(
            task,
            stateArray[(stateIndex - 1 + stateArray.length) % stateArray.length]
          );
        } else if (translateX.value > taskMeasurements.width / 3) {
          runOnJS(onDragEnd)(task, stateArray[(stateIndex + 1) % stateArray.length]);
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
        className="border-2d flex cursor-grab flex-row gap-2 rounded-xl border-gray-600 bg-gray-700 p-4 active:cursor-grabbing"
        style={[animatedStyles]}>
        <View className="flex flex-1 gap-2">
          <Text className="text-lg text-text">{task.name} </Text>
          {task?.description && <Text className="text-text/50">{task?.description} </Text>}
          {task?.tags && <Text className="text-accent">{task?.tags?.join(', ')} </Text>}
          {task?.endsAt && (
            <Text className="text-primary">Due {moment(task?.endsAt).fromNow()} </Text>
          )}
        </View>
        <Pressable onPress={() => editTask(task)}>
          <Text className="text-lg text-text">
            <MaterialIcons name="edit" size={20} />{' '}
          </Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
