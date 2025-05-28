import { create } from 'zustand'
import { Tag, Folder, ViewMode, SearchFilter, ContentFormat } from '../types/editor'
import { parseNotePreview, calculateNoteMetadata } from '../utils/notePreviewParser'

// Error handling utility
const handleAsyncError = (operation: string, error: unknown) => {
  console.error(`Failed to ${operation}:`, error)
  // In a real app, you might want to send this to an error reporting service
}

export interface PreviewBlock {
  type: 'text' | 'checklist' | 'code' | 'list' | 'link';
  content?: string;
  completed?: number;
  total?: number;
  language?: string;
  preview?: string;
  items?: number;
  url?: string;
}

export interface Note {
  id: string
  title: string
  titleColor?: string
  content: string
  projectId: string | null
  folderId: string | null
  tags: string[]
  type: 'markdown' | 'richtext'
  hasImages: boolean
  hasCode: boolean
  format: ContentFormat
  createdAt: Date
  updatedAt: Date
  order: number
  preview: PreviewBlock[]
  metadata: {
    wordCount: number
    lastEditedRelative: string
    hasCheckboxes: boolean
    taskCount: number
    completedTasks: number
    completionPercentage: number
    hasAttachments: boolean
    hasCode: boolean
    hasLinks: boolean
  }
}

export interface Project {
  id: string
  name: string
  color?: string
  icon?: string
  description?: string
  createdAt: Date
  updatedAt: Date
  order: number
}

interface StoreState {
  notes: Note[]
  projects: Project[]
  folders: Folder[]
  tags: Tag[]
  activeNoteId: string | null
  activeProjectId: string | null
  activeFolderId: string | null
  selectedNoteIds: Set<string>
  searchQuery: string
  searchFilters: SearchFilter
  viewMode: ViewMode
  isCommandPaletteOpen: boolean
  expandedFolders: Set<string>
  quickAccessView: 'all' | 'recent' | 'favorites'
  favoriteNoteIds: Set<string>
  isLoading: boolean
  
  // Actions
  loadDataFromFirebase: () => Promise<void>
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  deleteNotes: (ids: string[]) => Promise<void>
  setActiveNote: (id: string | null) => void
  toggleNoteSelection: (id: string) => void
  clearSelection: () => void
  selectAll: () => void
  
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  reorderProjects: (startIndex: number, endIndex: number) => Promise<void>
  
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'lastModified' | 'noteCount' | 'order'>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setActiveFolder: (id: string | null) => void
  toggleFolderExpansion: (id: string) => void
  reorderFolders: (projectId: string, startIndex: number, endIndex: number) => void
  
  addTag: (name: string) => Tag
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  mergeTag: (fromId: string, toId: string) => void
  
  setSearchQuery: (query: string) => void
  setSearchFilters: (filters: SearchFilter) => void
  setViewMode: (mode: ViewMode) => void
  setCommandPaletteOpen: (open: boolean) => void
  setQuickAccessView: (view: 'all' | 'recent' | 'favorites') => void
  toggleFavorite: (noteId: string) => void
  permanentlyDeleteNote: (noteId: string) => void
  permanentlyDeleteNotes: (noteIds: string[]) => void
  
  // Computed
  filteredNotes: () => Note[]
  activeNote: () => Note | undefined
  getFoldersByProject: (projectId: string) => Folder[]
  getNotesByFolder: (folderId: string) => Note[]
  getProjectNoteCount: (projectId: string) => number
  recentNotes: () => Note[]
  favoriteNotes: () => Note[]
  searchResults: (query: string) => { notes: Note[]; projects: Project[]; tags: Tag[] }
}

// Comprehensive color palette for tags
export const tagColorPalette = [
  'from-blue-400 to-blue-600',
  'from-blue-500 to-blue-700',
  'from-pink-400 to-pink-600',
  'from-emerald-400 to-emerald-600',
  'from-orange-400 to-orange-600',
  'from-red-400 to-red-600',
  'from-yellow-400 to-yellow-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-gray-400 to-gray-600',
  'from-purple-400 to-purple-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
  'from-lime-400 to-lime-600',
  'from-amber-400 to-amber-600',
  'from-violet-400 to-violet-600',
  'from-fuchsia-400 to-fuchsia-600',
  'from-sky-400 to-sky-600',
  'from-green-400 to-green-600',
  'from-slate-400 to-slate-600',
  'from-zinc-400 to-zinc-600',
  'from-stone-400 to-stone-600',
  'from-neutral-400 to-neutral-600',
  'from-red-500 to-red-700',
  'from-orange-500 to-orange-700',
  'from-amber-500 to-amber-700',
  'from-yellow-500 to-yellow-700',
  'from-lime-500 to-lime-700',
  'from-green-500 to-green-700',
  'from-emerald-500 to-emerald-700',
  'from-teal-500 to-teal-700',
  'from-cyan-500 to-cyan-700',
  'from-sky-500 to-sky-700',
  'from-blue-600 to-blue-800',
  'from-indigo-500 to-indigo-700',
  'from-violet-500 to-violet-700',
  'from-purple-500 to-purple-700',
  'from-fuchsia-500 to-fuchsia-700',
  'from-pink-500 to-pink-700',
  'from-rose-500 to-rose-700',
]

// Helper function to get the next available color
export const getNextAvailableColor = (existingTags: Tag[]): string => {
  // Get all colors currently in use
  const usedColors = new Set(existingTags.map(tag => tag.color))
  
  // Find the first color that's not in use
  for (const color of tagColorPalette) {
    if (!usedColors.has(color)) {
      return color
    }
  }
  
  // If all colors are used (unlikely with 40+ colors), cycle back to the beginning
  // but try to find the least used color
  const colorUsageCount = new Map<string, number>()
  
  // Initialize all colors with 0 count
  tagColorPalette.forEach(color => colorUsageCount.set(color, 0))
  
  // Count usage of each color
  existingTags.forEach(tag => {
    const count = colorUsageCount.get(tag.color) || 0
    colorUsageCount.set(tag.color, count + 1)
  })
  
  // Find the color with minimum usage
  let minUsage = Infinity
  let leastUsedColor = tagColorPalette[0]
  
  colorUsageCount.forEach((count, color) => {
    if (count < minUsage) {
      minUsage = count
      leastUsedColor = color
    }
  })
  
  return leastUsedColor
}

// Import Firebase operations
import { 
  saveNote, 
  loadNotes, 
  deleteNoteFromFirebase,
  deleteMultipleNotesFromFirebase,
  saveProject,
  loadProjects,
  deleteProjectFromFirebase,
  saveFolder,
  loadFolders,
  deleteFolderFromFirebase,
  saveTag,
  loadTags,
  deleteTagFromFirebase
} from '../services/firebaseNotes';

// Import batching service
import { batchSave } from '../services/firebaseBatch';

export const useStore = create<StoreState>((set, get) => ({
  notes: [],
  projects: [],
  folders: [],
  tags: [],
  activeNoteId: null,
  activeProjectId: null,
  activeFolderId: null,
  selectedNoteIds: new Set(),
  searchQuery: '',
  searchFilters: {},
  viewMode: { type: 'list', sortBy: 'modified', sortOrder: 'desc' } as ViewMode,
  isCommandPaletteOpen: false,
  expandedFolders: new Set(),
  quickAccessView: 'all',
  favoriteNoteIds: new Set(),
  isLoading: false,
  
  loadDataFromFirebase: async () => {
    set({ isLoading: true })
    
    try {
      // Load all data in parallel with timeout
      const loadPromises = [
        loadNotes(),
        loadProjects(),
        loadFolders(),
        loadTags()
      ]
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Load timeout')), 30000)
      )
      
      const [notes, projects, folders, tags] = await Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]) as [any[], any[], any[], any[]]
      
      set({
        notes,
        projects,
        folders,
        tags,
        isLoading: false
      })
      
      console.log('Data loaded from Firebase:', {
        notes: notes.length,
        projects: projects.length,
        folders: folders.length,
        tags: tags.length
      })
    } catch (error) {
      handleAsyncError('load data from Firebase', error)
      set({ isLoading: false })
      throw error // Re-throw so calling code can handle it
    }
  },
  
  addNote: async (noteData) => {
    const createdAt = new Date()
    const preview = noteData.content ? parseNotePreview(noteData.content) : []
    const metadata = noteData.content 
      ? calculateNoteMetadata(noteData.content, createdAt)
      : {
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
    
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt,
      updatedAt: createdAt,
      order: 0,
      preview,
      metadata
    }
    
    // Update local state immediately
    set((state) => ({
      notes: [...state.notes, newNote],
      activeNoteId: newNote.id,
    }))
    
    // Save to Firebase using batch
    batchSave('notes', newNote.id, newNote)
  },
  
  updateNote: async (id, updates) => {
    // Only update timestamp and metadata when content is actually changed
    if (updates.content !== undefined) {
      const currentNote = get().notes.find(n => n.id === id)
      if (currentNote) {
        const updatedAt = new Date()
        updates.preview = parseNotePreview(updates.content)
        updates.metadata = calculateNoteMetadata(updates.content, updatedAt)
        updates.updatedAt = updatedAt // Only update timestamp when content changes
      }
    }
    
    // Update local state immediately
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates }
          : note
      ),
    }))
    
    // Save to Firebase using batch
    const updatedNote = get().notes.find(n => n.id === id)
    if (updatedNote) {
      batchSave('notes', updatedNote.id, updatedNote)
    }
  },
  
  deleteNote: async (id) => {
    // Update local state immediately
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
    }))
    
    // Delete from Firebase
    try {
      await deleteNoteFromFirebase(id)
    } catch (error) {
      console.error('Failed to delete note from Firebase:', error)
    }
  },
  
  deleteNotes: async (ids) => {
    // Update local state immediately
    set((state) => ({
      notes: state.notes.filter((note) => !ids.includes(note.id)),
      selectedNoteIds: new Set(Array.from(state.selectedNoteIds).filter((id: string) => !ids.includes(id))),
    }))
    
    // Delete from Firebase
    try {
      await deleteMultipleNotesFromFirebase(ids)
    } catch (error) {
      console.error('Failed to delete notes from Firebase:', error)
    }
  },
  
  setActiveNote: (id) => {
    set({ activeNoteId: id })
  },
  
  toggleNoteSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedNoteIds)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return { selectedNoteIds: newSelected }
    })
  },
  
  clearSelection: () => {
    set({ selectedNoteIds: new Set() })
  },
  
  selectAll: () => {
    set((state) => ({
      selectedNoteIds: new Set(state.filteredNotes().map(note => note.id))
    }))
  },
  
  addProject: async (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
    }
    
    // Update local state immediately
    set((state) => ({ projects: [...state.projects, newProject] }))
    
    // Save to Firebase
    try {
      await saveProject(newProject)
    } catch (error) {
      console.error('Failed to save project to Firebase:', error)
    }
  },
  
  updateProject: async (id, updates) => {
    // Update local state immediately
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
      ),
    }))
    
    // Save to Firebase
    const updatedProject = get().projects.find(p => p.id === id)
    if (updatedProject) {
      try {
        await saveProject(updatedProject)
      } catch (error) {
        console.error('Failed to update project in Firebase:', error)
      }
    }
  },
  
  deleteProject: async (id) => {
    // Update local state immediately
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      notes: state.notes.map((note) =>
        note.projectId === id ? { ...note, projectId: null } : note
      ),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }))
    
    // Delete from Firebase
    try {
      await deleteProjectFromFirebase(id)
    } catch (error) {
      console.error('Failed to delete project from Firebase:', error)
    }
  },
  
  setActiveProject: (id) => {
    set({ activeProjectId: id })
  },
  
  reorderProjects: async (startIndex, endIndex) => {
    set((state) => {
      const projects = Array.from(state.projects)
      const [removed] = projects.splice(startIndex, 1)
      projects.splice(endIndex, 0, removed)
      
      // Update order property
      const updatedProjects = projects.map((project, index) => ({
        ...project,
        order: index
      }))
      
      return { projects: updatedProjects }
    })
    
    // Save updated projects to Firebase
    const { projects } = get()
    try {
      await Promise.all(projects.map(project => saveProject(project)))
    } catch (error) {
      console.error('Failed to save project order to Firebase:', error)
    }
  },
  
  addFolder: async (folderData) => {
    const newFolder: Folder = {
      ...folderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastModified: new Date(),
      noteCount: 0,
      order: 0,
    }
    
    // Update local state immediately
    set((state) => ({ folders: [...state.folders, newFolder] }))
    
    // Save to Firebase
    try {
      await saveFolder(newFolder)
    } catch (error) {
      console.error('Failed to save folder to Firebase:', error)
    }
  },
  
  updateFolder: async (id, updates) => {
    // Update local state immediately
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates, lastModified: new Date() } : folder
      ),
    }))
    
    // Save to Firebase
    const updatedFolder = get().folders.find(f => f.id === id)
    if (updatedFolder) {
      try {
        await saveFolder(updatedFolder)
      } catch (error) {
        console.error('Failed to update folder in Firebase:', error)
      }
    }
  },
  
  deleteFolder: async (id) => {
    // Update local state immediately
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      notes: state.notes.map((note) =>
        note.folderId === id ? { ...note, folderId: null } : note
      ),
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    }))
    
    // Update notes that were in this folder
    const notesToUpdate = get().notes.filter(note => note.folderId === null && note.projectId)
    try {
      await Promise.all([
        deleteFolderFromFirebase(id),
        ...notesToUpdate.map(note => saveNote(note))
      ])
    } catch (error) {
      console.error('Failed to delete folder from Firebase:', error)
    }
  },
  
  setActiveFolder: (id) => {
    set({ activeFolderId: id })
  },
  
  toggleFolderExpansion: (id) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return { expandedFolders: newExpanded }
    })
  },
  
  reorderFolders: (projectId, _startIndex, endIndex) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === projectId ? { ...folder, order: endIndex } : folder
      ),
    }))
  },
  
  addTag: (name) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name,
      color: getNextAvailableColor(get().tags),
      createdAt: new Date(),
      usageCount: 0,
    }
    
    // Update local state immediately
    set((state) => ({ tags: [...state.tags, newTag] }))
    
    // Save to Firebase asynchronously
    saveTag(newTag).catch(error => {
      console.error('Failed to save tag to Firebase:', error)
    })
    
    return newTag
  },
  
  updateTag: async (id, updates) => {
    // Update local state immediately
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }))
    
    // Save to Firebase
    const updatedTag = get().tags.find(t => t.id === id)
    if (updatedTag) {
      try {
        await saveTag(updatedTag)
      } catch (error) {
        console.error('Failed to update tag in Firebase:', error)
      }
    }
  },
  
  deleteTag: async (id) => {
    // Update local state immediately
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    }))
    
    // Delete from Firebase
    try {
      await deleteTagFromFirebase(id)
    } catch (error) {
      console.error('Failed to delete tag from Firebase:', error)
    }
  },
  
  mergeTag: (fromId, toId) => {
    set((state) => ({
      // Remove the fromTag and update notes to use toTag
      tags: state.tags.filter((tag) => tag.id !== fromId),
      notes: state.notes.map((note) => ({
        ...note,
        tags: note.tags.map((tagId) => tagId === fromId ? toId : tagId)
      }))
    }))
    
    // Delete the merged tag from Firebase
    deleteTagFromFirebase(fromId).catch(error => {
      console.error('Failed to delete merged tag from Firebase:', error)
    })
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
  
  setSearchFilters: (filters) => {
    set({ searchFilters: filters })
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode })
  },
  
  setCommandPaletteOpen: (open) => {
    set({ isCommandPaletteOpen: open })
  },
  
  setQuickAccessView: (view) => {
    set({ quickAccessView: view })
  },
  
  toggleFavorite: (noteId) => {
    set((state) => {
      const newFavorites = new Set(state.favoriteNoteIds)
      if (newFavorites.has(noteId)) {
        newFavorites.delete(noteId)
      } else {
        newFavorites.add(noteId)
      }
      return { favoriteNoteIds: newFavorites }
    })
  },

  permanentlyDeleteNote: async (noteId) => {
    // Update local state immediately
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
      activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId,
      favoriteNoteIds: new Set(Array.from(state.favoriteNoteIds).filter(id => id !== noteId)),
    }))

    // Delete from Firebase
    try {
      await deleteNoteFromFirebase(noteId)
    } catch (error) {
      console.error('Failed to permanently delete note from Firebase:', error)
    }
  },

  permanentlyDeleteNotes: async (noteIds) => {
    // Update local state immediately
    set((state) => ({
      notes: state.notes.filter((note) => !noteIds.includes(note.id)),
      selectedNoteIds: new Set(),
      activeNoteId: noteIds.includes(state.activeNoteId || '') ? null : state.activeNoteId,
      favoriteNoteIds: new Set(Array.from(state.favoriteNoteIds).filter(id => !noteIds.includes(id))),
    }))

    // Delete from Firebase
    try {
      await Promise.all(noteIds.map(id => deleteNoteFromFirebase(id)))
    } catch (error) {
      console.error('Failed to permanently delete notes from Firebase:', error)
    }
  },
  
  filteredNotes: () => {
    const { notes, searchQuery, activeProjectId, quickAccessView, favoriteNoteIds, activeFolderId, searchFilters, viewMode, tags } = get()
    let filtered = [...notes] // Create a copy to avoid mutating the original array
    
    // Filter by quick access view
    if (quickAccessView === 'recent') {
      filtered = [...notes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10)
    } else if (quickAccessView === 'favorites') {
      filtered = notes.filter(note => favoriteNoteIds.has(note.id))
    }
    
    // Filter by project or folder (only for non-favorites views)
    if (quickAccessView !== 'favorites' && quickAccessView !== 'recent') {
      if (activeProjectId) {
        filtered = filtered.filter((note) => note.projectId === activeProjectId)
      }
      
      if (activeFolderId) {
        filtered = filtered.filter((note) => note.folderId === activeFolderId)
      }
    }
    
    // Filter by tags
    if (searchFilters.tags && searchFilters.tags.length > 0) {
      filtered = filtered.filter(note => 
        searchFilters.tags!.some(tagId => note.tags.includes(tagId))
      )
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (note) => {
          // Check title and content
          const titleMatch = note.title.toLowerCase().includes(query)
          const contentMatch = note.content.toLowerCase().includes(query)
          
          // Check if any of the note's tags match the query
          const tagMatch = note.tags.some(tagId => {
            const tag = tags.find(t => t.id === tagId)
            return tag && tag.name.toLowerCase().includes(query)
          })
          
          return titleMatch || contentMatch || tagMatch
        }
      )
    }
    
    // Apply sorting based on viewMode
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (viewMode.sortBy) {
        case 'modified':
          // For dates, we want newest first by default (descending)
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case 'created':
          // For dates, we want newest first by default (descending)
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'title': {
          // Handle empty titles and compare full titles
          const titleA = (a.title || 'Untitled').toLowerCase()
          const titleB = (b.title || 'Untitled').toLowerCase()
          comparison = titleA.localeCompare(titleB)
          break
        }
        case 'manual':
          comparison = a.order - b.order
          break
        default:
          // Default to newest first
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
      }
      
      // Apply sort order
      // For ascending: return comparison as-is
      // For descending: return negated comparison
      return viewMode.sortOrder === 'asc' ? comparison : -comparison;
    })
    
    return sorted;
  },
  
  activeNote: () => {
    const { notes, activeNoteId } = get()
    return notes.find((note) => note.id === activeNoteId)
  },
  
  getFoldersByProject: (projectId) => {
    const { folders } = get()
    return folders.filter((folder) => folder.projectId === projectId)
  },
  
    getNotesByFolder: (folderId) => {
    const { notes } = get()
    return notes.filter((note) => note.folderId === folderId)
  },

  getProjectNoteCount: (projectId) => {
    const { notes } = get()
    return notes.filter((note) => note.projectId === projectId).length
  },

  recentNotes: () => {
    const { notes } = get()
    return [...notes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10)
  },
  
  favoriteNotes: () => {
    const { notes, favoriteNoteIds } = get()
    return notes.filter(note => favoriteNoteIds.has(note.id))
  },
  
  searchResults: (query) => {
    const { notes, projects, tags } = get()
    const results = {
      notes: notes.filter((note) => {
        const lowerQuery = query.toLowerCase()
        
        // Check title and content
        const titleMatch = note.title.toLowerCase().includes(lowerQuery)
        const contentMatch = note.content.toLowerCase().includes(lowerQuery)
        
        // Check if any of the note's tags match the query
        const tagMatch = note.tags.some(tagId => {
          const tag = tags.find(t => t.id === tagId)
          return tag && tag.name.toLowerCase().includes(lowerQuery)
        })
        
        return titleMatch || contentMatch || tagMatch
      }),
      projects: projects.filter((project) => {
        const lowerQuery = query.toLowerCase()
        const nameMatch = project.name.toLowerCase().includes(lowerQuery)
        const descriptionMatch = project.description?.toLowerCase().includes(lowerQuery) || false
        return nameMatch || descriptionMatch
      }),
      tags: tags.filter((tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase())
      ),
    }
    return results
  },
}))

// Migration function to generate preview data for existing notes
export async function migrateExistingNotes() {
  const { notes, updateNote } = useStore.getState()
  
  for (const note of notes) {
    if (!note.preview || !note.metadata) {
      await updateNote(note.id, {
        content: note.content // This will trigger preview generation
      })
    }
  }
}

// Expose store for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).__CLARITY_STORE__ = useStore;
} 