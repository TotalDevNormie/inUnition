import { Link, Navigator, Slot } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";
import DarkLogoFull from "../assets/darkLogoFull.svg";
import { TabRouter } from "@react-navigation/native";
import NavLink from "./NavLink";
import { Feather, Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons";
import { useState } from "react";

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

  const [collapsed, setCollapsed] = useState(false);

  return (
    <View className="flex align-middle justify-between p-4 rounded-xl bg-secondary-850 duration-300">
      <View className="flex flex-col gap-2 duration-300 ">
        <View className="flex flex-row justify-around duration-300">
          <Pressable
            onPress={() => setCollapsed(!collapsed)}
            className={`text-nowrap overflow-hidden ease duration-300 ${
              collapsed ? "w-0" : "w-40"
            }`}
          >
            <DarkLogoFull width={"100%"} className="text-3xl" />
          </Pressable>

          <Pressable className="flex " onPress={() => setCollapsed(!collapsed)}>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              className={`text-text ease duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </Pressable>
        </View>
        <Hr />
        <NavLink
          className="duration-300"
          href="/"
          icon={<Ionicons name="home" size={24} />}
          collapsed={collapsed}
        >
          Home
        </NavLink>
        <NavLink
          href="/notes"
          className="duration-300"
          icon={<Ionicons name="document-text" size={24} />}
          collapsed={collapsed}
        >
          Your Notes
        </NavLink>
        <NavLink
          href="/tasks"
          className="duration-300"
          icon={<Octicons name="tasklist" size={24} />}
          collapsed={collapsed}
        >
          Task Manegment
        </NavLink>

        <Hr />
      </View>

      {/* <NavLink */}
      {/*   href="/notes" */}
      {/*   className="duration-300" */}
      {/*   icon={<Ionicons name="document-text" size={24} />} */}
      {/*   collapsed={collapsed} */}
      {/* > */}
      {/*   Your Notes */}
      {/* </NavLink> */}
      {/* <NavLink */}
      {/*   href="/tasks" */}
      {/*   className="duration-300" */}
      {/*   icon={<Octicons name="tasklist" size={24} />} */}
      {/*   collapsed={collapsed} */}
      {/* > */}
      {/*   Task Manegment */}
      {/* </NavLink> */}

      <View className="flex flex-col gap-2">
        <NavLink
          href="/user"
          icon={<Feather name="user" size={24} />}
          collapsed={collapsed}
        >
          Account
        </NavLink>
      </View>
    </View>
  );
};

const Hr = () => {
  return <View className="w-full h-[2px] duration-300 bg-secondary" />;
};
