// utils/SearchContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNoteStore } from './manageNotes';
import { useTaskStore } from './manageTasks';
import { useTaskBoardStore } from './manageTaskBoards';
import { Note, Task, TaskBoard } from './types';
import { useRouter } from 'expo-router';

type SearchResult = {
  type: 'note' | 'task' | 'board';
  item: Note | Task | TaskBoard;
  matches: {
    field: string;
    text: string;
  }[];
};

type SortOption =
  | 'updatedAt_desc'
  | 'updatedAt_asc'
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'title_asc'
  | 'title_desc'
  | 'due_asc'
  | 'due_desc';

type FilterOption = {
  type?: ('note' | 'task' | 'board')[];
  tags?: string[];
  status?: ('active' | 'deleted')[];
  hasDueDate?: boolean;
  isOverdue?: boolean;
};

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  filters: FilterOption;
  setFilters: (filters: FilterOption) => void;
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  results: SearchResult[];
  isSearching: boolean;
  availableTags: string[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterOption>({
    type: ['note', 'task', 'board'],
    status: ['active'],
  });
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt_desc');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const { activeNotesArray } = useNoteStore();
  const { tasksFromBoard, tasks } = useTaskStore();
  const { activeTaskBoards } = useTaskBoardStore();
  const router = useRouter();

  // Extract all available tags
  useEffect(() => {
    const allTags = new Set<string>();

    activeNotesArray().forEach((note) =>
      note.tags?.forEach((tag) => allTags.add(tag)),
    );
    Object.values(tasks).forEach((task) =>
      task.tags?.forEach((tag) => allTags.add(tag)),
    );
    activeTaskBoards().forEach((board) =>
      board.tags?.forEach((tag) => allTags.add(tag)),
    );

    setAvailableTags(Array.from(allTags));
  }, [activeNotesArray, tasks, activeTaskBoards]);

  useEffect(() => {
    // Handle initial query from route params
    const handleInitialQuery = async () => {
      try {
        // For Expo Router, get the query parameter
        const params = router
          .getState()
          .routes.find((r) => r.name === 'search')?.params;
        if (params?.q) {
          setQuery(params.q as string);
        }
      } catch (error) {
        console.log('Error getting initial query:', error);
      }
    };

    handleInitialQuery();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const searchResults: SearchResult[] = [];
    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    // Function to check if an item matches search terms
    const matchesSearch = (text: string | undefined): boolean => {
      if (!text || !query.trim()) return !query.trim();
      text = text.toLowerCase();
      return searchTerms.every((term) => text.includes(term));
    };

    // Function to check if item matches filters
    const matchesFilters = (
      item: any,
      type: 'note' | 'task' | 'board',
    ): boolean => {
      if (filters.type && !filters.type.includes(type)) return false;
      if (filters.status && !filters.status.includes(item.status || item.state))
        return false;
      if (filters.tags && filters.tags.length > 0) {
        if (!item.tags || !filters.tags.some((tag) => item.tags.includes(tag)))
          return false;
      }
      if (filters.hasDueDate) {
        if (!item.endsAt) return false;
      }
      if (filters.isOverdue) {
        if (!item.endsAt || new Date(item.endsAt) > new Date()) return false;
      }
      return true;
    };

    // Search notes
    if (!filters.type || filters.type.includes('note')) {
      activeNotesArray().forEach((note) => {
        if (!matchesFilters(note, 'note')) return;

        const matches: { field: string; text: string }[] = [];

        if (matchesSearch(note.title)) {
          matches.push({ field: 'title', text: note.title || '' });
        }

        if (matchesSearch(note.content)) {
          const content = note.content || '';
          const previewText =
            content.length > 150 ? content.substring(0, 150) + '...' : content;
          matches.push({ field: 'content', text: previewText });
        }

        if (matches.length > 0) {
          searchResults.push({ type: 'note', item: note, matches });
        }
      });
    }

    // Search tasks
    if (!filters.type || filters.type.includes('task')) {
      Object.values(tasks).forEach((task) => {
        if (
          task.status === 'deleted' &&
          (!filters.status || !filters.status.includes('deleted'))
        )
          return;
        if (!matchesFilters(task, 'task')) return;

        const matches: { field: string; text: string }[] = [];

        if (matchesSearch(task.name)) {
          matches.push({ field: 'name', text: task.name });
        }

        if (matchesSearch(task.description)) {
          const description = task.description || '';
          const previewText =
            description.length > 150
              ? description.substring(0, 150) + '...'
              : description;
          matches.push({ field: 'description', text: previewText });
        }

        if (matches.length > 0) {
          searchResults.push({ type: 'task', item: task, matches });
        }
      });
    }

    // Search task boards
    if (!filters.type || filters.type.includes('board')) {
      activeTaskBoards().forEach((board) => {
        if (!matchesFilters(board, 'board')) return;

        const matches: { field: string; text: string }[] = [];

        if (matchesSearch(board.name)) {
          matches.push({ field: 'name', text: board.name || '' });
        }

        if (matchesSearch(board.description)) {
          const description = board.description || '';
          const previewText =
            description.length > 150
              ? description.substring(0, 150) + '...'
              : description;
          matches.push({ field: 'description', text: previewText });
        }

        if (matches.length > 0) {
          searchResults.push({ type: 'board', item: board, matches });
        }
      });
    }

    // Sort results
    const sortResults = (a: SearchResult, b: SearchResult) => {
      const itemA = a.item as any;
      const itemB = b.item as any;

      switch (sortBy) {
        case 'updatedAt_desc':
          return (
            new Date(itemB.updatedAt || 0).getTime() -
            new Date(itemA.updatedAt || 0).getTime()
          );
        case 'updatedAt_asc':
          return (
            new Date(itemA.updatedAt || 0).getTime() -
            new Date(itemB.updatedAt || 0).getTime()
          );
        case 'createdAt_desc':
          return (
            new Date(itemB.createdAt || 0).getTime() -
            new Date(itemA.createdAt || 0).getTime()
          );
        case 'createdAt_asc':
          return (
            new Date(itemA.createdAt || 0).getTime() -
            new Date(itemB.createdAt || 0).getTime()
          );
        case 'title_asc':
          return (itemA.title || itemA.name || '').localeCompare(
            itemB.title || itemB.name || '',
          );
        case 'title_desc':
          return (itemB.title || itemB.name || '').localeCompare(
            itemA.title || itemA.name || '',
          );
        case 'due_asc':
          return (
            new Date(itemA.endsAt || 9999999999999).getTime() -
            new Date(itemB.endsAt || 9999999999999).getTime()
          );
        case 'due_desc':
          return (
            new Date(itemB.endsAt || 0).getTime() -
            new Date(itemA.endsAt || 0).getTime()
          );
        default:
          return 0;
      }
    };

    setResults(searchResults.sort(sortResults));
    setIsSearching(false);
  }, [query, filters, sortBy, activeNotesArray, tasks, activeTaskBoards]);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        results,
        isSearching,
        availableTags,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
