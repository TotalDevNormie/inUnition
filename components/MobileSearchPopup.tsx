import { FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';

import { useSearchStore, SearchItem, SearchItemType } from '../utils/useSearchStore';

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
  // Use the new SearchStore
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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isSearching, setIsSearching] = React.useState(false);

  // Process search results to match the expected format
  const processedResults: ProcessedResult[] = React.useMemo(() => {
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

  // Focus input and animate when modal opens/closes
  useEffect(() => {
    if (visible) {
      // Animate slide in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Focus the input after a short delay for animation
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    } else {
      // Animate slide out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Clear the search term *after* the animation completes
        setSearchTerm('');
      });
    }
  }, [visible, slideAnim, setSearchTerm]);

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
    setVisible(false); // Close modal first

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
      setVisible(false); // Close the popup
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
      <Pressable onPress={() => navigateToItem(data)} className="px-4 py-3">
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

  // --- Animation Setup ---
  const { height } = Dimensions.get('window');
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={() => setVisible(false)}>
      <Animated.View
        style={[styles.container, { transform: [{ translateY }] }]}
        className="bg-background">
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-row items-center p-2">
            <Pressable onPress={() => setVisible(false)} className="mr-1 p-2">
              <FontAwesome5 name="arrow-left" size={20} color="#888" />
            </Pressable>
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
            <View className="mx-4">
              <Link href="/search" className="text-primary" onPress={() => setVisible(false)}>
                {' '}
                Go To Advanced Search
              </Link>
            </View>

            {isSearching ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" className="text-secondary" />
              </View>
            ) : processedResults.length === 0 || !searchTerm.trim() ? (
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
              />
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
