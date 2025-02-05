import { View, Text, TextInput, Pressable } from 'react-native'
import { useAuth } from '../../components/auth/AuthContext';
import { useEffect, useState } from 'react';
import { Link, Redirect } from 'expo-router';

export default Login = () => {
  const { user, isLoadingUser, registerMutation } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const {  error, mutate, isSuccess } = registerMutation;

  const handleRegister = () => {
    mutate({ name, email, password, password_confirmation: passwordConfirm });
  }

  if (isSuccess) return <Redirect href="/" />

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl text-text">Register</Text>
      <TextInput placeholder="Username" className="border-2 border-secondary rounded-lg p-2 text-text" onChangeText={setName} />
      {error?.messages?.name && <Text className='text-red-500'>{error?.messages?.name}</Text>}
      <TextInput placeholder="Email" className="border-2 border-secondary rounded-lg p-2 text-text" onChangeText={setEmail} />
      {error?.messages?.email && <Text className='text-red-500'>{error?.messages?.email}</Text>}

      <TextInput placeholder="Password" secureTextEntry={true} onChangeText={setPassword} className="border-2 border-secondary rounded-lg p-2 text-text" />
      {error?.messages?.password && <Text className='text-red-500'>{error?.messages?.password}</Text>}
      <TextInput placeholder="Repeat Password" secureTextEntry={true} onChangeText={setPasswordConfirm} className="border-2 border-secondary rounded-lg p-2 text-text" />

      <Pressable className="bg-primary p-2 rounded-lg" onPress={handleRegister}>
        <Text className="text-white">Register</Text>
      </Pressable>
      <Link href='./login'><Text className='text-text'>Have an account? Log in</Text></Link>

    </View>
  )
}
