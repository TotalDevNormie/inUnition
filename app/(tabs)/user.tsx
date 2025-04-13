import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuthStore } from '../../utils/useAuthStore';

export default function User() {
  const { user, isLoading } = useAuthStore();

  return (
    <View className="flex flex-col items-center gap-4">
      {!isLoading && user && (
        <Text className="text-3xl text-text">
          Welcome, {user?.displayName}!
        </Text>
      )}
      <Link href="/login" className="p-2 bg-accent rounded-xl">
        <Text className=" text-background ">Log in</Text>
      </Link>
      {isLoading && <Text>Loading...</Text>}
      {!isLoading && user && (
        <Link href="/logout" className="p-2 bg-secondary rounded-xl">
          <Text className="text-text ">Log out</Text>
        </Link>
      )}
    </View>
  );
}
