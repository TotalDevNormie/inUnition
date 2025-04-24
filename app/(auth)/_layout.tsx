import { Slot } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthenticateLayout() {
  return (
    <SafeAreaView>
      <View className="flex h-screen items-center justify-center bg-background">
        <View className="w-full md:w-[30rem]">
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}
