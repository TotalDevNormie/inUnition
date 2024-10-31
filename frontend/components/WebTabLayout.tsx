import { Link, Navigator, Slot } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";
import { useAuth } from "./auth/AuthContext";
import DarkLogoFull from "../assets/darkLogoFull.svg";
import { TabRouter } from "@react-navigation/native";
import NavLink from "./NavLink";
import { Feather, Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";

export default function WebTabLayout() {
	return (
		<Navigator router={TabRouter}>
			<View className="flex p-4 bg-background flex-row gap-4 color-current h-full">
				<Header />
				<View className="flex-1 rounded-lg p-4 grow specific-issue">
					<Slot />
				</View>
			</View>
		</Navigator>
	);
}

const Header = () => {
	const theme = useColorScheme();

	return (
		<View className="flex h-full overflow-scroll align-middle justify-between p-4 rounded-xl bg-secondary-850">
			<View className="flex flex-col gap-2">
				<View className="flex flex-row justify-between">
					<Link href="/">
						<DarkLogoFull width={"100%"} className="text-3xl" />
					</Link>

					{/* <Pressable className="flex justify-end">
						<MaterialIcons
							name="keyboard-arrow-right"
							size={24}
							className="color-text"
						/>
					</Pressable> */}
				</View>
				<Hr />
				<NavLink href="/" icon={<Ionicons name="home" size={24} />}>
					Home
				</NavLink>
				<NavLink
					href="/notes"
					icon={<Ionicons name="document-text" size={24} />}
				>
					Your Notes
				</NavLink>
				<NavLink
					href="/tasks"
					icon={<Octicons name="tasklist" size={24} />}
				>
					Task Manegment
				</NavLink>
				<Hr />
			</View>
			<View>
				<NavLink href="/user" icon={<Feather name="user" size={24} />}>
					Account
				</NavLink>
			</View>
		</View>
	);
};

const Hr = () => {
	return <View className="w-full h-[2px] bg-secondary" />;
};
