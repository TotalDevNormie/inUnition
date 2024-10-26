import { useQuery } from "@tanstack/react-query";
import { getTaskGroups, TaskGroup } from "../../utils/manageTasks";
import MasonryList from "reanimated-masonry-list";
import { Dimensions, Pressable, View } from "react-native";
import { Text } from "react-native";
import { Link, router } from "expo-router";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import moment from "moment";

type TaskGroupWithUUID = TaskGroup & { uuid: string };

export default function tasks() {
  const windowWidth = Dimensions.get("window").width;
  const maxColumnWidth = 250;
  const possibleColumnCount = Math.floor(windowWidth / maxColumnWidth);
  const columnCount: number = possibleColumnCount < 2 ? 2 : possibleColumnCount;

  const { data: taskGroups } = useQuery({
    queryKey: ["taskGroups"],
    queryFn: async () => {
      const tasks = await getTaskGroups();
      return tasks;
    },
  });

  const taskGroupsArray: TaskGroupWithUUID[] = Object.entries(
    taskGroups || {},
  ).map(([uuid, taskGroup]) => ({ ...taskGroup, uuid }));

  return (
    <View className="flex flex-1 mx-8 mb-2 rounded-xl overflow-hidden ">
      <Text className="text-text text-3xl mb-4">Task Groups </Text>
      <View className="flex-1 rounded-xl overflow-hidden borer-2 border-primary">
        <MasonryList
          data={taskGroupsArray ?? []}
          renderItem={({ item }) => (
            <TaskGroupCard taskGroup={item as TaskGroupWithUUID} />
          )}
          numColumns={columnCount}
          ListEmptyComponent={
            <Text className="text-text text-center py-10">No taskGroups</Text>
          }
          keyExtractor={({ item }: { item: TaskGroupWithUUID }): string =>
            item?.uuid
          }
          className="rounded-xl "
        />
      </View>
      <View className="bottom-0 right-0 absolute">
        <Pressable onPress={() => router.push("/taskgroup/new")}>
          <View className="text-background pl-5 pt-4 pb-5 pr-5  rounded-xl bg-primary">
            <MaterialIcons name="add-task" size={24} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const TaskGroupCard = ({ taskGroup }: { taskGroup: TaskGroupWithUUID }) => {
  return (
    <Pressable
      onPress={() => router.push(`/taskgroup/${taskGroup.uuid}`)}
      key={taskGroup.uuid}
    >
      <View
        className={`bg-secondary-850 p-4 rounded-2xl flex flex-col gap-4 ml-4 mb-4`}
      >
        {taskGroup?.name && (
          <Text className="text-xl text-text">{taskGroup?.name}</Text>
        )}
        {taskGroup?.description && (
          <Text className="text-text ">{taskGroup.description}</Text>
        )}
        <View>
          <Text className="text-text">
            {moment(taskGroup?.created_at).format("DD.MM.YYYY")}
          </Text>
          <Text className="text-accent">
            Last edited {moment(taskGroup.updated_at).fromNow()}
          </Text>
          {taskGroup?.ends_at && (
            <Text className="text-primary">
              Due {moment(taskGroup.ends_at).fromNow()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
