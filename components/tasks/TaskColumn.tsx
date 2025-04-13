import { useCallback, useEffect } from 'react';
import { Text, View } from 'react-native';
import 'react-native-get-random-values';
import { Task, useTaskStore } from '../../utils/manageTasks';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  useAnimatedRef,
  AnimatedRef,
} from 'react-native-reanimated';
import DraggableTask from './DraggableTask';

export type ColumnRefs = {
  [key: string]: AnimatedRef<Animated.View>;
};

type TaskColumnProps = {
  status: string;
  tasks: Task[];
  onDragEnd: (task: Task, status: string) => void;
  updateColumnRef: (status: string, ref: AnimatedRef<Animated.View>) => void;
  editTask: (task: Task) => void;
  columnRefs: ColumnRefs;
};

export default function TaskColumn({
  status,
  tasks,
  updateColumnRef,
  columnRefs,
  editTask,
  onDragEnd,
}: TaskColumnProps) {
  const columnRef = useAnimatedRef<Animated.View>();
  const isDragging = useSharedValue(false);

  useEffect(() => {
    updateColumnRef(status, columnRef);
  }, [status, columnRef, updateColumnRef]);

  const onDragUpdate = () => {
    isDragging.value = true;
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
            editTask={editTask}
            columnRefs={columnRefs}
          />
        ))}
      </View>
    </Animated.View>
  );
}
