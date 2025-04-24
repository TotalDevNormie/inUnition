import { create } from "zustand";
import { useNoteStore, Note } from "./manageNotes";
import { useTaskStore, Task } from "./manageTasks";
import { useTaskBoardStore, TaskBoard } from "./manageTaskBoards";

export type SearchItemType = "note" | "task" | "taskBoard";

export interface SearchItem {
  uuid: string;
  title?: string;
  content?: string;
  description?: string;
  name?: string;
  type: SearchItemType;
  tags?: string[];
  endsAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface SearchState {
  searchTerm: string;
  searchResults: SearchItem[];
  selectedTypes: SearchItemType[];
  selectedTags: string[];
  dueDateFilter: "all" | "overdue" | "today" | "upcoming" | "none";
  sortBy: "relevance" | "updatedAt" | "createdAt" | "dueDate";
  sortDirection: "asc" | "desc";
  
  setSearchTerm: (term: string) => void;
  setSelectedTypes: (types: SearchItemType[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setDueDateFilter: (filter: "all" | "overdue" | "today" | "upcoming" | "none") => void;
  setSortBy: (sortBy: "relevance" | "updatedAt" | "createdAt" | "dueDate") => void;
  setSortDirection: (direction: "asc" | "desc") => void;
  search: () => void;
  getAllTags: () => string[];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: "",
  searchResults: [],
  selectedTypes: ["note", "task", "taskBoard"],
  selectedTags: [],
  dueDateFilter: "all",
  sortBy: "relevance",
  sortDirection: "desc",

  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setSelectedTypes: (types) => set({ selectedTypes: types }),
  
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  
  setDueDateFilter: (filter) => set({ dueDateFilter: filter }),
  
  setSortBy: (sortBy) => set({ sortBy }),
  
  setSortDirection: (direction) => set({ sortDirection: direction }),
  
  search: () => {
    const { 
      searchTerm, 
      selectedTypes, 
      selectedTags, 
      dueDateFilter,
      sortBy,
      sortDirection
    } = get();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let results: SearchItem[] = [];
    
    // Get items from all stores based on selected types
    if (selectedTypes.includes("note")) {
      const notes = useNoteStore.getState().activeNotesArray();
      const noteItems: SearchItem[] = notes.map((note: Note) => ({
        uuid: note.uuid,
        title: note.title,
        content: note.content,
        type: "note",
        tags: note.tags,
        endsAt: note.endsAt,
        updatedAt: note.updatedAt,
        createdAt: note.createdAt
      }));
      results = [...results, ...noteItems];
    }
    
    if (selectedTypes.includes("task")) {
      const tasks = useTaskStore.getState().activeTasksArray();
      const taskItems: SearchItem[] = tasks.map((task: Task) => ({
        uuid: task.uuid,
        title: task.name,
        content: task.description,
        type: "task",
        tags: task.tags,
        endsAt: task.endsAt,
        updatedAt: task.updatedAt,
        createdAt: task.createdAt
      }));
      results = [...results, ...taskItems];
    }
    
    if (selectedTypes.includes("taskBoard")) {
      const taskBoards = useTaskBoardStore.getState().activeTaskBoards();
      const taskBoardItems: SearchItem[] = taskBoards.map((board: TaskBoard) => ({
        uuid: board.uuid,
        title: board.name,
        content: board.description,
        type: "taskBoard",
        tags: board.tags,
        endsAt: board.endsAt,
        updatedAt: board.updatedAt,
        createdAt: board.createdAt
      }));
      results = [...results, ...taskBoardItems];
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(item => 
        (item.title?.toLowerCase().includes(lowerSearchTerm) || 
         item.content?.toLowerCase().includes(lowerSearchTerm) ||
         item.description?.toLowerCase().includes(lowerSearchTerm) ||
         item.name?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Filter by tags
    if (selectedTags.length > 0) {
      results = results.filter(item => 
        item.tags && selectedTags.some(tag => item.tags?.includes(tag))
      );
    }
    
    // Filter by due date
    if (dueDateFilter !== "all") {
      results = results.filter(item => {
        if (!item.endsAt) {
          return dueDateFilter === "none";
        }
        
        const dueDate = new Date(item.endsAt);
        
        switch (dueDateFilter) {
          case "overdue":
            return dueDate < today;
          case "today":
            return dueDate >= today && dueDate < tomorrow;
          case "upcoming":
            return dueDate >= today;
          case "none":
            return false;
          default:
            return true;
        }
      });
    }
    
    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "updatedAt":
          comparison = (a.updatedAt && b.updatedAt) 
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : 0;
          break;
        case "createdAt":
          comparison = (a.createdAt && b.createdAt)
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : 0;
          break;
        case "dueDate":
          comparison = (a.endsAt && b.endsAt)
            ? new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
            : (!a.endsAt && b.endsAt) ? 1 : (a.endsAt && !b.endsAt) ? -1 : 0;
          break;
        case "relevance":
        default:
          // For relevance, prioritize title matches over content matches
          const aTitle = a.title?.toLowerCase() || "";
          const bTitle = b.title?.toLowerCase() || "";
          const aContent = a.content?.toLowerCase() || "";
          const bContent = b.content?.toLowerCase() || "";
          const searchTermLower = searchTerm.toLowerCase();
          
          const aTitleMatch = aTitle.includes(searchTermLower);
          const bTitleMatch = bTitle.includes(searchTermLower);
          
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          
          // If both match in title or neither match in title, check content
          const aContentMatch = aContent.includes(searchTermLower);
          const bContentMatch = bContent.includes(searchTermLower);
          
          if (aContentMatch && !bContentMatch) return -1;
          if (!aContentMatch && bContentMatch) return 1;
          
          // If still tied, sort by updated date
          comparison = (a.updatedAt && b.updatedAt) 
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : 0;
      }
      
      // Apply sort direction
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    set({ searchResults: results });
  },
  
  getAllTags: () => {
    const noteTags = useNoteStore.getState().activeNotesArray()
      .flatMap(note => note.tags || []);
    
    const taskTags = useTaskStore.getState().activeTasksArray()
      .flatMap(task => task.tags || []);
    
    const taskBoardTags = useTaskBoardStore.getState().activeTaskBoards()
      .flatMap(board => board.tags || []);
    
    // Combine all tags and remove duplicates
    const allTags = [...new Set([...noteTags, ...taskTags, ...taskBoardTags])];
    
    return allTags;
  }
}));
