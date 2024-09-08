import { Link } from 'expo-router'
import { View, Text } from 'react-native'

export default function NavLink({ href, className, children, icon }) {
  return (
    <Link href={href}>
      <View className={`p-2 rounded-lg color-text flex flex-row gap-2 items-center ${className}`}>
        <Text className="color-text">{icon}</Text>
        <Text className="color-text">{children}</Text>
      </View>
    </Link>
  )
}