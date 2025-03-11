// components/SearchResults.tsx
import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSearch } from '../utils/SearchContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import moment from 'moment';
import MasonryList from 'reanimated-masonry-list';

export default function SearchResults() {
  const { results, isSearching, query } = useSearch();

  if (isSearching) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-text">Searching...</Text>
      </View>
    );
  }

  if (!query.trim() && results.length === 0) {
    return null;
  }

  if (results.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-text text-lg mb-2">No results found</Text>
        <Text className="text-text-secondary">
          Try changing your search or filters
        </Text>
      </View>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'note':
        return 'sticky-note';
      case 'task':
        return 'tasks';
      case 'board':
        return 'clipboard-list';
    }
  };

  const renderItem = ({ item }) => {
    const { type, item: data, matches } = item;

    return (
      <Pressable
        onPress={() =>
          router.push(
            `${type === 'note' ? '/note' : '/taskboard'}/${type === 'task' ? data.taskBoardUUID : data.uuid}`,
          )
        }
        className="bg-secondary-850 p-4 rounded-xl mb-4 ml-4"
      >
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-3">
            <FontAwesome5 name={getIcon(type)} size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-text text-lg font-semibold">
              {data.title || data.name || 'Untitled'}
            </Text>
            <Text className="text-text/50 text-sm">
              {type.charAt(0).toUpperCase() + type.slice(1)} • Updated{' '}
              {moment(data.updatedAt).fromNow()}
            </Text>
          </View>
        </View>

        {matches.map((match, idx) => (
          <View key={idx} className="mb-2">
            <Text className="text-accent text-xs mb-1">
              {match.field.charAt(0).toUpperCase() + match.field.slice(1)}
            </Text>
            <Text className="text-text" numberOfLines={3}>
              {match.text}
            </Text>
          </View>
        ))}

        {data.tags && data.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2">
            {data.tags.map((tag, idx) => (
              <View
                key={idx}
                className="bg-secondary-800 rounded-full px-2 py-1 mr-2 mb-1"
              >
                <Text className="text-secondary text-xs">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {data.endsAt && (
          <View className="flex-row items-center mt-2">
            <FontAwesome5
              name="calendar-alt"
              size={12}
              color="#888"
              className="mr-1"
            />
            <Text className="text-primary text-xs">
              Due {moment(data.endsAt).fromNow()}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <MasonryList
      data={results}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.type}-${item.item.uuid}`}
      contentContainerStyle={{ padding: 8 }}
      ListHeaderComponent={
        <Text className="text-text text-lg mb-4">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </Text>
      }
    />
  );
}
