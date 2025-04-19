import { router } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';

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
        ${active ? 'bg-secondary' : isHovered ? 'bg-secondary/50' : 'bg-transparent'} 
        flex flex-row items-center gap-2 
        ${className}
      `}
      style={{ 
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Text className={`
        ${active ? 'text-primary' : 'text-text'} 
        flex items-center justify-center
        ${collapsed ? 'w-full' : 'w-auto'}
      `}>
        {icon}
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
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {children}
        </Text>
      )}
      
      {collapsed && children && isHovered && (
        <View 
          className="absolute left-full ml-2 bg-secondary-850 rounded-md px-2 py-1 z-50"
          style={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <Text className="text-text whitespace-nowrap">{children}</Text>
        </View>
      )}
    </Pressable>
  );
}
