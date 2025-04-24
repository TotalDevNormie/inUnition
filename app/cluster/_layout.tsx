import { Slot } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClusterLayout() {
  return (
    <View className="bg-background">
      <SafeAreaView>
        <View className="flex h-screen flex-col gap-2 bg-background px-4">
          <View className="bg-background-850 *-bg-sky-100 flex-1 self-stretch rounded-lg py-4 *:grow">
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
