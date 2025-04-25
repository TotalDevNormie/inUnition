import { AntDesign } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

interface GoogleSignInButtonProps {
  text?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function GoogleSignInButton({
  text = 'Sign in with Google',
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isOnline } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      onError?.(new Error('Internet connection required'));
      return;
    }

    setIsLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error('Google sign in failed:', error);
      onError?.(error instanceof Error ? error : new Error('Google sign in failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      className="flex-row items-center justify-center rounded-lg border border-gray-300 bg-white p-2 shadow-sm"
      style={styles.googleButton}
      onPress={handleGoogleSignIn}
      disabled={isLoading || !isOnline}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <AntDesign name="google" size={20} color="#4285F4" />
          <Text className="ml-2 font-medium text-gray-700">{text} </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    elevation: 1, // For Android shadow
  },
});
