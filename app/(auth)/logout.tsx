import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../utils/useAuthStore';

export default function Logout() {
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function handleLogout() {
      try {
        await logout();
        setIsSuccess(true);
      } catch (err) {
        console.error('Logout failed:', err);
        setError(err instanceof Error ? err : new Error('Logout failed'));
      } finally {
        setIsLoggingOut(false);
      }
    }

    handleLogout();
  }, [logout]);

  if (isSuccess) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 justify-center items-center p-4">
      {isLoggingOut ? (
        <>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-4 text-lg text-text">Logging out...</Text>
        </>
      ) : error ? (
        <View className="items-center">
          <Text className="text-red-500 text-lg">Failed to log out</Text>
          <Text className="text-red-500">{error.message}</Text>
        </View>
      ) : (
        <Text className="text-lg text-text">Redirecting...</Text>
      )}
    </View>
  );
}
