import { Link, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

type NavLinkProps = {
  href: string;
  className?: string;
  children?: React.ReactNode;
  icon: React.ReactNode;
  collapsed?: boolean;
  active?: boolean;
  mobile?: boolean;
};
export default function NavLink({
  href,
  className,
  children,
  icon,
  active,
  collapsed = false,
  mobile = false,
}: NavLinkProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(href)}
      className={`rounded-lg p-2 hover:bg-secondary ${active && !mobile ? 'text-text' : 'text-primary'} ${active && !mobile ? 'bg-secondary' : 'bg-secondary-850'} flex flex-row items-center gap-2 duration-300 ease-in-out ${className} ${collapsed ? 'w-10' : 'w-auto'}`} // Key change here
      style={{ overflow: 'hidden' }} // Important for clipping content
    >
      <Text className={`${active ? 'text-primary' : 'text-text'}`}>{icon}</Text>
      {children && (
        <View
          className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0' : 'w-full'}`} // Animate the width of this View
        >
          <Text className={`text-nowrap ${active ? 'text-primary' : 'text-text'}`}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}
