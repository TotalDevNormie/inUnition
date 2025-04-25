import { Link, Redirect, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';

import { useAuthStore } from '../../utils/useAuthStore';

import Modal from '~/components/Modal';

export default function Register() {
  const { user, isAuthenticated, isLoading, register, error, clearError, sendEmailVerification } =
    useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();

  // Modal state for web platform
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

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

  // Show custom alert modal for web
  const showAlert = (title: string, message: string) => {
    setModalTitle(title);
    setModalContent(<Text className="p-4 text-text">{message}</Text>);
    setModalOpen(true);
  };

  // Redirect after successful registration and showing verification message
  useEffect(() => {
    if (registrationSuccess && isAuthenticated && user) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 3000); // Redirect after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, isAuthenticated, user, router]);

  if (isAuthenticated && user && !registrationSuccess) {
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

    try {
      await register(email, password, username);

      // If registration was successful, show verification message
      if (!error) {
        setRegistrationSuccess(true);

        // Show verification message
        if (Platform.OS === 'web') {
          showAlert(
            'Email Verification Required',
            'A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your account.'
          );
        } else {
          Alert.alert(
            'Email Verification Required',
            'A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your account.'
          );
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  // Handle resending verification email
  const handleResendVerification = async () => {
    try {
      await sendEmailVerification();

      if (Platform.OS === 'web') {
        showAlert(
          'Verification Email Sent',
          'A new verification email has been sent to your email address.'
        );
      } else {
        Alert.alert(
          'Verification Email Sent',
          'A new verification email has been sent to your email address.'
        );
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }
  };

  return (
    <View className="flex flex-col gap-4 p-4">
      <Text className="text-2xl text-text">Register</Text>

      {registrationSuccess ? (
        <View className="rounded-lg bg-green-500/10 p-4">
          <Text className="mb-2 text-center text-green-500">
            Registration successful! Please verify your email.
          </Text>
          <Text className="mb-4 text-center text-text">
            A verification email has been sent to {email}. Please check your inbox and follow the
            instructions.
          </Text>
          <Pressable onPress={handleResendVerification} className="mb-2 rounded-lg bg-primary p-2">
            <Text className="text-center text-background">Resend Verification Email</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/')}
            className="rounded-lg border border-primary p-2">
            <Text className="text-center text-primary">Continue to App</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {(localError || error) && <Text className="text-red-500">{localError || error}</Text>}

          <TextInput
            placeholder="Username"
            className="rounded-lg border-2 border-secondary p-2 text-text"
            onChangeText={setUsername}
            value={username}
            onSubmitEditing={handleRegister}
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor="#666"
            onFocus={() => {
              clearError();
              setLocalError(null);
            }}
          />

          <TextInput
            placeholder="Email"
            className="rounded-lg border-2 border-secondary p-2 text-text"
            onChangeText={setEmail}
            value={email}
            onSubmitEditing={handleRegister}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor="#666"
            onFocus={() => {
              clearError();
              setLocalError(null);
            }}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
            value={password}
            className="rounded-lg border-2 border-secondary p-2 text-text"
            editable={!isLoading}
            autoCapitalize="none"
            placeholderTextColor="#666"
            onFocus={() => {
              clearError();
              setLocalError(null);
            }}
          />

          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleRegister}
            value={confirmPassword}
            className="rounded-lg border-2 border-secondary p-2 text-text"
            editable={!isLoading}
            autoCapitalize="none"
            placeholderTextColor="#666"
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
              <Text className="text-center text-background">Register</Text>
            )}
          </Pressable>

          <Link href="./login">
            <Text className="text-text">Already have an account? Log in here</Text>
          </Link>
        </>
      )}

      {/* Custom Alert Modal for web */}
      <Modal open={modalOpen} setOpen={setModalOpen} title={modalTitle}>
        <View>
          {modalContent}
          <Pressable
            onPress={() => setModalOpen(false)}
            className="border-t border-secondary-850 p-4">
            <Text className="text-center font-medium text-primary">OK</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
