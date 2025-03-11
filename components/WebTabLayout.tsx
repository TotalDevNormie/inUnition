import { Link, Navigator, Slot, usePathname } from 'expo-router';
import { Pressable, useColorScheme, View } from 'react-native';
import DarkLogoFull from '../assets/darkLogoFull.svg';
import { TabRouter, useRoute } from '@react-navigation/native';
import NavLink from './NavLink';
import { Feather, Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import SearchButton from '../components/SearchButton';
import { useAuthStore } from '../utils/useAuthStore';

export default function WebTabLayout() {
  return (
    <Navigator router={TabRouter}>
      <ScrollView
        className="flex p-4 bg-background  color-current min-h-full w-full"
        contentContainerStyle={{
          flexGrow: 1,
          flexDirection: 'row',
          gap: 16,
        }}
      >
        <View className="w-full lg:w-fit">
          <Sidebar />
        </View>
        <View className="rounded-lg p-4 grow specific-issue">
          <Slot />
        </View>
      </ScrollView>
    </Navigator>
  );
}
const Sidebar = () => {
  const theme = useColorScheme();
  const { user, isLoading } = useAuthStore();

  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <View className="flex align-middle justify-between p-4 rounded-xl bg-secondary-850 duration-300 sticky top-0 min-h-[calc(100svh-2rem)]">
      <View className="flex flex-col gap-2 duration-300 ">
        <View className="flex flex-row justify-around duration-300">
          <Pressable
            onPress={() => setCollapsed(!collapsed)}
            className={`text-nowrap overflow-hidden ease duration-300 ${
              collapsed ? 'w-0' : 'w-40'
            }`}
          >
            <DarkLogoFull width={'100%'} className="text-3xl" />
          </Pressable>

          <Pressable className="flex " onPress={() => setCollapsed(!collapsed)}>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              className={`text-text ease duration-300 ${
                collapsed ? 'rotate-180' : ''
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
          active={pathname === '/'}
        >
          Home
        </NavLink>
        <NavLink
          href="/notes"
          className="duration-300"
          icon={<Ionicons name="document-text" size={24} />}
          collapsed={collapsed}
          active={pathname === '/notes'}
        >
          Your Notes
        </NavLink>
        <NavLink
          href="/tasks"
          className="duration-300"
          icon={<Octicons name="tasklist" size={24} />}
          collapsed={collapsed}
          active={pathname === '/tasks'}
        >
          Task Management
        </NavLink>
        <SearchButton />

        <Hr />
      </View>

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
