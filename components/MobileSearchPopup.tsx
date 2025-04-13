// components/MobileSearchPopup.tsx
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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSearch } from '../utils/SearchContext';
import { router } from 'expo-router';
import moment from 'moment';

interface MobileSearchPopupProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function MobileSearchPopup({
  visible,
  setVisible,
}: MobileSearchPopupProps) {
  const { query, setQuery, results, isSearching } = useSearch();

  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      // Animate slide in
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Animate slide out
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Clear the query when closing
      setQuery('');
    }
  }, [visible]);

  const navigateToItem = (type: string, item: any) => {
    setVisible(false);

    switch (type) {
      case 'note':
        router.push(`/note/${item.uuid}`);
        break;
      case 'task':
        // Navigate to the parent task board
        router.push(`/taskboard/${item.taskBoardUUID}`);
        break;
      case 'board':
        router.push(`/taskboard/${item.uuid}`);
        break;
    }
  };

  const handleSubmitSearch = () => {
    if (query.trim()) {
      setVisible(false);
      router.push({
        pathname: '/search',
        params: { q: query },
      });
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

  const renderItem = ({ item }) => {
    const { type, item: data, matches } = item;

    return (
      <Pressable
        onPress={() => navigateToItem(type, data)}
        className="py-3 px-4 border-b border-secondary-800"
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
            <FontAwesome5 name={getIcon(type)} size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-lg text-text font-semibold" numberOfLines={1}>
              {data.title || data.name || 'Untitled'}
            </Text>
            <Text className="text-text-secondary text-sm" numberOfLines={1}>
              {type.charAt(0).toUpperCase() + type.slice(1)} •{' '}
              {moment(data.updatedAt).fromNow()}
            </Text>
          </View>
        </View>

        {matches.length > 0 && (
          <Text className="text-text mt-2 ml-13" numberOfLines={2}>
            {matches[0].text}
          </Text>
        )}
      </Pressable>
    );
  };

  const { height } = Dimensions.get('window');
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <Animated.View
        style={[styles.container, { transform: [{ translateY }] }]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-row items-center p-4 border-b border-secondary-800">
            <Pressable onPress={() => setVisible(false)} className="px-2">
              <FontAwesome5 name="arrow-left" size={20} color="#888" />
            </Pressable>
            <View className="flex-1 flex-row bg-secondary-800 rounded-full mx-2 px-4 items-center">
              <FontAwesome5
                name="search"
                size={16}
                color="#888"
                className="mr-2"
              />
              <TextInput
                ref={inputRef}
                className="flex-1 py-2 text-text"
                placeholder="Search notes, tasks & boards..."
                placeholderTextColor="#888"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSubmitSearch}
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')}>
                  <FontAwesome5 name="times-circle" size={16} color="#888" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            {isSearching ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-text">Searching...</Text>
              </View>
            ) : results.length === 0 ? (
              query.trim() ? (
                <View className="flex-1 justify-center items-center p-4">
                  <Text className="text-text text-lg mb-2">
                    No results found
                  </Text>
                  <Text className="text-text-secondary text-center">
                    Try searching for something else or tap search to see all
                    results
                  </Text>
                </View>
              ) : (
                <View className="p-4">
                  <Text className="text-text-secondary">
                    Start typing to search
                  </Text>
                </View>
              )
            ) : (
              <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.type}-${item.item.uuid}`}
                ListHeaderComponent={
                  <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-text-secondary">
                      {results.length}{' '}
                      {results.length === 1 ? 'result' : 'results'}
                    </Text>
                    <Pressable onPress={handleSubmitSearch}>
                      <Text className="text-primary">See all results</Text>
                    </Pressable>
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
    backgroundColor: '#1e1e2e', // Match your secondary-850 color
  },
});
