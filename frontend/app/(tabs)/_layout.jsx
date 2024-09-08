import { ScrollView, Text, View } from "react-native";
import { TabRouter } from "@react-navigation/native";
import { Navigator, usePathname, Slot, Link } from "expo-router";
import NavLink from "../../components/NavLink";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabsLayout() {
    return (
        <Navigator router={TabRouter}>
            <View className="bg-background p-2 min-h-full flex gap-2">
                <View className="grow rounded-lg p-2 bg-background-100">
                    <Slot />
                </View>
                <Header />
            </View>
        </Navigator>
    );
}

function Header() {
    const { navigation, state, descriptors, router } = Navigator.useContext();

    const pathname = usePathname();

    return (
        <View className="flex flex-row align-middle p-2 rounded-lg justify-evenly bg-background-100">
            <NavLink href="/" className="flex flex-col justify-center" icon={<Ionicons name="home" size={20} />}>
                <Text className="color-text text-sm">
                    Home
                </Text>
            </NavLink>
            <NavLink href="/notes" className="flex flex-col justify-center" icon={<Ionicons name="document-text" size={20} />}>Notes</NavLink>
            <NavLink href="/tasks" className="flex flex-col justify-center" icon={<Ionicons name="document-text" size={20} />}>Tasks</NavLink>
        </View>
    );
}

