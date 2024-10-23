import { ScrollView, Text, View } from "react-native";
import { TabRouter } from "@react-navigation/native";
import { Navigator, usePathname, Slot, Link } from "expo-router";
import NavLink from "../../components/NavLink";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DarkLogoFull from "../../assets/darkLogoFull.svg";
import { useAuth } from "../../components/auth/AuthContext";

export default function TabsLayout() {
  return (
    <Navigator router={TabRouter}>
      <View className="bg-background">
        <SafeAreaView>
          <View className="bg-background flex-col h-screen py-4 flex gap-2">
            <Header />
            <View className="flex-1 self-stretch rounded-lg">
              <Slot />
            </View>
            <Bar />
          </View>
        </SafeAreaView>
      </View>
    </Navigator>
  );
}

const Bar = () => {
  const { navigation, state, descriptors, router } = Navigator.useContext();

  const pathname = usePathname();

  return (
    <View className="flex flex-row align-middle p-2 mx-4 rounded-xl justify-evenly bg-secondary-850">
      <NavLink
        href="/"
        className="flex flex-col justify-center"
        icon={<Ionicons name="home" size={20} />}
      >
        <Text className="color-text text-sm">Home</Text>
      </NavLink>
      <NavLink
        href="/notes"
        className="flex flex-col justify-center"
        icon={<Ionicons name="document-text" size={20} />}
      >
        Notes
      </NavLink>
      <NavLink
        href="/tasks"
        className="flex flex-col justify-center"
        icon={<Ionicons name="document-text" size={20} />}
      >
        Tasks
      </NavLink>
    </View>
  );
};

const Header = () => {
  const { user, isLoadingUser } = useAuth();
  return (
    <View className="flex flex-row p-2 rounded-xl">
      <DarkLogoFull className="text-3xl" />
      {user && (
        <NavLink href="./user" icon={<Feather name="user" size={24} />}>
          {user?.name}
        </NavLink>
      )}
      {!isLoadingUser && !user && (
        <Link href="./login" className="color-text flex-1">
          Log in
        </Link>
      )}
    </View>
  );
};
