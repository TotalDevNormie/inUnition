import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '../../utils/useAuthStore';

export default function Register() {
  const { user, isAuthenticated, isLoading, register, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  if (isAuthenticated && user) {
    return <Redirect href="/" />;
  }

  const handleRegister = async () => {
    setLocalError(null); // Clear local error before attempting to register
    if (!email || !password || !username || !confirmPassword) {
      setLocalError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    await register(email, password, username);
  };

  return (
    <View className="flex flex-col gap-4 p-4">
      <Text className="text-2xl text-text">Register </Text>

      {(localError || error) && <Text className="text-red-500">{localError || error}</Text>}

      <TextInput
        placeholder="Username"
        className="rounded-lg border-2 border-secondary p-2 text-text"
        onChangeText={setUsername}
        onEndEditing={handleRegister}
        value={username}
        autoCapitalize="none"
        editable={!isLoading}
        placeholderTextColor="#fff"
        onFocus={() => {
          clearError();
          setLocalError(null);
        }}
      />

      <TextInput
        placeholder="Email"
        className="rounded-lg border-2 border-secondary p-2 text-text"
        onChangeText={setEmail}
        onEndEditing={handleRegister}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        placeholderTextColor="#fff"
        onFocus={() => {
          clearError();
          setLocalError(null);
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        onEndEditing={handleRegister}
        onChangeText={setPassword}
        value={password}
        className="rounded-lg border-2 border-secondary p-2 text-text"
        editable={!isLoading}
        autoCapitalize="none"
        placeholderTextColor="#fff"
        onFocus={() => {
          clearError();
          setLocalError(null);
        }}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry={true}
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        onEndEditing={handleRegister}
        className="rounded-lg border-2 border-secondary p-2 text-text"
        editable={!isLoading}
        autoCapitalize="none"
        placeholderTextColor="#fff"
        onFocus={() => {
          clearError();
          setLocalError(null);
        }}
      />

      <Pressable
        className={`rounded-lg bg-primary p-2 ${isLoading ? 'opacity-70' : ''}`}
        onPress={handleRegister}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-center text-background">Register </Text>
        )}
      </Pressable>

      <Link href="./login">
        <Text className="text-text">Already have an account? Log in here </Text>
      </Link>
    </View>
  );
}
