import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import SearchBar from '../../components/SearchBar';
import SearchResults from '../../components/SearchResults';
import { useSearch } from '../../utils/SearchContext';
import { useLocalSearchParams } from 'expo-router';

export default function SearchScreen() {
  const { query, setQuery } = useSearch();
  const params = useLocalSearchParams();

  // Set query from URL params
  useEffect(() => {
    if (params.q) {
      setQuery(params.q as string);
    }
  }, [params.q]);

  return (
    <View className="flex-1 p-4">
      <Text className="text-text text-3xl mb-4">Search</Text>
      <SearchBar />
      <SearchResults />
    </View>
  );
}
