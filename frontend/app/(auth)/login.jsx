import { View, Text, TextInput, Pressable } from 'react-native'
import { useAuth } from '../../components/auth/AuthContext';
import { useEffect, useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';

export default Login = () => {
  const { user, isLoadingUser, loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, isLoading, mutate, isSuccess } = loginMutation;
  const router = useRouter();

  const handleLogin = () => {
    mutate({ email, password });
  }

  if (isSuccess) return <Redirect href="/" />
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl text-text">Login</Text>
      <Text className="text-red-500">{error?.message}</Text>
      <TextInput placeholder="Username" className="border-2 border-secondary rounded-lg p-2 text-text" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry={true} onChangeText={setPassword} className="border-2 border-secondary rounded-lg p-2 text-text" />
      <Pressable className="bg-primary p-2 rounded-lg" onPress={handleLogin}>
        <Text className="text-background text-center">Log in</Text>
      </Pressable>
      <Link href='./register'><Text className='text-text'>Don't have an account? Register here</Text></Link>
    </View>
  )
}
