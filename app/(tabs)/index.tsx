import { FlatList, Pressable, Text, View } from 'react-native';
import { Note, useNoteStore } from '../../utils/manageNotes';
import { Link, router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import 'react-native-get-random-values';
import { v4 } from 'uuid';
import { Task, useTaskStore } from '../../utils/manageTasks';

export default function Home() {
  const { activeNotesArray, notes } = useNoteStore();
  const { activeTasksArray } = useTaskStore();

  // Filter and sort relevant notes
  const relevantNotes: Note[] = activeNotesArray()
    .filter(
      (note) =>
        !note?.endsAt || (note?.endsAt && moment(note.endsAt).isAfter()),
    )
    .sort((a, b) => {
      const aEndsAt = a.endsAt ? moment(a.endsAt) : null;
      const bEndsAt = b.endsAt ? moment(b.endsAt) : null;

      if (aEndsAt && bEndsAt) {
        // Sort tasks with a future due date
        if (aEndsAt.isAfter() && bEndsAt.isAfter()) {
          return aEndsAt.valueOf() - bEndsAt.valueOf();
        }
      }

      return moment(b.updatedAt).valueOf() - moment(a.updatedAt).valueOf();
    })
    .slice(0, 10);

  const relevantTasks = activeTasksArray()
    .filter(
      (task: Task) =>
        !task?.endsAt || (task?.endsAt && moment(task.endsAt).isAfter()),
    )
    .sort((a, b) => {
      if (a.endsAt && b.endsAt) {
        return moment(a.endsAt).valueOf() - moment(b.endsAt).valueOf();
      }
      return 0;
    })
    .slice(0, 10);

  return (
    <View className="flex flex-col gap-10 flex-1 px-8">
      {/* Relevant Notes Section */}
      <View className="flex flex-col gap-8 ">
        <Text className="text-3xl text-text">Relevant Notes</Text>
        <View className="flex ">
          {notes ? (
            <View className="rounded-xl overflow-hidden">
              <FlatList
                data={relevantNotes}
                horizontal
                className="rounded-2xl"
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: note }) => (
                  <Pressable
                    onPress={() => router.push(`/note/${note.uuid}`)}
                    key={note.uuid}
                    className={`bg-secondary-850 ${
                      note?.endsAt ? 'border-2 border-primary' : ''
                    } p-4 rounded-2xl w-60 flex flex-col gap-2 `}
                  >
                    <View className="flex flex-row gap-2">
                      <Text className="text-xl text-text flex-1">
                        {note?.title?.length > 30
                          ? note?.title.slice(0, 27) + '...'
                          : note?.title}
                      </Text>
                      <Text className="color-text ">
                        <FontAwesome5 name="edit" size={24} />
                      </Text>
                    </View>
                    <Text className="text-text max-h-36 ">
                      {note?.content?.length > 100
                        ? note?.content.slice(0, 97) + '...'
                        : note?.content}
                    </Text>
                    <View className="mt-auto">
                      {note?.endsAt ? (
                        <Text className="text-primary">
                          Due {moment(note.endsAt).fromNow()}
                        </Text>
                      ) : (
                        <Text className="text-accent">
                          Last edited {moment(note.updatedAt).fromNow()}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          ) : (
            <View>
              <Link
                className="color-background p-2 bg-primary rounded-xl text-center"
                href={`note/${v4()}`}
              >
                No notes, create one
              </Link>
            </View>
          )}
        </View>
      </View>

      {/* Relevant Tasks Section */}
      <View className="flex flex-col gap-8">
        <Text className="text-3xl text-text">Relevant Tasks</Text>
        <View className="flex ">
          {relevantTasks.length > 0 ? (
            <View className="rounded-xl overflow-hidden">
              <FlatList
                data={relevantTasks}
                horizontal
                className="rounded-2xl"
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: task }) => (
                  <Pressable
                    onPress={() => router.push(`/task/${task.uuid}`)}
                    key={task.uuid}
                    className={`bg-secondary-850 ${
                      task?.endsAt ? 'border-2 border-primary' : ''
                    } p-4 rounded-2xl w-60 flex flex-col gap-2 `}
                  >
                    <View className="flex flex-row gap-2">
                      <Text className="text-xl text-text flex-1">
                        {task?.name?.length > 30
                          ? task.name.slice(0, 27) + '...'
                          : task.name}
                      </Text>
                      <Text className="color-text ">
                        <FontAwesome5 name="edit" size={24} />
                      </Text>
                    </View>
                    <Text className="text-text max-h-36 ">
                      {task?.description?.length > 100
                        ? task.description.slice(0, 97) + '...'
                        : task.description}
                    </Text>
                    <View className="mt-auto">
                      {task?.endsAt ? (
                        <Text className="text-primary">
                          Due {moment(task.endsAt).fromNow()}
                        </Text>
                      ) : (
                        <Text className="text-accent">
                          Status: {task.status}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          ) : (
            <View>
              <Link
                className="color-background p-2 bg-primary rounded-xl text-center"
                href={`task/${v4()}`}
              >
                No tasks, create one
              </Link>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
