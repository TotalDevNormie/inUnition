import { Slot } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoteLayout() {
  return (
    <View className="bg-background">
      <SafeAreaView>
        <View className="bg-background flex-col h-screen flex gap-2">
          <View className="flex-1 self-stretch rounded-lg py-4 bg-background-850 *:grow *-bg-sky-100">
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
