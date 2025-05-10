import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import moment from 'moment';
import { Dimensions, Platform, Pressable, View, Text, useWindowDimensions } from 'react-native';
import MasonryList from 'reanimated-masonry-list';

import { useTaskBoardStore, TaskBoard } from '../../utils/manageTaskBoards';

export default function tasks() {
  const { width } = useWindowDimensions();
  const maxColumnWidth = width > 500 ? 300 : 200;
  const columnCount = Math.max(1, Math.floor(width / maxColumnWidth));

  const { activeTaskBoards } = useTaskBoardStore();

  const NewButton = () => (
    <Pressable onPress={() => router.push('/taskboard/new')}>
      <View className="rounded-xl bg-primary pb-5 pl-5 pr-5  pt-4 text-background">
        <MaterialIcons name="add-task" size={24} />
      </View>
    </Pressable>
  );

  return (
    <View className="mb-2 flex flex-1 flex-col overflow-hidden rounded-xl px-4">
      <View className="mb-4 flex flex-row items-center justify-between gap-4">
        <Text className="text-3xl text-text">Task Boards </Text>
        {Platform.OS == 'web' && <NewButton />}
      </View>
      <View className="borer-2 flex-1 overflow-hidden rounded-xl border-primary">
        <MasonryList
          data={activeTaskBoards()}
          renderItem={({ item }) => <TaskGroupCard taskGroup={item as TaskBoard} />}
          numColumns={columnCount}
          ListEmptyComponent={<Text className="py-10 text-center text-text">No task boards </Text>}
          keyExtractor={({ item }: { item: TaskBoard }): string => item?.uuid}
          style={{ gap: 16 }}
        />
      </View>
      {Platform.OS !== 'web' && (
        <View className="absolute bottom-0 right-4">
          <NewButton />
        </View>
      )}
    </View>
  );
}

const TaskGroupCard = ({ taskGroup }: { taskGroup: TaskBoard }) => {
  return (
    <Pressable onPress={() => router.push(`/taskboard/${taskGroup.uuid}`)} key={taskGroup.uuid}>
      <View className="mt-4 flex flex-col gap-4 rounded-2xl bg-secondary-850 p-4">
        {taskGroup?.name && <Text className="text-xl text-text">{taskGroup?.name} </Text>}
        {taskGroup?.description && <Text className="text-text ">{taskGroup.description} </Text>}
        <View>
          <Text className="text-text">{moment(taskGroup?.createdAt).format('DD.MM.YYYY')} </Text>
          <Text className="text-accent">Last edited {moment(taskGroup.updatedAt).fromNow()} </Text>
          {taskGroup?.endsAt && (
            <Text className="text-primary">Due {moment(taskGroup.endsAt).fromNow()} </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
