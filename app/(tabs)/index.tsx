import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { getAllNotes, Note, NoteWithUUID } from "../../utils/manageNotes";
import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import moment from "moment";
import "react-native-get-random-values";
import { v4 } from "uuid";
import { getTaskGroups, getTasks } from "../../utils/manageTasks";

type FullTask = {
  uuid: string;
  name: string;
  description: string;
  status: string;
  ends_at: string;
};

export default function Home() {
  const { data: notes } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      return await getAllNotes();
    },
  });
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      return await getTasks();
    },
  });
  const { data: taskGroups } = useQuery({
    queryKey: ["taskGroups"],
    queryFn: async () => {
      return await getTaskGroups();
    },
  });

  const relevantNotes: NoteWithUUID[] = notes
    ? Object.entries(notes)
        .map(([uuid, note]) => ({ ...note, uuid }))
        .filter(
          (note) =>
            !note?.ends_at || (note?.ends_at && moment(note.ends_at).isAfter())
        )
        .sort((a, b) => {
          const aEndsAt = a.ends_at ? moment(a.ends_at) : null;
          const bEndsAt = b.ends_at ? moment(b.ends_at) : null;

          if (aEndsAt && bEndsAt) {
            if (aEndsAt.isAfter() && bEndsAt.isAfter()) {
              return aEndsAt.valueOf() - bEndsAt.valueOf();
            }
          }

          return (
            moment(b.updated_at).valueOf() - moment(a.updated_at).valueOf()
          );
        })
        .slice(0, 10)
    : [];

  const relavantTasks: FullTask[] = tasks ? tasks : [];
  return (
    <View className="flex flex-col gap-10 flex-1 px-8">
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
                      note?.ends_at ? "border-2 border-primary" : ""
                    } p-4 rounded-2xl w-60 flex flex-col gap-2 `}
                  >
                    <View className="flex flex-row gap-2">
                      <Text className="text-xl text-text flex-1">
                        {note?.title?.length > 30
                          ? note?.title?.substr(0, 27) + "..."
                          : note?.title}
                      </Text>
                      <Text className="color-text ">
                        <FontAwesome5 name="edit" size={24} />
                      </Text>
                    </View>
                    <Text className="text-text ">
                      {note?.content?.length > 100
                        ? note?.content?.substr(0, 97) + "..."
                        : note?.content}
                    </Text>
                    <View className="mt-auto">
                      {note?.ends_at ? (
                        <Text className="text-primary">
                          Due {moment(note.ends_at).fromNow()}
                        </Text>
                      ) : (
                        <Text className="text-accent">
                          Last edited {moment(note.updated_at).fromNow()}
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
    </View>
  );
}
