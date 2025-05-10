import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MasonryList from 'reanimated-masonry-list';

import { useSearchStore, SearchItem, SearchItemType } from '../utils/useSearchStore';

type ProcessedResult = {
  type: SearchItemType;
  item: SearchItem;
  matches: { field: string; text: string }[];
};

export default function SearchResults() {
  const { searchTerm, searchResults } = useSearchStore();

  // Process search results to match the expected format
  const processedResults: ProcessedResult[] = React.useMemo(() => {
    return searchResults.map((item) => {
      // Create match objects
      const matches = [];

      if (item.content) {
        matches.push({
          field: 'content',
          text: item.content.substring(0, 150) + (item.content.length > 150 ? '...' : ''),
        });
      } else if (item.description) {
        matches.push({
          field: 'description',
          text: item.description.substring(0, 150) + (item.description.length > 150 ? '...' : ''),
        });
      }

      return {
        type: item.type,
        item,
        matches,
      };
    });
  }, [searchResults]);

  if (!searchTerm.trim() && processedResults.length === 0) return null;

  if (processedResults.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="mb-2 text-lg text-text">No results </Text>
        <Text className="text-text-secondary">Try changing your search or filters </Text>
      </View>
    );
  }

  const getIcon = (type: SearchItemType) => {
    switch (type) {
      case 'note':
        return 'sticky-note';
      case 'task':
        return 'tasks';
      case 'taskBoard':
        return 'clipboard-list';
      default:
        return 'file';
    }
  };

  const renderItem = ({ item }: { item: ProcessedResult }) => {
    const { type, item: data, matches } = item;
    return (
      <Pressable
        onPress={() => {
          if (type === 'note') {
            router.push(`/note/${data.uuid}`);
          } else if (type === 'task') {
            router.push(`/taskboard/${data.uuid.split('-')[0]}?taskId=${data.uuid}`);
          } else if (type === 'taskBoard') {
            router.push(`/taskboard/${data.uuid}`);
          }
        }}
        className="mb-4 rounded-xl bg-secondary-850 p-4">
        <View className="mb-2 flex-row items-center">
          <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary">
            <FontAwesome5 name={getIcon(type)} size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-text">
              {data.title || data.name || 'Untitled'}{' '}
            </Text>
            <Text className="text-sm text-text/50">
              {type === 'taskBoard' ? 'Board' : type.charAt(0).toUpperCase() + type.slice(1)} •
              Updated {moment(data.updatedAt).fromNow()}{' '}
            </Text>
          </View>
        </View>

        {matches.map((m, i) => (
          <View key={i} className="mb-2">
            <Text className="mb-1 text-xs text-accent">
              {m.field.charAt(0).toUpperCase() + m.field.slice(1)}{' '}
            </Text>
            <Text className="text-text" numberOfLines={3}>
              {m.text}{' '}
            </Text>
          </View>
        ))}

        {data?.tags && (
          <View className="mt-2 flex-row flex-wrap">
            <Text className="text-xs text-text/70">{data.tags.join(', ')} </Text>
          </View>
        )}

        {data.endsAt && (
          <View className="mt-2 flex-row items-center">
            <FontAwesome5
              name="calendar-alt"
              color="#2CC3A5"
              size={12}
              className="mr-1 text-secondary"
            />
            <Text className="text-xs text-primary">Due {moment(data.endsAt).fromNow()} </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <MasonryList
      data={processedResults}
      renderItem={renderItem}
      keyExtractor={(i) => `${i.type}-${i.item.uuid}`}
      style={{ gap: 16 }}
      ListHeaderComponent={
        <Text className="mb-8 text-lg text-text">
          {processedResults.length} {processedResults.length === 1 ? 'result' : 'results'}{' '}
          found{' '}
        </Text>
      }
    />
  );
}
