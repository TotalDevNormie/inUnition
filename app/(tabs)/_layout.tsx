import { ScrollView, Text, View } from 'react-native';
import { TabRouter } from '@react-navigation/native';
import { Navigator, usePathname, Slot, Link } from 'expo-router';
import NavLink from '../../components/NavLink';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DarkLogo from '../../assets/darkLogo.svg';
import { useAuth } from '../../components/auth/AuthContext';
import SearchButton from '../../components/SearchButton';

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
  const pathname = usePathname();

  return (
    <View className="flex flex-row align-middle p-2 mx-4 rounded-xl justify-evenly bg-secondary-850">
      <NavLink
        href="/"
        className={`flex flex-col justify-center bg-secondary rounded-xl`}
        icon={<Ionicons name="home" size={32} />}
        active={pathname === '/'}
        mobile
      ></NavLink>
      <NavLink
        href="/notes"
        className={`flex flex-col justify-center rounded-xl`}
        icon={<Ionicons name="document-text" size={32} />}
        active={pathname === '/notes'}
        mobile
      ></NavLink>
      <NavLink
        href="/tasks"
        className={`flex flex-col justify-center rounded-xl`}
        icon={<MaterialIcons name="task-alt" size={32} />}
        active={pathname === '/tasks'}
        mobile
      ></NavLink>
    </View>
  );
};

const Header = () => {
  return (
    <View className="flex flex-row justify-between px-4 rounded-xl">
      <View>
        <DarkLogo />
      </View>
      <SearchButton />
    </View>
  );
};
