import React, { useCallback, useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Platform } from 'react-native';
import { FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useSearchStore, SearchItemType } from '../utils/useSearchStore';
import Modal from '../components/Modal';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

type Option<T> = { value: T; label: string };
type SortValue = 'relevance' | 'updatedAt' | 'createdAt' | 'dueDate';
type SortDirection = 'asc' | 'desc';
type DueDateFilter = 'all' | 'overdue' | 'today' | 'upcoming' | 'none';

// Helper to compare two arrays (order‑independent)
function arraysHaveSameElements<T>(arr1?: T[], arr2?: T[]): boolean {
  const s1 = new Set(arr1 ?? []);
  const s2 = new Set(arr2 ?? []);
  if (s1.size !== s2.size) return false;
  for (const v of s1) if (!s2.has(v)) return false;
  return true;
}

export default function SearchBar() {
  // Pull state & actions from the search store
  const {
    searchTerm,
    setSearchTerm,
    selectedTypes,
    setSelectedTypes,
    selectedTags,
    setSelectedTags,
    dueDateFilter,
    setDueDateFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    search,
    getAllTags,
  } = useSearchStore();

  // Get all available tags
  const availableTags = getAllTags();

  const [filtersVisible, setFiltersVisible] = useState(false);

  // Reference for the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Callbacks for bottom sheet
  const showBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setFiltersVisible(false);
    }
  }, []);

  // Create combined sort options from sortBy and sortDirection
  const getSortValue = (): string => {
    return `${sortBy}_${sortDirection}`;
  };

  const setSortValue = (value: string) => {
    const [sort, direction] = value.split('_') as [SortValue, SortDirection];
    setSortBy(sort);
    setSortDirection(direction);
  };

  const sortOptions: Option<string>[] = [
    { value: 'updatedAt_desc', label: 'Recently Updated' },
    { value: 'updatedAt_asc', label: 'Oldest Updated' },
    { value: 'createdAt_desc', label: 'Recently Created' },
    { value: 'createdAt_asc', label: 'Oldest Created' },
    { value: 'relevance_desc', label: 'Most Relevant' },
    { value: 'dueDate_asc', label: 'Due Soon' },
    { value: 'dueDate_desc', label: 'Due Later' },
  ];

  const typeOptions: Option<SearchItemType>[] = [
    { value: 'note', label: 'Notes' },
    { value: 'task', label: 'Tasks' },
    { value: 'taskBoard', label: 'Boards' },
  ];

  // Toggle functions
  const toggleType = (type: SearchItemType) => {
    const curr = [...selectedTypes];
    if (curr.includes(type)) {
      if (curr.length === 1) return; // Don't allow removing the last type
      setSelectedTypes(curr.filter((t) => t !== type));
    } else {
      setSelectedTypes([...curr, type]);
    }
    search();
  };

  const toggleTag = (tag: string) => {
    const curr = [...selectedTags];
    const next = curr.includes(tag) ? curr.filter((t) => t !== tag) : [...curr, tag];
    setSelectedTags(next);
    search();
  };

  const toggleDueDate = (filter: DueDateFilter) => {
    setDueDateFilter(dueDateFilter === filter ? 'all' : filter);
    search();
  };

  const resetFilters = () => {
    setSelectedTypes(['note', 'task', 'taskBoard']);
    setSelectedTags([]);
    setDueDateFilter('all');
    setSortBy('relevance');
    setSortDirection('desc');
    search();
  };

  // Check if any filter differs from defaults
  const areFiltersActive = () => {
    const defaultTypes: SearchItemType[] = ['note', 'task', 'taskBoard'];

    return (
      !arraysHaveSameElements(selectedTypes, defaultTypes) ||
      selectedTags.length > 0 ||
      dueDateFilter !== 'all' ||
      sortBy !== 'relevance' ||
      sortDirection !== 'desc'
    );
  };

  const filtersActive = areFiltersActive();

  // Function to show filters based on platform
  const showFilters = () => {
    setFiltersVisible(true);
    if (Platform.OS !== 'web') {
      showBottomSheet();
    }
  };

  // Filter content component - shared between modal and bottom sheet
  const FilterContent = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Sort by */}
      <Text className="mb-2 text-lg font-medium text-text">Sort by </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-ml-2 mb-5">
        {sortOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              setSortValue(opt.value);
              search();
            }}
            className={`ml-2 rounded-full px-3 py-1.5 ${
              getSortValue() === opt.value ? 'bg-primary' : 'bg-background-muted'
            }`}>
            <Text
              className={`text-sm ${getSortValue() === opt.value ? 'text-white' : 'text-text'}`}>
              {opt.label}{' '}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Item Type */}
      <Text className="mb-2 text-lg font-medium text-text">Item Type </Text>
      <View className="-ml-2 mb-5 flex-row flex-wrap">
        {typeOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => toggleType(opt.value)}
            className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
              selectedTypes.includes(opt.value) ? 'bg-primary' : 'bg-background-muted'
            }`}>
            <Text
              className={`text-sm ${
                selectedTypes.includes(opt.value) ? 'text-white' : 'text-text'
              }`}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Due Date */}
      <Text className="mb-2 text-lg font-medium text-text">Due Date</Text>
      <View className="-ml-2 mb-5 flex-row flex-wrap">
        <Pressable
          onPress={() => toggleDueDate('overdue')}
          className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
            dueDateFilter === 'overdue' ? 'bg-primary' : 'bg-background-muted'
          }`}>
          <Text className={`text-sm ${dueDateFilter === 'overdue' ? 'text-white' : 'text-text'}`}>
            Overdue
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggleDueDate('today')}
          className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
            dueDateFilter === 'today' ? 'bg-primary' : 'bg-background-muted'
          }`}>
          <Text className={`text-sm ${dueDateFilter === 'today' ? 'text-white' : 'text-text'}`}>
            Due Today
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggleDueDate('upcoming')}
          className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
            dueDateFilter === 'upcoming' ? 'bg-primary' : 'bg-background-muted'
          }`}>
          <Text className={`text-sm ${dueDateFilter === 'upcoming' ? 'text-white' : 'text-text'}`}>
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggleDueDate('none')}
          className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
            dueDateFilter === 'none' ? 'bg-primary' : 'bg-background-muted'
          }`}>
          <Text className={`text-sm ${dueDateFilter === 'none' ? 'text-white' : 'text-text'}`}>
            No Due Date
          </Text>
        </Pressable>
      </View>

      {/* Tags */}
      <Text className="mb-2 text-lg font-medium text-text">Tags</Text>
      {availableTags.length > 0 ? (
        <View className="-ml-2 mb-5 flex-row flex-wrap">
          {availableTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className={`mb-2 ml-2 rounded-full px-3 py-1.5 ${
                selectedTags.includes(tag) ? 'bg-primary' : 'bg-background-muted'
              }`}>
              <Text
                className={`text-sm ${selectedTags.includes(tag) ? 'text-white' : 'text-text'}`}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text className="text-text-secondary mb-5 italic">No tags found across items</Text>
      )}

      {/* Reset */}
      <Pressable onPress={resetFilters} className="mb-4 mt-2 rounded-lg bg-primary py-3">
        <Text className="text-center text-base font-bold text-white">Reset Filters & Sort</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <>
      <View className="mb-4">
        {/* Search Input Bar */}
        <View className="bg-background-muted flex-row items-center rounded-lg p-1">
          <FontAwesome5 name="search" size={16} color="#888" className="mx-2" />
          <TextInput
            className="flex-1 px-1 py-2 text-base text-text"
            placeholder="Search notes, tasks & boards..."
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              search();
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <Pressable onPress={showFilters} className="p-1">
            <View className={`rounded-md p-2 ${filtersActive ? 'bg-primary' : 'bg-transparent'}`}>
              <FontAwesome5 name="sliders-h" size={18} color={filtersActive ? '#fff' : '#888'} />
            </View>
          </Pressable>
        </View>

        {/* Web Modal */}
        {Platform.OS === 'web' && (
          <Modal open={filtersVisible} setOpen={setFiltersVisible} title="Filters & Sorting">
            <View className="p-4">
              <FilterContent />
            </View>
          </Modal>
        )}
      </View>
      {Platform.OS !== 'web' && (
        <BottomSheet
          ref={bottomSheetRef}
          onChange={handleSheetChanges}
          index={-1}
          enablePanDownToClose
          handleStyle={{
            backgroundColor: '#121517',
            borderTopWidth: 2,
            borderTopColor: '#313749',
          }}
          handleIndicatorStyle={{ backgroundColor: '#313749' }}
          backgroundStyle={{ backgroundColor: '#121517' }}>
          <BottomSheetView>
            <View className="p-4">
              <View className="mb-4 flex-row items-center justify-between border-b border-secondary-850 pb-2">
                <Text className="text-xl font-semibold text-text">Filters & Sorting</Text>
                <Pressable onPress={() => bottomSheetRef.current?.close()}>
                  <AntDesign name="close" size={24} color="#fff" />
                </Pressable>
              </View>
              <FilterContent />
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </>
  );
}
