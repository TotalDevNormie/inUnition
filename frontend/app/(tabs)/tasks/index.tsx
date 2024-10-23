import { useQuery } from "@tanstack/react-query";
import { getTaskGroups } from "../../../utils/manageTasks";
import { View } from "react-native";
import { Text } from "react-native";
import { Link } from "expo-router";

export default function tasks() {
  const { data: taskGroups } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const tasks = await getTaskGroups();
      return tasks;
    },
  });
  return (
    <View>
      <View>
        <Link href="./new" className="p-2 rounded-lg bg-accent">
          <Text className="color-text">Create Task Group</Text>
        </Link>
      </View>
      <View className="flex flex-col gap-2">
        {taskGroups &&
          Object.keys(taskGroups).map((uuid) => (
            <Link href={`./${uuid}`} push key={uuid}>
              <Text className="text-text">{taskGroups[uuid].name}</Text>
            </Link>
          ))}
      </View>
    </View>
  );
}

