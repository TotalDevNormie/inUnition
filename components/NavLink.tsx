import { router } from 'expo-router';
import { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(href)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className={`
        rounded-lg p-2 
        ${active && !mobile ? 'bg-secondary' : isHovered ? 'bg-secondary/50' : 'bg-transparent'} 
        flex flex-row items-center gap-2 
        ${className}
      `}
      style={{
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
      }}>
      <Text
        className={`
        ${active ? 'text-primary' : 'text-text'} 
        flex items-center justify-center
        ${collapsed ? 'w-full' : 'w-auto'}
      `}>
        {icon}{' '}
      </Text>

      {children && !collapsed && (
        <Text
          className={`
            text-sm font-medium
            ${active ? 'text-primary' : 'text-text'}
            flex-1
          `}
          numberOfLines={1}
          style={{
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}>
          {children}{' '}
        </Text>
      )}

      {collapsed && children && isHovered && (
        <View className="absolute left-full z-50 ml-2 rounded-md bg-secondary-850 px-2 py-1">
          <Text className="whitespace-nowrap text-text">{children} </Text>
        </View>
      )}
    </Pressable>
  );
}
