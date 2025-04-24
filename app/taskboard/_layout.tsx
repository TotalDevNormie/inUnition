import { Slot } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TaskGroupLayout() {
  return (
    <View className="bg-background">
      <SafeAreaView>
        <View className="flex h-screen flex-col gap-2 bg-background">
          <View className="bg-background-850 flex-1 self-stretch rounded-lg py-4 *:grow">
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
