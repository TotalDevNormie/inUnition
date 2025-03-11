// components/SearchBar.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Modal,
  Text,
  ScrollView,
  FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSearch } from '../utils/SearchContext';

export default function SearchBar() {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    availableTags,
  } = useSearch();

  const [filtersVisible, setFiltersVisible] = useState(false);

  const sortOptions = [
    { value: 'updatedAt_desc', label: 'Recently Updated' },
    { value: 'updatedAt_asc', label: 'Oldest Updated' },
    { value: 'createdAt_desc', label: 'Recently Created' },
    { value: 'createdAt_asc', label: 'Oldest Created' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'due_asc', label: 'Due Soon' },
    { value: 'due_desc', label: 'Due Later' },
  ];

  const typeOptions = [
    { value: 'note', label: 'Notes' },
    { value: 'task', label: 'Tasks' },
    { value: 'board', label: 'Boards' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'deleted', label: 'Deleted' },
  ];

  const toggleType = (type) => {
    if (!filters.type) {
      setFilters({ ...filters, type: [type] });
      return;
    }

    if (filters.type.includes(type)) {
      if (filters.type.length === 1) return; // Don't allow removing all types
      setFilters({
        ...filters,
        type: filters.type.filter((t) => t !== type),
      });
    } else {
      setFilters({
        ...filters,
        type: [...filters.type, type],
      });
    }
  };

  const toggleTag = (tag) => {
    if (!filters.tags) {
      setFilters({ ...filters, tags: [tag] });
      return;
    }

    if (filters.tags.includes(tag)) {
      setFilters({
        ...filters,
        tags: filters.tags.filter((t) => t !== tag),
      });
    } else {
      setFilters({
        ...filters,
        tags: [...filters.tags, tag],
      });
    }
  };

  const toggleStatus = (status) => {
    if (!filters.status) {
      setFilters({ ...filters, status: [status] });
      return;
    }

    if (filters.status.includes(status)) {
      if (filters.status.length === 1) return; // Don't allow removing all statuses
      setFilters({
        ...filters,
        status: filters.status.filter((s) => s !== status),
      });
    } else {
      setFilters({
        ...filters,
        status: [...filters.status, status],
      });
    }
  };

  const toggleDueDate = () => {
    setFilters({
      ...filters,
      hasDueDate: !filters.hasDueDate,
    });
  };

  const toggleOverdue = () => {
    setFilters({
      ...filters,
      isOverdue: !filters.isOverdue,
    });
  };

  const resetFilters = () => {
    setFilters({ type: ['note', 'task', 'board'], status: ['active'] });
    setSortBy('updatedAt_desc');
  };

  return (
    <View className="mb-4">
      <View className="flex-row bg-secondary-850 rounded-xl p-2 items-center">
        <FontAwesome5 name="search" size={18} color="#888" className="mx-2" />
        <TextInput
          className="flex-1 p-2 text-text"
          placeholder="Search notes, tasks & boards..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
        />
        <Pressable onPress={() => setFiltersVisible(true)}>
          <View
            className={`p-2 rounded-lg ${Object.keys(filters).length > 2 ? 'bg-primary' : ''}`}
          >
            <FontAwesome5
              name="sliders-h"
              size={18}
              color={Object.keys(filters).length > 2 ? '#fff' : '#888'}
            />
          </View>
        </Pressable>
      </View>

      {/* Filters Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filtersVisible}
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-secondary-900 rounded-t-xl p-4 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text text-xl font-bold">
                Filters & Sorting
              </Text>
              <Pressable onPress={() => setFiltersVisible(false)}>
                <FontAwesome5 name="times" size={24} color="#888" />
              </Pressable>
            </View>

            <ScrollView>
              {/* Sort options */}
              <Text className="text-text text-lg mb-2">Sort by</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {sortOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSortBy(option.value)}
                    className={`px-3 py-2 rounded-lg ml-2 ${
                      sortBy === option.value
                        ? 'bg-primary'
                        : 'bg-secondary-800'
                    }`}
                  >
                    <Text
                      className={`${
                        sortBy === option.value ? 'text-white' : 'text-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Type filter */}
              <Text className="text-text text-lg mb-2">Item Type</Text>
              <View className="flex-row mb-4">
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleType(option.value)}
                    className={`px-3 py-2 rounded-lg mr-2 ${
                      filters.type?.includes(option.value)
                        ? 'bg-primary'
                        : 'bg-secondary-800'
                    }`}
                  >
                    <Text
                      className={`${
                        filters.type?.includes(option.value)
                          ? 'text-white'
                          : 'text-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Status filter */}
              <Text className="text-text text-lg mb-2">Status</Text>
              <View className="flex-row mb-4">
                {statusOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleStatus(option.value)}
                    className={`px-3 py-2 rounded-lg mr-2 ${
                      filters.status?.includes(option.value)
                        ? 'bg-primary'
                        : 'bg-secondary-800'
                    }`}
                  >
                    <Text
                      className={`${
                        filters.status?.includes(option.value)
                          ? 'text-white'
                          : 'text-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Due Date filters */}
              <Text className="text-text text-lg mb-2">Due Date</Text>
              <View className="flex-row mb-4">
                <Pressable
                  onPress={toggleDueDate}
                  className={`px-3 py-2 rounded-lg mr-2 ${
                    filters.hasDueDate ? 'bg-primary' : 'bg-secondary-800'
                  }`}
                >
                  <Text
                    className={`${
                      filters.hasDueDate ? 'text-white' : 'text-text'
                    }`}
                  >
                    Has Due Date
                  </Text>
                </Pressable>
                <Pressable
                  onPress={toggleOverdue}
                  className={`px-3 py-2 rounded-lg mr-2 ${
                    filters.isOverdue ? 'bg-primary' : 'bg-secondary-800'
                  }`}
                >
                  <Text
                    className={`${
                      filters.isOverdue ? 'text-white' : 'text-text'
                    }`}
                  >
                    Overdue
                  </Text>
                </Pressable>
              </View>

              {/* Tags filter */}
              <Text className="text-text text-lg mb-2">Tags</Text>
              {availableTags.length > 0 ? (
                <FlatList
                  data={availableTags}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => toggleTag(item)}
                      className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                        filters.tags?.includes(item)
                          ? 'bg-primary'
                          : 'bg-secondary-800'
                      }`}
                    >
                      <Text
                        className={`${
                          filters.tags?.includes(item)
                            ? 'text-white'
                            : 'text-text'
                        }`}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  )}
                  keyExtractor={(item) => item}
                  numColumns={3}
                  className="mb-4"
                />
              ) : (
                <Text className="text-text-secondary mb-4">
                  No tags available
                </Text>
              )}

              {/* Reset button */}
              <Pressable
                onPress={resetFilters}
                className="bg-accent py-3 rounded-lg mb-4"
              >
                <Text className="text-text text-center font-bold">
                  Reset Filters
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
