import { useState, useCallback, useMemo } from 'react'
import { useOptimizedStore } from './useOptimizedStore'
import { announceToScreenReader } from '../utils/accessibility'

/**
 * Custom hook that encapsulates all the business logic for the note list
 * This separates the logic from the UI components
 */
export function useNoteListLogic() {
  const store = useOptimizedStore()
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  // Memoized values
  const selectedCount = useMemo(() => store.selectedNoteIds.size, [store.selectedNoteIds])
  
  const sortedNotes = useMemo(() => {
    const notes = [...store.filteredNotes]
    const { sortBy, sortOrder } = store.viewMode
    
    notes.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
          break
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'modified':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case 'manual':
          comparison = a.order - b.order
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return notes
  }, [store.filteredNotes, store.viewMode])

  // Callbacks
  const handleCreateNote = useCallback(() => {
    if (newNoteTitle.trim()) {
      store.addNote({
        title: newNoteTitle.trim(),
        content: '',
        projectId: store.activeProjectId,
        folderId: store.activeFolderId,
        tags: [],
        type: 'markdown',
        hasImages: false,
        hasCode: false,
        format: 'markdown',
        preview: [],
        metadata: {
          wordCount: 0,
          lastEditedRelative: 'just now',
          hasCheckboxes: false,
          taskCount: 0,
          completedTasks: 0,
          completionPercentage: 0,
          hasAttachments: false,
          hasCode: false,
          hasLinks: false
        }
      })
      setNewNoteTitle('')
      setIsCreatingNote(false)
      announceToScreenReader('New note created')
    }
  }, [newNoteTitle, store])

  const handleDeleteSelected = useCallback(async () => {
    const count = selectedCount
    if (count > 0 && window.confirm(`Delete ${count} selected note${count > 1 ? 's' : ''}?`)) {
      await store.deleteNotes(Array.from(store.selectedNoteIds))
      announceToScreenReader(`${count} note${count > 1 ? 's' : ''} deleted`)
    }
  }, [selectedCount, store])

  const handleNoteClick = useCallback((noteId: string) => {
    store.setActiveNote(noteId)
    announceToScreenReader('Note selected')
  }, [store])

  const handleToggleSelection = useCallback((noteId: string) => {
    store.toggleNoteSelection(noteId)
    const isSelected = store.selectedNoteIds.has(noteId)
    announceToScreenReader(isSelected ? 'Note deselected' : 'Note selected')
  }, [store])

  const handleToggleFavorite = useCallback((noteId: string) => {
    store.toggleFavorite(noteId)
    const isFavorite = store.favoriteNoteIds.has(noteId)
    announceToScreenReader(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }, [store])

  const handleSelectAll = useCallback(() => {
    store.selectAll()
    announceToScreenReader(`All ${sortedNotes.length} notes selected`)
  }, [store, sortedNotes.length])

  const handleClearSelection = useCallback(() => {
    store.clearSelection()
    announceToScreenReader('Selection cleared')
  }, [store])

  const startCreatingNote = useCallback(() => {
    setIsCreatingNote(true)
    setNewNoteTitle('')
  }, [])

  const cancelCreatingNote = useCallback(() => {
    setIsCreatingNote(false)
    setNewNoteTitle('')
  }, [])

  return {
    // State
    notes: sortedNotes,
    selectedCount,
    isCreatingNote,
    newNoteTitle,
    
    // Store values
    projects: store.projects,
    activeNoteId: store.activeNoteId,
    activeProjectId: store.activeProjectId,
    activeFolderId: store.activeFolderId,
    selectedNoteIds: store.selectedNoteIds,
    favoriteNoteIds: store.favoriteNoteIds,
    viewMode: store.viewMode,
    
    // Actions
    setNewNoteTitle,
    setViewMode: store.setViewMode,
    handleCreateNote,
    handleDeleteSelected,
    handleNoteClick,
    handleToggleSelection,
    handleToggleFavorite,
    handleSelectAll,
    handleClearSelection,
    startCreatingNote,
    cancelCreatingNote
  }
} 