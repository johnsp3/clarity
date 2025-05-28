import { useMemo } from 'react';
import { useStore } from '../store/useStore';

// Optimized selectors with memoization
export const useOptimizedStore = () => {
  const store = useStore();

  // Memoized filtered notes to prevent recalculation
  const filteredNotes = useMemo(() => {
    return store.filteredNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.notes,
    store.searchQuery,
    store.activeProjectId,
    store.quickAccessView,
    store.favoriteNoteIds,
    store.activeFolderId,
    store.searchFilters,
    store.viewMode,
    store.filteredNotes,
    store.tags // Added missing dependency
  ]);

  // Memoized recent notes
  const recentNotes = useMemo(() => {
    return store.recentNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.notes]); // More specific dependency

  // Memoized favorite notes
  const favoriteNotes = useMemo(() => {
    return store.favoriteNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.notes, store.favoriteNoteIds]); // More specific dependencies

  // Memoized active note
  const activeNote = useMemo(() => {
    return store.activeNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.notes, store.activeNoteId]); // More specific dependencies

  // Memoized project note counts
  const projectNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    store.projects.forEach(project => {
      counts[project.id] = store.getProjectNoteCount(project.id);
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.projects, store.notes, store.getProjectNoteCount]); // More specific dependencies

  // Memoized folders by project
  const foldersByProject = useMemo(() => {
    const folderMap: Record<string, any[]> = {};
    store.projects.forEach(project => {
      folderMap[project.id] = store.getFoldersByProject(project.id);
    });
    return folderMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.projects, store.folders, store.getFoldersByProject]); // More specific dependencies

  return {
    // Original store methods and state
    ...store,
    
    // Optimized computed values
    filteredNotes,
    recentNotes,
    favoriteNotes,
    activeNote,
    projectNoteCounts,
    foldersByProject,
  };
}; 