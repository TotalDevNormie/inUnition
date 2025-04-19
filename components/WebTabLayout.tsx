import { Link, Navigator, Slot, usePathname } from 'expo-router';
import { Pressable, ScrollView, View, Text, useWindowDimensions } from 'react-native';
import DarkLogoFull from '../assets/darkLogoFull.svg';
import { TabRouter } from '@react-navigation/native';
import NavLink from './NavLink';
import { Feather, Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { useAuthStore } from '../utils/useAuthStore';
import { useSidebarStore } from '../utils/useSidebarStore';
import SearchPopup from './WebSearchPopup';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function WebTabLayout() {
  // Use the Zustand store for collapsed state
  const { isCollapsed, toggleCollapsed, setCollapsed } = useSidebarStore();
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      toggleCollapsed(); // Use the store's toggle function
    }
  };

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Trigger search popup
        document.dispatchEvent(new Event('triggerSearch'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Navigator router={TabRouter}>
      <View className="h-full flex-row overflow-hidden bg-background p-4 color-current">
        {isMobile && !isSidebarOpen && (
          <Pressable
            onPress={toggleSidebar}
            className="absolute left-6 top-6 z-50 rounded-full bg-secondary-850 p-2">
            <Ionicons name="menu" size={24} className="color-text" />
          </Pressable>
        )}

        {(!isMobile || isSidebarOpen) && (
          <Sidebar
            collapsed={isCollapsed} // Use the store's state
            toggleSidebar={toggleSidebar}
            isMobile={isMobile}
          />
        )}

        <ScrollView
          className={`specific-issue flex-1 rounded-lg p-4 ${(!isMobile || !isSidebarOpen) ? "ml-4" : ""}`}
          contentContainerStyle={{ flexGrow: 1 }}>
          <Slot />
        </ScrollView>
      </View>
    </Navigator>
  );
}

const Sidebar = ({
  collapsed,
  toggleSidebar,
  isMobile,
}: {
  collapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}) => {
  const { isLoading, user } = useAuthStore();
  const pathname = usePathname();

  // Function to trigger search shortcut
  const triggerSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <View
      className={`flex h-full justify-between overflow-hidden rounded-xl bg-secondary-850 p-4 align-middle ${
        collapsed ? 'w-[4.5rem]' : isMobile ? 'w-54 absolute left-0 top-0 z-40 h-full' : 'w-[15rem]'
      }`}
      style={{
        boxShadow: isMobile ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
        transition: 'width 0.3s ease-in-out',
      }}>
      <View className="flex flex-col gap-2">
        <View className="flex flex-row items-center justify-between">
          {!collapsed && (
            <View style={{ width: collapsed ? 0 : '80%', overflow: 'hidden' }}>
              <DarkLogoFull width="100%" className="text-3xl" />
            </View>
          )}
          <Pressable
            onPress={toggleSidebar}
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-secondary">
            <MaterialIcons
              name={isMobile ? 'close' : collapsed ? 'keyboard-arrow-right' : 'keyboard-arrow-left'}
              size={24}
              className="color-text"
            />
          </Pressable>
        </View>

        <Hr />

        <Pressable
          onPress={triggerSearch}
          className={`mb-2 flex flex-row items-center ${collapsed ? 'justify-center' : ''} gap-2 rounded-lg bg-secondary p-2 transition-colors hover:bg-secondary/80`}>
          <Ionicons name="search" size={20} className="color-text" />
          {!collapsed && (
            <Text className="flex-1 text-text" numberOfLines={1}>
              Search
            </Text>
          )}
        </Pressable>

        <NavLink
          href="/"
          active={pathname === '/'}
          icon={<Ionicons name="home" size={20} />}
          collapsed={collapsed}>
          Home
        </NavLink>

        <NavLink
          href="/notes"
          active={pathname === '/notes'}
          icon={<Ionicons name="document-text" size={20} />}
          collapsed={collapsed}>
          Your Notes
        </NavLink>

        <NavLink
          href="/tasks"
          active={pathname === '/tasks'}
          icon={<Octicons name="tasklist" size={20} />}
          collapsed={collapsed}>
          Task Management
        </NavLink>

        <Hr />
      </View>

      <View>
        {user && (
          <>
            <NavLink
              href="/user"
              active={pathname === '/user'}
              icon={<Feather name="user" size={20} />}
              collapsed={collapsed}>
              {user?.displayName}
            </NavLink>

            <Pressable
              onPress={() => router.push('/logout')}
              className={`mt-2 flex flex-row items-center ${collapsed ? 'justify-center' : ''} gap-2 rounded-lg bg-red-500/10 p-2 transition-colors hover:bg-red-500/20`}>
              <Ionicons name="log-out-outline" size={20} className="text-red-500" />
              {!collapsed && (
                <Text className="text-red-500" numberOfLines={1}>
                  Log out
                </Text>
              )}
            </Pressable>
          </>
        )}

        {!isLoading && !user && (
          <Pressable
            onPress={() => router.push('/login')}
            className="mt-2 flex flex-row items-center justify-center gap-2 rounded-lg bg-primary/10 p-2 transition-colors hover:bg-primary/20">
            <Ionicons name="log-in-outline" size={20} className="text-primary" />
            {!collapsed && (
              <Text className="text-primary" numberOfLines={1}>
                Log in
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <SearchPopup />
    </View>
  );
};

export const Hr = () => <View className="my-2 h-[2px] w-full bg-secondary" />;
