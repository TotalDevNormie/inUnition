import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '../../utils/useAuthStore';

export default function Login() {
  const {
    user,
    isAuthenticated,
    isLoading: authIsLoading,
    login,
    error,
    clearError,
  } = useAuthStore(); // Use the auth store
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<Error | null>(null); // No longer needed, using store's error
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to home
  if (isAuthenticated && user) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      // setError(new Error('Email and password are required')); // Use store's error
      return;
    }

    setIsLoading(true);
    clearError(); // Clear any previous errors

    try {
      await login(email, password); // Call the login action from the store
      setIsSuccess(true);
      router.replace('/');
    } catch (err) {
      // setError(err instanceof Error ? err : new Error('Login failed')); // Store handles errors
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) return <Redirect href="/" />;

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl text-text">Login</Text>

      {error && <Text className="text-red-500">{error}</Text>}

      <TextInput
        placeholder="Email"
        className="border-2 border-secondary rounded-lg p-2 text-text"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading && !authIsLoading}
        onFocus={clearError}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
        className="border-2 border-secondary rounded-lg p-2 text-text"
        editable={!isLoading && !authIsLoading}
        onFocus={clearError}
      />

      <Pressable
        className={`bg-primary p-2 rounded-lg ${
          isLoading || authIsLoading ? 'opacity-70' : ''
        }`}
        onPress={handleLogin}
        disabled={isLoading || authIsLoading}
      >
        {isLoading || authIsLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-background text-center">Log in</Text>
        )}
      </Pressable>

      <Link href="./register">
        <Text className="text-text">Don't have an account? Register here</Text>
      </Link>
    </View>
  );
}
