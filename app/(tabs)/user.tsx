import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../components/auth/AuthContext';

export default function User() {
  const { user, isLoadingUser } = useAuth();

  return (
    <View className="flex flex-col items-center gap-4">
      {!isLoadingUser && user && (
        <Text className="text-3xl text-text">Welcome, {user?.name}!</Text>
      )}
      <Link href="/login" className="p-2 bg-accent rounded-xl">
        <Text className=" text-background ">Log in</Text>
      </Link>
      {isLoadingUser && <Text>Loading...</Text>}
      {!isLoadingUser && user && (
        <Link href="/logout" className="p-2 bg-secondary rounded-xl">
          <Text className="text-text ">Log out</Text>
        </Link>
      )}
    </View>
  );
}
