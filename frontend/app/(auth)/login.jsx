import { View, Text, TextInput, Pressable } from 'react-native'
import { useAuth } from '../../components/auth/authContext';
import { useState } from 'react';

export default Login = () => {
  const { user, isLoadingUser, loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { data, error, isLoading, mutate } = loginMutation;


  const handleLogin = () => {
    mutate({ email, password });
  }

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl">Login</Text>
      <Text className="text-red-500">{error?.message}</Text>
      <TextInput placeholder="Username" className="border-gray-300 border-2 p-2 rounded-lg" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry={true} onChangeText={setPassword} className="border-gray-300 border-2 p-2 rounded-lg" />
      <Pressable className="bg-primary p-2 rounded-lg" onPress={handleLogin}>
        <Text className="text-white">Log in</Text>
      </Pressable>
    </View>
  )
}
