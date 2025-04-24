// app/search/index.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import SearchBar from '../../components/SearchBar';
import SearchResults from '../../components/SearchResults';
import { useSearchStore } from '../../utils/useSearchStore';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const setQuery = useSearchStore((state) => state.setQuery);
  const params = useLocalSearchParams<{ q?: string }>();
  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
    }
  }, [params.q]); // Intentionally omit setQuery from deps to avoid re-runs
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="mb-4 text-3xl font-bold text-text">Search </Text>
      <SearchBar />
      <View className="mt-4 flex-1">
        <SearchResults />
      </View>
    </View>
  );
}
