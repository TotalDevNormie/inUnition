import { Feather, Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { TabRouter } from '@react-navigation/native';
import { Navigator, usePathname, Slot, Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DarkLogo from '../../assets/darkLogo.svg';
import NavLink from '../../components/NavLink';
import SearchButton from '../../components/SearchButton';

import { useAuthStore } from '~/utils/useAuthStore';

export default function TabsLayout() {
  return (
    <Navigator router={TabRouter}>
      <View className="bg-background">
        <SafeAreaView>
          <View className="flex h-screen flex-col gap-2 bg-background py-4">
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
  const pathname = usePathname();
  const { isLoading, user } = useAuthStore();

  return (
    <View className="mx-4 flex flex-row justify-evenly rounded-xl bg-secondary-850 p-2 align-middle">
      <NavLink href="/" icon={<Ionicons name="home" size={24} />} active={pathname === '/'} mobile>
        Home
      </NavLink>
      <NavLink
        href="/notes"
        icon={<Ionicons name="document-text" size={24} />}
        active={pathname === '/notes'}
        mobile>
        Notes
      </NavLink>
      <NavLink
        href="/tasks"
        icon={<Octicons name="tasklist" size={24} />}
        active={pathname === '/tasks'}
        mobile>
        Tasks
      </NavLink>
      {user ? (
        <NavLink
          href="/user"
          icon={<Feather name="user" size={24} />}
          active={pathname === '/user'}
          mobile>
          Profile
        </NavLink>
      ) : (
        <NavLink
          href="/login"
          icon={<Ionicons name="log-in-outline" size={24} />}
          active={pathname === '/login'}
          mobile>
          Login
        </NavLink>
      )}
    </View>
  );
};

const Header = () => {
  return (
    <View className="flex flex-row items-center justify-between rounded-xl px-4">
      <View>
        <DarkLogo />
      </View>
      <SearchButton />
    </View>
  );
};
