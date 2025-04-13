import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSearch } from '../utils/SearchContext';
import { router } from 'expo-router';
import moment from 'moment';
import { Note } from '../utils/manageNotes';
import { TaskBoard } from '../utils/manageTaskBoards';
import { Task } from '../utils/manageTasks';

export default function SearchPopup() {
  const listenerAddedRef = useRef(false);
  const {
    query,
    setQuery,
    results,
    isSearching,
    filters,
    setFilters,
    sortBy,
    setSortBy,
  } = useSearch();

  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Check for Ctrl+K or Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setVisible(true);
    }

    // Close on Escape
    if (e.key === 'Escape' && visible) {
      setVisible(false);
    }

    // Handle keyboard navigation when popup is visible
    if (visible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev < results.length - 1 ? prev + 1 : 0;
          // Scroll to the selected item
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: newIndex,
              animated: true,
              viewPosition: 0.5,
            });
          }
          return newIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : results.length - 1;
          // Scroll to the selected item
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: newIndex,
              animated: true,
              viewPosition: 0.5,
            });
          }
          return newIndex;
        });
      } else if (
        e.key === 'Enter' &&
        results.length > 0 &&
        selectedIndex >= 0
      ) {
        e.preventDefault();
        const selectedItem = results[selectedIndex];
        navigateToItem(selectedItem.item);
        setVisible(false);
      }
    }
  };

  // Listen for keyboard shortcuts on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Add the event listener only once
    if (!listenerAddedRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      listenerAddedRef.current = true;
    }

    // Cleanup function
    return () => {
      if (listenerAddedRef.current) {
        window.removeEventListener('keydown', handleKeyDown);
        listenerAddedRef.current = false;
      }
    };
  }, [visible, results, selectedIndex]);

  // Focus input when modal opens and reset selected index
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
    }
  }, [visible]);

  const navigateToItem = (item: Note | Task | TaskBoard) => {
    setVisible(false);

    if ((item as Note).content !== undefined) {
      router.push(`/note/${item.uuid}`);
    } else if ((item as Task).taskBoardUUID !== undefined) {
      router.push(`/taskboard/${(item as Task).taskBoardUUID}`);
    } else if ((item as TaskBoard).uuid !== undefined) {
      router.push(`/taskboard/${item.uuid}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'note':
        return 'sticky-note';
      case 'task':
        return 'tasks';
      case 'board':
        return 'clipboard-list';
      default:
        return 'file';
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const { type, item: data, matches } = item;
    const isSelected = index === selectedIndex;

    return (
      <Pressable
        onPress={() => navigateToItem(data)}
        style={[styles.resultItem, isSelected && styles.selectedItem]}
        onHoverIn={() => setSelectedIndex(index)}
      >
        <View className="flex-row items-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
              isSelected ? 'bg-primary-dark' : 'bg-primary'
            }`}
          >
            <FontAwesome5 name={getIcon(type)} size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text
              className={`text-lg font-semibold ${
                isSelected ? 'text-primary' : 'text-text'
              }`}
            >
              {data.title || data.name || 'Untitled'}
            </Text>
            <Text className="text-text/50 text-sm">
              {type.charAt(0).toUpperCase() + type.slice(1)} • Updated{' '}
              {moment(data.updatedAt).fromNow()}
            </Text>
          </View>
        </View>

        {matches.length > 0 && (
          <View className="mt-2 ml-11">
            <Text className="text-text" numberOfLines={2}>
              {matches[0].text}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Handle scroll error
  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 100));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.5,
      });
    });
  };

  if (Platform.OS !== 'web') return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        className="bg-background-950/50 flex-1 items-center justify-center"
        onPress={() => setVisible(false)}
      >
        <View className="w-full items-center">
          <Pressable
            className="max-w-[40rem] w-[90%] bg-background rounded-lg overflow-hidden shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-2 flex-row items-center border-b border-secondary-800">
              <FontAwesome5
                name="search"
                size={18}
                color="#888"
                className="mx-2"
              />
              <TextInput
                ref={inputRef}
                className="flex-1 p-3 text-text"
                placeholder="Search notes, tasks & boards..."
                placeholderTextColor="#888"
                value={query}
                onChangeText={setQuery}
              />
              <View className="flex-row">
                <Pressable onPress={() => setQuery('')} className="px-2">
                  <FontAwesome5 name="times" size={18} color="#888" />
                </Pressable>
                <Text className="text-text-secondary px-2 py-1 bg-secondary-800 rounded ml-2">
                  ESC
                </Text>
              </View>
            </View>

            <View style={styles.resultsContainer}>
              {isSearching ? (
                <View className="p-4 items-center">
                  <Text className="text-text">Searching...</Text>
                </View>
              ) : results.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-text">No results found</Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={results}
                  renderItem={renderItem}
                  keyExtractor={(item) => `${item.type}-${item.item.uuid}`}
                  scrollEnabled={true}
                  onScrollToIndexFailed={onScrollToIndexFailed}
                  ItemSeparatorComponent={() => (
                    <View className="h-px bg-secondary-800 my-1" />
                  )}
                  initialScrollIndex={0}
                />
              )}

              <View className="p-3 border-t border-secondary-800">
                <View className="flex-row justify-between">
                  <View className="flex-row">
                    <Text className="text-text text-sm mr-4">
                      <Text className="text-primary">↑↓ </Text> to navigate
                    </Text>
                    <Text className="text-text text-sm">
                      <Text className="text-primary">Enter</Text> to select
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setVisible(false);
                      router.push('/search');
                    }}
                  >
                    <Text className="text-primary text-sm">
                      Advanced Search
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  resultsContainer: {
    maxHeight: 500,
  },
  resultItem: {
    padding: 12,
  },
  selectedItem: {
    backgroundColor: 'rgba(137, 180, 250, 0.1)',
  },
});
