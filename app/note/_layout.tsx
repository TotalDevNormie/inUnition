import { Slot } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

const screenDimensions = Dimensions.get('screen');
const screenHeight = screenDimensions.height;

export default function NoteLayout() {
  const { top } = useSafeAreaInsets();
  return (
    <View className="bg-background">
      <SafeAreaView>
        <View className="flex flex-col gap-2 bg-background" style={{ marginTop: top, height: screenHeight }}>
          <View className="bg-background-850 flex-1 self-stretch rounded-lg py-4 *:grow" >
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
