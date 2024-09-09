import { View, Text, TextInput } from 'react-native'

export default Login = () => {
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl">Login</Text>
      <TextInput placeholder="Username" className="border-gray-300 border-2 p-2 rounded-lg" />
      <TextInput placeholder="Password" secureTextEntry={true} className="border-gray-300 border-2 p-2 rounded-lg" />
    </View>
  )
}