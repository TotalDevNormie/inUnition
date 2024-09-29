import { ScrollView, Text, View } from "react-native";
import { TabRouter } from "@react-navigation/native";
import { Navigator, usePathname, Slot, Link } from "expo-router";
import NavLink from "../../components/NavLink";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import DarkLogoFull from "../../assets/darkLogoFull.svg";
import { useAuth } from "../../components/auth/authContext";
import { useSafeAreaEnv } from "nativewind";



export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    return (
        <SafeAreaView>
            <Navigator router={TabRouter}>
                <View className="bg-background p-2 min-h-full flex gap-2">
                    <Header />
                    <View className="grow rounded-lg p-2 bg-background-100" style={[ useSafeAreaEnv()]}>
                        <Slot />
                    </View>
                    <Bar />
                </View>
            </Navigator>
        </SafeAreaView>
    );
}

const Bar = () => {
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

const Header = () => {
    const {user, isLoadingUser} = useAuth();
    return (
        <View className="flex flex-row p-2 rounded-xl bg-background-100">
            <DarkLogoFull className="text-3xl" />
            {user && <NavLink href="./user" icon={<Feather name="user" size={24} />}>{user?.name}</NavLink>}
            {!isLoadingUser && !user && <Link href="./login" className="color-text flex-1">Log in</Link>}
        </View>
    )
}
