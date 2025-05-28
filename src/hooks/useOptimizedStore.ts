import { useMemo } from 'react';
import { useStore } from '../store/useStore';

// Optimized selectors with memoization
export const useOptimizedStore = () => {
  const store = useStore();

  // Memoized filtered notes to prevent recalculation
  const filteredNotes = useMemo(() => {
    return store.filteredNotes();
  }, [store]);

  // Memoized recent notes
  const recentNotes = useMemo(() => {
    return store.recentNotes();
  }, [store]);

  // Memoized favorite notes
  const favoriteNotes = useMemo(() => {
    return store.favoriteNotes();
  }, [store]);

  // Memoized active note
  const activeNote = useMemo(() => {
    return store.activeNote();
  }, [store]);

  // Memoized project note counts
  const projectNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    store.projects.forEach(project => {
      counts[project.id] = store.getProjectNoteCount(project.id);
    });
    return counts;
  }, [store]);

  // Memoized folders by project
  const foldersByProject = useMemo(() => {
    const folderMap: Record<string, any[]> = {};
    store.projects.forEach(project => {
      folderMap[project.id] = store.getFoldersByProject(project.id);
    });
    return folderMap;
  }, [store]);

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