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

export default function Register() {
  const {
    user,
    isAuthenticated,
    isLoading: authIsLoading,
    register,
    error,
    clearError,
  } = useAuthStore(); // Use the auth store
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<any>(null); // No longer needed, using store's error
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to home
  if (isAuthenticated && user) {
    return <Redirect href="/" />;
  }

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !passwordConfirm) {
      // setError({ messages: { general: 'All fields are required' } }); // Use store's error
      return;
    }

    if (password !== passwordConfirm) {
      // setError({ messages: { password: 'Passwords do not match' } }); // Use store's error
      return;
    }

    setIsLoading(true);
    clearError(); // Clear any previous errors

    try {
      await register(email, password, name); // Call the register action from the store
      setIsSuccess(true);
      router.replace('/');
    } catch (err) {
      // Handle Firebase error format or custom error format
      // if (err instanceof Error) {
      //   // Try to parse Firebase error message to match our expected format
      //   if (err.message.includes('email-already-in-use')) {
      //     setError({ messages: { email: 'Email is already in use' } });
      //   } else if (err.message.includes('weak-password')) {
      //     setError({ messages: { password: 'Password is too weak' } });
      //   } else if (err.message.includes('invalid-email')) {
      //     setError({ messages: { email: 'Email is invalid' } });
      //   } else {
      //     setError({ messages: { general: err.message } });
      //   }
      // } else {
      //   setError({ messages: { general: 'Registration failed' } });
      // }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) return <Redirect href="/" />;

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl text-text">Register</Text>

      {error && <Text className="text-red-500">{error}</Text>}

      <TextInput
        placeholder="Username"
        className="border-2 border-secondary rounded-lg p-2 text-text"
        onChangeText={setName}
        value={name}
        autoCapitalize="words"
        editable={!isLoading && !authIsLoading}
        onFocus={clearError}
      />
      {/* {error?.messages?.name && (
        <Text className="text-red-500">{error.messages.name}</Text>
      )} */}

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
      {/* {error?.messages?.email && (
        <Text className="text-red-500">{error.messages.email}</Text>
      )} */}

      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={setPassword}
        value={password}
        className="border-2 border-secondary rounded-lg p-2 text-text"
        editable={!isLoading && !authIsLoading}
        onFocus={clearError}
      />
      {/* {error?.messages?.password && (
        <Text className="text-red-500">{error.messages.password}</Text>
      )} */}

      <TextInput
        placeholder="Repeat Password"
        secureTextEntry={true}
        onChangeText={setPasswordConfirm}
        value={passwordConfirm}
        className="border-2 border-secondary rounded-lg p-2 text-text"
        editable={!isLoading && !authIsLoading}
        onFocus={clearError}
      />

      <Pressable
        className={`bg-primary p-2 rounded-lg ${
          isLoading || authIsLoading ? 'opacity-70' : ''
        }`}
        onPress={handleRegister}
        disabled={isLoading || authIsLoading}
      >
        {isLoading || authIsLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-center">Register</Text>
        )}
      </Pressable>

      <Link href="./login">
        <Text className="text-text">Have an account? Log in</Text>
      </Link>
    </View>
  );
}
