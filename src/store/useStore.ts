import { create } from 'zustand'
import { Tag, Folder, ViewMode, SearchFilter, ContentFormat } from '../types/editor'

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
  deleteNotes: (ids: string[]) => void
  setActiveNote: (id: string | null) => void
  toggleNoteSelection: (id: string) => void
  clearSelection: () => void
  selectAll: () => void
  
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  reorderProjects: (startIndex: number, endIndex: number) => void
  
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'lastModified' | 'noteCount' | 'order'>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  setActiveFolder: (id: string | null) => void
  toggleFolderExpansion: (id: string) => void
  reorderFolders: (projectId: string, startIndex: number, endIndex: number) => void
  
  addTag: (name: string) => Tag
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  mergeTag: (fromId: string, toId: string) => void
  
  setSearchQuery: (query: string) => void
  setSearchFilters: (filters: SearchFilter) => void
  setViewMode: (mode: ViewMode) => void
  setCommandPaletteOpen: (open: boolean) => void
  setQuickAccessView: (view: 'all' | 'recent' | 'favorites') => void
  toggleFavorite: (noteId: string) => void
  
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

// Helper function to generate a color based on tag name
const generateTagColor = (name: string): string => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-emerald-400 to-emerald-600',
    'from-orange-400 to-orange-600',
    'from-red-400 to-red-600',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Import Firebase operations
import { 
  saveNote, 
  loadNotes, 
  deleteNoteFromFirebase,
  saveProject,
  loadProjects,
  deleteProjectFromFirebase,
  saveFolder,
  loadFolders,
  saveTag,
  loadTags
} from '../services/firebaseNotes';

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
      // Load all data in parallel
      const [notes, projects, folders, tags] = await Promise.all([
        loadNotes(),
        loadProjects(),
        loadFolders(),
        loadTags()
      ])
      
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
      console.error('Failed to load data from Firebase:', error)
      set({ isLoading: false })
    }
  },
  
  addNote: async (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
    }
    
    // Update local state immediately
    set((state) => ({
      notes: [...state.notes, newNote],
      activeNoteId: newNote.id,
    }))
    
    // Save to Firebase
    try {
      await saveNote(newNote)
    } catch (error) {
      console.error('Failed to save note to Firebase:', error)
    }
  },
  
  updateNote: async (id, updates) => {
    // Update local state immediately
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }))
    
    // Save to Firebase
    const updatedNote = get().notes.find(n => n.id === id)
    if (updatedNote) {
      try {
        await saveNote(updatedNote)
      } catch (error) {
        console.error('Failed to update note in Firebase:', error)
      }
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
  
  deleteNotes: (ids) => {
    set((state) => ({
      notes: state.notes.filter((note) => !ids.includes(note.id)),
      selectedNoteIds: new Set(Array.from(state.selectedNoteIds).filter((id: string) => !ids.includes(id))),
    }))
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
  
  reorderProjects: (startIndex, endIndex) => {
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
  
  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }))
  },
  
  deleteFolder: (id) => {
    set((state) => ({
      folders: state.folders.filter((folder) => folder.id !== id),
      notes: state.notes.map((note) =>
        note.folderId === id ? { ...note, folderId: null } : note
      ),
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    }))
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
      color: generateTagColor(name),
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
  
  updateTag: (id, updates) => {
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }))
  },
  
  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    }))
  },
  
  mergeTag: (fromId, toId) => {
    set((state) => ({
      tags: state.tags.map((tag) =>
        tag.id === fromId ? { ...tag, id: toId } : tag
      ),
    }))
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
  
  filteredNotes: () => {
    const { notes, searchQuery, activeProjectId, quickAccessView, favoriteNoteIds, activeFolderId, searchFilters } = get()
    let filtered = notes
    
    // Filter by quick access view
    if (quickAccessView === 'recent') {
      filtered = notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10)
    } else if (quickAccessView === 'favorites') {
      filtered = filtered.filter(note => favoriteNoteIds.has(note.id))
    }
    
    // Filter by project or folder
    if (activeProjectId) {
      filtered = filtered.filter((note) => note.projectId === activeProjectId)
    }
    
    if (activeFolderId) {
      filtered = filtered.filter((note) => note.folderId === activeFolderId)
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
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      )
    }
    
    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
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
    return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10)
  },
  
  favoriteNotes: () => {
    const { notes, favoriteNoteIds } = get()
    return notes.filter(note => favoriteNoteIds.has(note.id))
  },
  
  searchResults: (query) => {
    const { notes, projects, tags } = get()
    const results = {
      notes: notes.filter((note) =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      ),
      projects: projects.filter((project) =>
        project.name.toLowerCase().includes(query.toLowerCase())
      ),
      tags: tags.filter((tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase())
      ),
    }
    return results
  },
})) 