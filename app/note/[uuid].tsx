import { FontAwesome5 } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Link, router } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useSearchStore, SearchItem, SearchItemType } from '~/utils/useSearchStore';

// Process search results for display
type ProcessedResult = {
  type: SearchItemType;
  item: SearchItem;
  matches: { text: string }[];
};

interface MobileSearchPopupProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function MobileSearchPopup({ visible, setVisible }: MobileSearchPopupProps) {
  // Use the search store
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    search,
    selectedTypes,
    selectedTags,
    dueDateFilter,
  } = useSearchStore();

  const inputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  // Set up snapPoints for the bottom sheet
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setVisible(false);
      }
    },
    [setVisible]
  );

  // Process search results to match the expected format
  const processedResults: ProcessedResult[] = useMemo(() => {
    return searchResults.map((item) => {
      // Create match objects
      const matches = [];

      if (item.content) {
        matches.push({
          text: item.content.substring(0, 150) + (item.content.length > 150 ? '...' : ''),
        });
      } else if (item.description) {
        matches.push({
          text: item.description.substring(0, 150) + (item.description.length > 150 ? '...' : ''),
        });
      } else {
        matches.push({ text: '' });
      }

      return {
        type: item.type,
        item,
        matches,
      };
    });
  }, [searchResults]);

  // Control bottom sheet visibility
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Focus the input after a short delay
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(focusTimer);
    } else {
      bottomSheetRef.current?.close();
      // Clear search term when closing
      setSearchTerm('');
    }
  }, [visible, setSearchTerm]);

  // Perform search when search term changes
  useEffect(() => {
    setIsSearching(true);
    const debounce = setTimeout(() => {
      search();
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, search, selectedTypes, selectedTags, dueDateFilter]);

  // --- Navigation ---
  const navigateToItem = (item: SearchItem) => {
    setVisible(false); // Close bottom sheet first

    if (item.type === 'note') {
      router.push(`/note/${item.uuid}`);
    } else if (item.type === 'task') {
      router.push(`/taskboard/${item.uuid.split('-')[0]}?taskId=${item.uuid}`);
    } else if (item.type === 'taskBoard') {
      router.push(`/taskboard/${item.uuid}`);
    } else {
      console.warn('Could not determine item type for navigation:', item);
    }
  };

  // --- Submit Search (Navigate to Full Search Screen) ---
  const handleSubmitSearch = () => {
    if (searchTerm.trim()) {
      setVisible(false); // Close the bottom sheet
      // Navigate to the main search screen with the current query
      router.push({
        pathname: '/search',
        params: { q: searchTerm },
      });
    }
  };

  // --- Rendering Helpers ---
  const getIcon = (type: SearchItemType): string => {
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
    const title = data.title || data.name || 'Untitled';
    const updatedAt = data.updatedAt || data.createdAt || new Date().toISOString();
    const displayType =
      type === 'taskBoard' ? 'Board' : type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <Pressable onPress={() => navigateToItem(data)} className="border-border border-b px-4 py-3">
        <View className="flex-row items-center">
          {/* Icon */}
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-primary">
            <FontAwesome5 name={getIcon(type)} size={16} color="#fff" />
          </View>
          {/* Text Content */}
          <View className="flex-1">
            <Text className="font-medium text-text text-text" numberOfLines={1}>
              {title}{' '}
            </Text>
            <Text className="mt-0.5 text-xs text-accent" numberOfLines={1}>
              {displayType} • Updated {moment(updatedAt).fromNow()}{' '}
            </Text>
          </View>
        </View>

        {/* Match Text */}
        {matches.length > 0 && matches[0].text && (
          <Text className="ml-12 mt-1.5 text-sm text-text" numberOfLines={2}>
            {matches[0].text}{' '}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      handleStyle={{
        backgroundColor: '#121517',
        borderTopWidth: 2,
        borderTopColor: '#313749',
      }}
      handleIndicatorStyle={{ backgroundColor: '#313749' }}
      backgroundStyle={{ backgroundColor: '#121517' }}>
      <BottomSheetView style={styles.container}>
        <View className="border-border flex-row items-center border-b p-2">
          <View className="bg-background-muted flex-1 flex-row items-center rounded-full px-3">
            <FontAwesome5 name="search" size={16} color="#888" className="mr-2" />
            <TextInput
              ref={inputRef}
              className="flex-1 py-2 text-base text-text"
              placeholder="Search..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSubmitSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {/* Clear Button */}
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')} className="p-1">
                <FontAwesome5 name="times-circle" size={16} color="#888" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Results Area */}
        <View style={{ flex: 1 }}>
          <View className="p-2">
            <Link href="/search" className="text-primary">
              Go To Advanced Search
            </Link>
          </View>

          {isSearching ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" className="text-secondary" />
            </View>
          ) : processedResults.length === 0 ? (
            // Show different message based on whether user has typed
            searchTerm.trim() ? (
              <View className="flex-1 items-center justify-center p-6">
                <Text className="mb-2 text-center text-lg text-text">
                  No results for "{searchTerm}"{' '}
                </Text>
                <Text className="text-center text-text">
                  Try a different search term or tap Search below to see all items.{' '}
                </Text>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center p-6">
                <FontAwesome5 name="search" size={30} color="#555" />
                <Text className="mt-4 text-lg text-text">Search your items </Text>
                <Text className="mt-1 text-center text-text">
                  Find notes, tasks, and boards quickly.{' '}
                </Text>
              </View>
            )
          ) : (
            // Display results
            <FlatList
              data={processedResults}
              renderItem={renderItem}
              keyExtractor={(item) => `${item.type}-${item.item.uuid}`}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View className="px-4 pb-1 pt-3">
                  <Text className="secondary text-xs font-semibold uppercase text-text">
                    Top Results{' '}
                  </Text>
                </View>
              }
              ListFooterComponent={
                processedResults.length > 0 ? (
                  <Pressable
                    onPress={handleSubmitSearch}
                    className="border-border items-center border-t py-4">
                    <Text className="font-medium text-primary">
                      See all results for "{searchTerm}"{' '}
                    </Text>
                  </Pressable>
                ) : null
              }
            />
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

// Keep StyleSheet for non-Tailwind styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
