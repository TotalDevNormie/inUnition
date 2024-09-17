import { View, Text, TextInput, Pressable } from 'react-native'
import { useAuth } from '../../components/auth/authContext';
import { useState } from 'react';

export default Login = () => {
  const { user, isLoadingUser, registerMutation } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const { data, error, isLoading, mutate } = registerMutation;

  console.log(data);
  const handleRegister = () => {
    mutate({ name, email, password, password_confirmation: passwordConfirm });
  }

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl">Login</Text>
      <Text className="text-red-500">{error?.messages ? error?.message : ''}</Text>
      <TextInput placeholder="Username" className="border-gray-300 border-2 p-2 rounded-lg" onChangeText={setName} />
      <Text>{error?.messages?.name?.shift()}</Text>
      <TextInput placeholder="Email" className="border-gray-300 border-2 p-2 rounded-lg" onChangeText={setEmail} />
      <Text>{error?.messages?.email?.shift()}</Text>

      <TextInput placeholder="Password" secureTextEntry={true} onChangeText={setPassword} className="border-gray-300 border-2 p-2 rounded-lg" />
      <Text>{error?.messages?.password?.shift()}</Text>
      <TextInput placeholder="Repeat Password" secureTextEntry={true} onChangeText={setPasswordConfirm} className="border-gray-300 border-2 p-2 rounded-lg" />

      <Pressable className="bg-primary p-2 rounded-lg" onPress={handleRegister}>
        <Text className="text-white">Log in</Text>
      </Pressable>
    </View>
  )
}
