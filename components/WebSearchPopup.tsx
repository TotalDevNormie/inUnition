import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSearchStore, SearchItem, SearchItemType } from '../utils/useSearchStore';
import { router } from 'expo-router';
import moment from 'moment';
import { Note } from '../utils/manageNotes';
import { TaskBoard } from '../utils/manageTaskBoards';
import { Task } from '../utils/manageTasks';

type SearchResult = {
  type: SearchItemType;
  item: SearchItem;
  matches: { text: string }[];
};

export default function SearchPopup() {
  const listenerAddedRef = useRef(false);
  const { searchTerm, setSearchTerm, searchResults, search } = useSearchStore();

  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [processedResults, setProcessedResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<any>>(null);

  // Process search results to match the expected format
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setProcessedResults([]);
      return;
    }

    const results: SearchResult[] = searchResults.map((item) => {
      // Extract content for matching
      let contentText = '';
      if (item.content) {
        contentText = item.content;
      } else if (item.description) {
        contentText = item.description;
      }

      // Create match object
      const matches = [];
      if (contentText) {
        const lowerContent = contentText.toLowerCase();
        const lowerQuery = searchTerm.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);

        if (index >= 0) {
          // Get context around the match
          const start = Math.max(0, index - 30);
          const end = Math.min(lowerContent.length, index + searchTerm.length + 70);
          let matchText = contentText.substring(start, end);

          // Add ellipsis if needed
          if (start > 0) matchText = '...' + matchText;
          if (end < contentText.length) matchText = matchText + '...';

          matches.push({ text: matchText });
        } else {
          // If no direct match in content, just use the beginning
          matches.push({
            text: contentText.substring(0, 100) + (contentText.length > 100 ? '...' : ''),
          });
        }
      } else {
        matches.push({ text: '' });
      }

      return {
        type: item.type,
        item: item,
        matches,
      };
    });

    setProcessedResults(results);
  }, [searchResults, searchTerm]);

  // Listen for search trigger event
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleTriggerSearch = () => {
        setVisible(true);
      };
      document.addEventListener('triggerSearch', handleTriggerSearch);
      return () => {
        document.removeEventListener('triggerSearch', handleTriggerSearch);
      };
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setVisible(true);
      return;
    }
    if (!visible) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setVisible(false);
      return;
    }
    if (processedResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < processedResults.length - 1 ? prev + 1 : 0;
          flatListRef.current?.scrollToIndex({
            index: next,
            animated: true,
            viewPosition: 0.5,
          });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : processedResults.length - 1;
          flatListRef.current?.scrollToIndex({
            index: next,
            animated: true,
            viewPosition: 0.5,
          });
          return next;
        });
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const sel = processedResults[selectedIndex];
        if (sel) {
          navigateToItem(sel.item);
          if (Platform.OS === 'web') inputRef.current?.blur();
        }
      }
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!listenerAddedRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      listenerAddedRef.current = true;
    }
    return () => {
      if (listenerAddedRef.current) {
        window.removeEventListener('keydown', handleKeyDown);
        listenerAddedRef.current = false;
      }
    };
  }, [visible, processedResults, selectedIndex]);

  useEffect(() => {
    if (visible) {
      setSelectedIndex(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    setSelectedIndex(0);
    if (visible) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [processedResults, visible]);

  // Perform search when search term changes
  useEffect(() => {
    search();
  }, [searchTerm, search]);

  const navigateToItem = (item: SearchItem) => {
    setVisible(false);
    setSearchTerm('');

    if (item.type === 'note') {
      router.push(`/note/${item.uuid}`);
    } else if (item.type === 'task') {
      router.push(`/taskboard/${item.uuid.split('-')[0]}?taskId=${item.uuid}`);
    } else if (item.type === 'taskBoard') {
      router.push(`/taskboard/${item.uuid}`);
    } else {
      console.warn('Cannot navigate to item:', item);
    }
  };

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

  const renderItem = ({ item, index }: { item: SearchResult; index: number }) => {
    const { type, item: data, matches } = item;
    const isSel = index === selectedIndex;
    const title = data.title || data.name || 'Untitled';
    const updated = data.updatedAt || data.createdAt || new Date().toISOString();

    return (
      <Pressable
        onPress={() => navigateToItem(data)}
        className={`px-4 py-2.5 ${isSel ? 'bg-primary/10' : ''}`}
        onHoverIn={() => setSelectedIndex(index)}>
        <View className="flex-row items-center">
          <View
            className={`mr-3 h-8 w-8 items-center justify-center rounded-full text-text ${
              isSel ? 'bg-primary' : 'bg-secondary'
            }`}>
            <FontAwesome5 name={getIcon(type)} size={16} className="text-text" />
          </View>
          <View className="flex-1">
            <Text
              className={`font-semibold text-text ${isSel ? 'text-primary' : 'text-text'}`}
              numberOfLines={1}>
              {title}{' '}
            </Text>
            <Text className="mt-0.5 text-xs text-accent">
              {type === 'taskBoard' ? 'Board' : type.charAt(0).toUpperCase() + type.slice(1)} •
              Updated {moment(updated).fromNow()}{' '}
            </Text>
          </View>
        </View>
        {matches[0]?.text && (
          <View className="ml-11 mt-1 pr-4">
            <Text className="text-sm text-text" numberOfLines={2}>
              {matches[0].text}{' '}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const onScrollToIndexFailed = (info: any) => {
    console.warn('ScrollToIndexFailed:', info);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.5,
      });
    }, 100);
  };

  if (Platform.OS !== 'web') return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}>
      <Pressable
        className="flex-1 items-center justify-start bg-black/50 pt-[10%]"
        onPress={() => setVisible(false)}>
        <View className="w-[90%] max-w-2xl">
          <Pressable
            className="overflow-hidden rounded-lg bg-background shadow-lg"
            onPress={(e) => e.stopPropagation()}>
            <View className="border-border flex-row items-center border-b px-2 py-1">
              <FontAwesome5 name="search" size={18} className="mx-2 text-text" />
              <TextInput
                ref={inputRef}
                className="flex-1 px-2 py-3 text-base text-text"
                placeholder="Search notes, tasks & boards..."
                placeholderTextColor="#888"
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (processedResults.length > 0 && selectedIndex >= 0) {
                    navigateToItem(processedResults[selectedIndex].item);
                  }
                }}
              />
              {searchTerm.length > 0 && (
                <Pressable onPress={() => setSearchTerm('')} className="p-2">
                  <FontAwesome5 name="times-circle" size={18} color="#888" />
                </Pressable>
              )}
              <Text className="bg-background-muted ml-2 mr-1 rounded px-1.5 py-0.5 text-xs text-text">
                ESC{' '}
              </Text>
            </View>

            <View className="max-h-[400px] min-h-[60px]">
              {processedResults.length === 0 ? (
                <View className="min-h-[60px] items-center justify-center p-4">
                  <Text className="text-text-secondary">
                    {searchTerm.trim() ? 'No results found' : 'Type to search'}{' '}
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={processedResults}
                  renderItem={renderItem}
                  keyExtractor={(i) => `${i.type}-${i.item.uuid}`}
                  scrollEnabled
                  onScrollToIndexFailed={onScrollToIndexFailed}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>

            <View className="border-border flex-row items-center justify-between border-t p-3">
              <View className="flex-row items-center space-x-4">
                <Text className="text-xs text-text">
                  <Text className="font-bold text-text">↑↓ </Text> to navigate{' '}
                </Text>
                <Text className="text-xs text-text">
                  <Text className="font-bold text-text">Enter </Text> to select{' '}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setVisible(false);
                  router.push('/search');
                }}>
                <Text className="text-xs font-medium text-primary">Advanced Search </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
