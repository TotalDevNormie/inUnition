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
  const { user, isAuthenticated, isLoading, login, error, clearError } =
    useAuthStore(); // Use the auth store
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  console.log(error, isLoading);

  // If already logged in, redirect to home
  if (isAuthenticated && user) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      // setError(new Error('Email and password are required')); // Use store's error
      return;
    }
    await login(email, password); // Call the login action from the store

    clearError(); // Clear any previous errors
  };

  if (isAuthenticated) return <Redirect href="/" />;

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
        editable={!isLoading}
        onFocus={clearError}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
        className="border-2 border-secondary rounded-lg p-2 text-text"
        editable={!isLoading}
        onFocus={clearError}
      />

      <Pressable
        className={`bg-primary p-2 rounded-lg ${isLoading ? 'opacity-70' : ''}`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
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
