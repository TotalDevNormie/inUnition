import { Link, router } from "expo-router";
import { useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";

type NavLinkProps = {
  href: string;
  className?: string;
  children?: React.ReactNode;
  icon: React.ReactNode;
  collapsed?: boolean;
};
export default function NavLink({
  href,
  className,
  children,
  icon,
  collapsed = false,
}: NavLinkProps) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      className={`p-2 rounded-lg color-text flex flex-row flex-1 gap-2 items-center ease duration-300 ${className}`}
    >
      <Text className="color-text">{icon}</Text>
      {children && !collapsed && (
        <Text className={`text-nowrap text-text overflow-hidden ${""}`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
