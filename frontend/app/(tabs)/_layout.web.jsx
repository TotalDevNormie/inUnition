import { View } from "react-native";
import { TabRouter } from "@react-navigation/native";
import { Navigator, usePathname, Slot, Link } from "expo-router";
import NavLink from "../../components/NavLink";
import { Ionicons } from "@expo/vector-icons";

export default function WebLayout() {
  return (
    <View className="bg-background color-text p-2 min-h-full">
      <Navigator router={TabRouter}>
        <View className="flex flex-row gap-2 color-current h-full">
          <Header />
          <View className="w-full rounded-lg p-2 bg-background-100">
            <Slot />
          </View>
        </View>
      </Navigator>
    </View>
  );
}

function Header() {
  const { navigation, state, descriptors, router } = Navigator.useContext();

  const pathname = usePathname();

  return (
    <View className="flex align-middle p-2 rounded-lg bg-background-100">
      <NavLink href="./" icon={<Ionicons name="home" size={20} />}>Home</NavLink>
      <NavLink href="./notes" icon={<Ionicons name="document-text" size={20}/>}>Your Notes</NavLink>
      <NavLink href="./tasks" icon={<Ionicons name="document-text" size={20}/>}>Task Manegment</NavLink>
    </View>
  );
}