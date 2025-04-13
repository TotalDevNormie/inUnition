import { FlatList, Pressable, Text, View } from 'react-native';
import { Note, useNoteStore } from '../../utils/manageNotes';
import { Link, router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import 'react-native-get-random-values';
import { v4 } from 'uuid';
import { Task, useTaskStore } from '../../utils/manageTasks';
import { useTaskBoardStore } from '../../utils/manageTaskBoards';
import NotesSlider from '~/components/NotesSlider';

export default function Home() {
  const { activeNotesArray, notes } = useNoteStore();
  const { activeTasksArray } = useTaskStore();
  const { getTaskBoard } = useTaskBoardStore();

  const relevantNotes: Note[] = activeNotesArray()
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

  const relevantTasks = activeTasksArray()
    .filter((task: Task) => !task?.endsAt || (task?.endsAt && moment(task.endsAt).isAfter()))
    .sort((a, b) => {
      if (a.endsAt && b.endsAt) {
        return moment(a.endsAt).valueOf() - moment(b.endsAt).valueOf();
      }
      return 0;
    })
    .slice(0, 10);

  return (
    <View className="flex flex-1 flex-col gap-10 px-8">
      <View className="flex flex-col gap-8 ">
        <Text className="text-3xl text-text">Relevant Notes</Text>
        <View className="flex ">
          <NotesSlider notes={relevantNotes} />
        </View>
      </View>

      <View className="flex flex-col gap-8">
        {relevantTasks && <Text className="text-3xl text-text">Relevant Tasks</Text>}
        <View className="flex ">
          {relevantTasks.length > 0 ? (
            <View className="overflow-hidden rounded-xl">
              <FlatList
                data={relevantTasks}
                horizontal
                className="rounded-2xl"
                ListEmptyComponent={<Text></Text>}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: task }) => (
                  <Pressable
                    onPress={() => router.push(`/taskboard/${task.taskBoardUUID}`)}
                    key={task.uuid}
                    className={`bg-secondary-850 ${
                      task?.endsAt ? 'border-2 border-primary' : ''
                    } flex w-60 flex-col gap-2 rounded-2xl p-4 `}>
                    <View className="flex flex-row gap-2">
                      <Text className="flex-1 text-xl text-text">
                        {task?.name?.length > 30 ? task.name.slice(0, 27) + '...' : task.name}
                      </Text>
                      <Text className="color-text">
                        <FontAwesome5 name="tasks" size={24} />
                      </Text>
                    </View>
                    <Text className="max-h-36 text-text">
                      {task?.description?.length > 100
                        ? task.description.slice(0, 97) + '...'
                        : task.description}
                    </Text>
                    <Text className="text-primary">{getTaskBoard(task.taskBoardUUID)?.name}</Text>
                    <View className="mt-auto">
                      {task?.endsAt ? (
                        <Text className="text-primary">Due {moment(task.endsAt).fromNow()}</Text>
                      ) : (
                        <Text className="text-accent">Status: {task.completionStatus}</Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          ) : (
            <Text>No tasks</Text>
          )}
        </View>
      </View>
    </View>
  );
}
