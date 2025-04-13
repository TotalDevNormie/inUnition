import { Link, Navigator, Slot, usePathname } from 'expo-router';
import { Pressable, ScrollView, useColorScheme, View } from 'react-native';
import DarkLogoFull from '../assets/darkLogoFull.svg';
import { TabRouter } from '@react-navigation/native';
import NavLink from './NavLink';
import { Feather, Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { useAuthStore } from '../utils/useAuthStore';
import SearchPopup from './WebSearchPopup';

export default function WebTabLayout() {
  return (
    <Navigator router={TabRouter}>
      <View className="bg-background flex h-full flex-row gap-4 p-4 color-current">
        <Sidebar />
        <ScrollView className="specific-issue flex-1 grow rounded-lg p-4">
          <Slot />
        </ScrollView>
      </View>
    </Navigator>
  );
}

const Sidebar = () => {
  const { isLoading, user } = useAuthStore();
  const pathname = usePathname();
  

  return (
    <View className="bg-secondary-850 flex h-full justify-between overflow-y-auto rounded-xl p-4 align-middle">
      <View className="flex flex-col gap-2">
        <View className="flex flex-row justify-between">
          <DarkLogoFull width={'100%'} className="text-3xl" />
          <Pressable className="flex justify-end">
            <MaterialIcons name="keyboard-arrow-right" size={24} className="color-text" />
          </Pressable>
        </View>
        <Hr />
        <NavLink href="/" active={pathname === '/'} icon={<Ionicons name="home" size={24} />}>
          Home
        </NavLink>
        <NavLink href="/notes" active={pathname === '/notes'} icon={<Ionicons name="document-text" size={24} />}>
          Your Notes
        </NavLink>
        <NavLink href="/tasks" active={pathname === '/tasks'} icon={<Octicons name="tasklist" size={24} />}>
          Task Manegment
        </NavLink>
        <Hr />
      </View>
      <View>
        {user && (
          <>
            <NavLink href="/user" active={pathname === '/user'} icon={<Feather name="user" size={24} />}>
              {user?.displayName}
            </NavLink>
            <Link href="/logout" className="color-text flex-1">
              Log out{' '}
            </Link>
          </>
        )}
        {!isLoading && !user && (
          <Link href="/login" className="color-text flex-1">
            Log in
          </Link>
        )}
      </View>
        <SearchPopup />
    </View>
  );
};

const Hr = () => <View className="bg- h-[2px] w-full" />;
