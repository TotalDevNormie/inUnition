import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { Note, useNoteStore } from '../../utils/manageNotes';
import { Link, router } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { Task, useTaskStore } from '../../utils/manageTasks';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import NotesSlider from '~/components/NotesSlider';
import { ScrollView } from 'react-native-gesture-handler';

export default function Home() {
  const { activeNotesArray, notes } = useNoteStore();
  const { activeTasksArray, saveTask } = useTaskStore(); // Add saveTask
  const { getTaskBoard, activeTaskBoards: activeTaskBoardsArray } = useTaskBoardStore();

  const activeNotes = activeNotesArray();
  const activeTasks = activeTasksArray();
  const activeTaskBoards = activeTaskBoardsArray();

  const allTags: string[] = [
    ...activeNotes.flatMap((note) => note.tags || []),
    ...activeTaskBoards.flatMap((board) => board.tags || []),
  ];

  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const sortedUniqueTags: { tag: string; count: number }[] = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
    .map(([tag, count]) => ({ tag, count })); // Create objects with tag and count

  const relevantNotes: Note[] = activeNotes
    .filter((note) => !note?.endsAt || (note?.endsAt && moment(note.endsAt).isAfter()))
    .sort((a, b) => {
      const aEndsAt = a.endsAt ? moment(a.endsAt) : null;
      const bEndsAt = b.endsAt ? moment(b.endsAt) : null;

      const aHasFutureDueDate = aEndsAt && aEndsAt.isAfter();
      const bHasFutureDueDate = bEndsAt && bEndsAt.isAfter();

      if (aHasFutureDueDate && bHasFutureDueDate) {
        return aEndsAt.valueOf() - bEndsAt.valueOf();
      } else if (aHasFutureDueDate) {
        return -1;
      } else if (bHasFutureDueDate) {
        return 1;
      } else {
        return moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf();
      }
    })
    .slice(0, 10);

  const relevantTasks = activeTasks
    .filter((task: Task) => !task?.endsAt || (task?.endsAt && moment(task.endsAt).isAfter()))
    .filter((task: Task) => {
      const board = getTaskBoard(task.taskBoardUUID);
      const statusTypes = board?.statusTypes;
      return !(
        statusTypes &&
        statusTypes.length > 0 &&
        task.completionStatus === statusTypes[statusTypes.length - 1]
      );
    })
    .sort((a, b) => {
      const aEndsAt = a.endsAt ? moment(a.endsAt) : null;
      const bEndsAt = b.endsAt ? moment(b.endsAt) : null;

      const aHasFutureDueDate = aEndsAt && aEndsAt.isAfter();
      const bHasFutureDueDate = bEndsAt && bEndsAt.isAfter();

      if (aHasFutureDueDate && bHasFutureDueDate) {
        return aEndsAt.valueOf() - bEndsAt.valueOf();
      } else if (aHasFutureDueDate) {
        return -1;
      } else if (bHasFutureDueDate) {
        return 1;
      } else {
        return moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf();
      }
    })
    .slice(0, 10);

  return (
    <ScrollView className={`flex flex-1 flex-col rounded-lg gap-10 px-4`}>
      <View className="flex flex-col gap-8 ">
        <Text className="text-3xl text-text">Relevant Notes </Text>
        <View className="flex ">
          <NotesSlider notes={relevantNotes} />
        </View>
      </View>

      <View className="flex flex-row gap-8 pt-8 portrait:flex-col">
        {sortedUniqueTags && (
          <View className="min-w-[30%]">
            <Text className="mb-8 text-3xl text-text">Tag Clusters </Text>
            <FlatList
              data={sortedUniqueTags}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/cluster/${item.tag}`)}
                  className="flex flex-col gap-2 rounded-2xl bg-secondary-850 p-4">
                  <Text className="flex-1 text-xl text-text">{item.tag} Cluster </Text>
                  <Text className="text-secondary-500">
                    {item.count} Entri{item.count > 1 ? 'es' : 'y'}{' '}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
        <View className="flex-1">
          {relevantTasks && <Text className="mb-8 text-3xl text-text">Relevant Tasks </Text>}
          <View className="flex ">
            <View className="overflow-hidden rounded-xl">
              <FlatList
                data={relevantTasks}
                className="rounded-2xl"
                ListEmptyComponent={<Text> </Text>}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: task }) => (
                  <Pressable
                    onPress={() => router.push(`/taskboard/${task.taskBoardUUID}`)}
                    key={task.uuid}
                    className={`bg-secondary-850 ${
                      task?.endsAt ? 'border-2 border-primary' : ''
                    } flex flex-col gap-2 rounded-2xl p-4 `}>
                    <View className="flex flex-row gap-2">
                      <Text className="flex-1 text-xl text-text">
                        {task?.name?.length > 30 ? task.name.slice(0, 27) + '...' : task.name}{' '}
                      </Text>
                      <Text className="color-text">
                        <FontAwesome5 name="tasks" size={24} />{' '}
                      </Text>
                    </View>
                    <Text className="max-h-36 text-text">
                      {task?.description?.length > 100
                        ? task.description.slice(0, 97) + '...'
                        : task.description}{' '}
                    </Text>
                    <Text className="text-primary">{getTaskBoard(task.taskBoardUUID)?.name} </Text>
                    <View className="mt-auto flex flex-row items-center justify-between">
                      {task?.endsAt ? (
                        <Text className="text-primary">Due {moment(task.endsAt).fromNow()} </Text>
                      ) : (
                        <Text className="text-accent">Status: {task.completionStatus} </Text>
                      )}
                      {(() => {
                        const board = getTaskBoard(task.taskBoardUUID);
                        const statusTypes = board?.statusTypes;
                        if (!statusTypes || statusTypes.length === 0) return null;

                        const currentIndex = statusTypes.indexOf(task.completionStatus);
                        const isLastStatus = currentIndex === statusTypes.length - 1;

                        if (!isLastStatus && currentIndex !== -1) {
                          const nextStatus = statusTypes[currentIndex + 1];
                          return (
                            <Pressable
                              onPress={() =>
                                saveTask(task.taskBoardUUID, {
                                  uuid: task.uuid,
                                  completionStatus: nextStatus,
                                })
                              }
                              className="rounded bg-primary px-2 py-1">
                              <Text className="flex flex-1 items-center gap-1 text-background">
                                <MaterialIcons name="navigate-next" size={20} />
                                <Text className="text-background">{nextStatus} </Text>{' '}
                              </Text>
                            </Pressable>
                          );
                        }
                        return null;
                      })()}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
