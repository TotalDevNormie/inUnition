import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, TextInput, Pressable } from 'react-native';

export default function SectionSearch({ localQuery, setLocalQuery, placeholder = 'Search...' }) {
  return (
    <View className="mb-4 flex-row">
      <View className="mr-2 flex-1 flex-row items-center rounded-xl bg-secondary-850 p-2">
        <FontAwesome5 name="search" size={18} color="#888" className="mx-2" />
        <TextInput
          className="flex-1 p-2 text-text"
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={localQuery}
          onChangeText={setLocalQuery}
        />
        {localQuery ? (
          <Pressable onPress={() => setLocalQuery('')}>
            <FontAwesome5 name="times" size={16} color="#888" />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() => router.push('/search')}
        className="items-center justify-center rounded-xl bg-secondary-850 p-2">
        <FontAwesome5 name="sliders-h" size={18} color="#888" />
      </Pressable>
    </View>
  );
}
