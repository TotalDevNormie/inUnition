import { useQuery } from '@tanstack/react-query'
import { View, Text, TextInput } from 'react-native'
import { syncData } from '../../functions/syncData'
import { API_URL, useAuth, RequestError} from '../../components/auth/authContext'

export default function Notes() {

  const {user} = useAuth();

  const {status, error, data} = useQuery({
    queryKey: ['notes'],

    queryFn: async () => {
      const response = await fetch(API_URL + '/notes', {
        method: 'GET',
        headers: {
          Accepts: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await (response.json()) as RequestError;
        throw data ?? {message: response.statusText};
      }

      const data = await response.json();
      return data;
    },
  })

  console.log({status, error, data, user});

  // syncData();

  return (
    <View>
      <Text>Testing input</Text>
      <TextInput placeholder="Testing" />
    </View>
  )
} 