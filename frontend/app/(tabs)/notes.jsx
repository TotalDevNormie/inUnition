import { useQuery } from '@tanstack/react-query'
import { View, Text, TextInput } from 'react-native'

export default function Notes() {

  const {status, error, data} = useQuery({
    queryKey: ['notes'],
    queryFn: () => makeRequest('https://jsonplaceholder.typicode.com/posts'),
  })

  return (
    <View>
      <Text>Testing input</Text>
      <TextInput placeholder="Testing" />
    </View>
  )
} 