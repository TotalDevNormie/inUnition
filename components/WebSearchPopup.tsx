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
  const listenerAddedRef = useRef(false); // Ref to track if listener is added
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

  const handleKeyDown = (e: KeyboardEvent) => {
    // Check for Ctrl+K or Cmd+K
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
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (
        e.key === 'Enter' &&
        results.length > 0 &&
        selectedIndex >= 0
      ) {
        e.preventDefault();
        const selectedItem = results[selectedIndex];
        navigateToItem(selectedItem.type, selectedItem.item.uuid);
        setVisible(false);
      }
    }
  };

  // Listen for Ctrl+K on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Add the event listener only once
    if (!listenerAddedRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      listenerAddedRef.current = true; // Set the ref to true
    }

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      if (listenerAddedRef.current) {
        window.removeEventListener('keydown', handleKeyDown);
        listenerAddedRef.current = false; // Reset the ref
      }
    };
  }, [visible, results, selectedIndex]); // Keep dependencies for correct behavior

  // Focus input when modal opens
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
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
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const { type, item: data, matches } = item;
    const isSelected = index === selectedIndex;

    return (
      <Pressable
        onPress={() => navigateToItem(data)}
        style={[styles.resultItem, isSelected && styles.selectedItem]}
      >
        <View className="flex-row items-center">
          <View
            className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isSelected ? 'bg-primary-dark' : 'bg-primary'}`}
          >
            <FontAwesome5 name={getIcon(type)} size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text
              className={`text-lg font-semibold ${isSelected ? 'text-primary' : 'text-text'}`}
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
            className="max-w-[40rem] w-[90%] bg-background"
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
                  data={results}
                  renderItem={renderItem}
                  keyExtractor={(item) => `${item.type}-${item.item.uuid}`}
                  scrollEnabled={true}
                  ItemSeparatorComponent={() => (
                    <View className="h-px bg-secondary-800 my-1" />
                  )}
                />
              )}

              <View className="p-3 border-t border-secondary-800">
                <View className="flex-row justify-between">
                  <View className="flex-row">
                    <Text className="text-text text-sm mr-4">
                      <Text className="text-primary">Tab </Text> to navigate
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    width: '100%',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    maxWidth: 700,
    backgroundColor: '#1e1e2e', // Match your secondary-850 color
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsContainer: {
    maxHeight: 500,
  },
  resultItem: {
    padding: 12,
  },
  selectedItem: {
    backgroundColor: 'rgba(137, 180, 250, 0.1)', // Light primary color bg
  },
});
