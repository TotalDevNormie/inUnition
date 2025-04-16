import { useQuery } from '@tanstack/react-query';
import { getTaskGroups, TaskGroup } from '../../utils/manageTasks';
import MasonryList from 'reanimated-masonry-list';
import { Dimensions, Platform, Pressable, View } from 'react-native';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import { TaskBoard } from '../../utils/manageTaskBoards';

type TaskGroupWithUUID = TaskGroup & { uuid: string };

export default function tasks() {
  const windowWidth = Dimensions.get('window').width;
  const maxColumnWidth = 250;
  const possibleColumnCount = Math.floor(windowWidth / maxColumnWidth);
  const columnCount: number = possibleColumnCount < 2 ? 2 : possibleColumnCount;

  const { activeTaskBoards } = useTaskBoardStore();
  console.log(activeTaskBoards());

  const NewButton = () => (
    <Pressable onPress={() => router.push('/taskboard/new')}>
      <View className="rounded-xl bg-primary pb-5 pl-5 pr-5  pt-4 text-background">
        <MaterialIcons name="add-task" size={24} />
      </View>
    </Pressable>
  );

  return (
    <View className="mb-2 flex flex-1 flex-col overflow-hidden rounded-xl">
      <View className="mb-4 flex flex-row items-center justify-between gap-4">
        <Text className="text-3xl text-text">Task Boards</Text>
        {Platform.OS == 'web' && <NewButton />}
      </View>
      <Text className="mb-4 text-3xl text-text"></Text>
      <View className="borer-2 flex-1 overflow-hidden rounded-xl border-primary">
        <MasonryList
          data={activeTaskBoards()}
          renderItem={({ item }) => <TaskGroupCard taskGroup={item as TaskBoard} />}
          numColumns={columnCount}
          ListEmptyComponent={<Text className="py-10 text-center text-text">No task boards</Text>}
          keyExtractor={({ item }: { item: TaskBoard }): string => item?.uuid}
          style={{ gap: 16 }}
        />
      </View>
      {Platform.OS !== 'web' && (
        <View className="absolute bottom-0 right-0">
          <NewButton />
        </View>
      )}
    </View>
  );
}

const TaskGroupCard = ({ taskGroup }: { taskGroup: TaskGroupWithUUID }) => {
  return (
    <Pressable onPress={() => router.push(`/taskboard/${taskGroup.uuid}`)} key={taskGroup.uuid}>
      <View className={`mt-4 flex flex-col gap-4 rounded-2xl bg-secondary-850 p-4`}>
        {taskGroup?.name && <Text className="text-xl text-text">{taskGroup?.name}</Text>}
        {taskGroup?.description && <Text className="text-text ">{taskGroup.description}</Text>}
        <View>
          <Text className="text-text">{moment(taskGroup?.created_at).format('DD.MM.YYYY')}</Text>
          <Text className="text-accent">Last edited {moment(taskGroup.updated_at).fromNow()}</Text>
          {taskGroup?.ends_at && (
            <Text className="text-primary">Due {moment(taskGroup.ends_at).fromNow()}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
