import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthenticateLayout() {
	return (
		<SafeAreaView>
			<View className="bg-background h-screen flex items-center justify-center">
				<View className="w-full md:w-[30rem]">
					<Slot />
				</View>
			</View>
		</SafeAreaView>
	);
}
