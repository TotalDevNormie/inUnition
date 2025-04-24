import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react'; // Import useEffect
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '../../utils/useAuthStore';

export default function Login() {
  const { user, isAuthenticated, isLoading, login, error, clearError } = useAuthStore(); // Use the auth store
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  if (isAuthenticated && user) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    await login(email, password); // Call the login action from the store
  };

  return (
    <View className="flex flex-col gap-4 p-4">
      <Text className="text-2xl text-text">Login </Text>

      {error && <Text className="text-red-500">{error} </Text>}

      <TextInput
        placeholder="Email"
        className="rounded-lg border-2 border-secondary p-2 text-text"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        onFocus={clearError}
        placeholderTextColor="#fff"
        onEndEditing={handleLogin}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
        className="rounded-lg border-2 border-secondary p-2 text-text"
        placeholderTextColor="#fff"
        autoCapitalize="none"
        editable={!isLoading}
        onFocus={clearError}
        onEndEditing={handleLogin}
      />

      <Pressable
        className={`rounded-lg bg-primary p-2 text-background ${isLoading ? 'opacity-70' : ''}`}
        onPress={handleLogin}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-center text-background">Log in </Text>
        )}
      </Pressable>

      <Link href="./register">
        <Text className="text-text">Don't have an account? Register here </Text>
      </Link>
    </View>
  );
}
