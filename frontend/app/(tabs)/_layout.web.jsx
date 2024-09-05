import { View } from "react-native";
import { TabRouter } from "@react-navigation/native";

import { Navigator, usePathname, Slot, Link } from "expo-router";
import NavLink from "../../components/NavLink";
export default function WebLayout() {
  return (
    <View className="bg-background color-text p-2 h-svh">
      <Navigator router={TabRouter}>
        <View className="flex flex-row gap-2 color-current h-full">
          <Header />
          <View>
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
    <View className="flex align-middle p-2 rounded-lg bg-background-lighter">
     <NavLink href="/">Home</NavLink>
     <NavLink href="/test">Test</NavLink>
    </View>
  );
}