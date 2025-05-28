import { renderHook, act } from '@testing-library/react'
import { useStore } from '../useStore'
import { vi } from 'vitest'

// Mock Firebase operations
vi.mock('../../services/firebaseNotes', () => ({
  saveNote: vi.fn().mockResolvedValue(undefined),
  loadNotes: vi.fn().mockResolvedValue([]),
  deleteNoteFromFirebase: vi.fn().mockResolvedValue(undefined),
  deleteMultipleNotesFromFirebase: vi.fn().mockResolvedValue(undefined),
  saveProject: vi.fn().mockResolvedValue(undefined),
  loadProjects: vi.fn().mockResolvedValue([]),
  deleteProjectFromFirebase: vi.fn().mockResolvedValue(undefined),
  saveFolder: vi.fn().mockResolvedValue(undefined),
  loadFolders: vi.fn().mockResolvedValue([]),
  deleteFolderFromFirebase: vi.fn().mockResolvedValue(undefined),
  saveTag: vi.fn().mockResolvedValue(undefined),
  loadTags: vi.fn().mockResolvedValue([]),
  deleteTagFromFirebase: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../services/firebaseBatch', () => ({
  batchSave: vi.fn(),
}))

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
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
      viewMode: { type: 'list', sortBy: 'modified', sortOrder: 'desc' },
      isCommandPaletteOpen: false,
      expandedFolders: new Set(),
      quickAccessView: 'all',
      favoriteNoteIds: new Set(),
      isLoading: false
    })
  })

  describe('Note Operations', () => {
    it('should add a new note', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addNote({
          title: 'Test Note',
          content: 'Test content',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      expect(result.current.notes).toHaveLength(1)
      expect(result.current.notes[0].title).toBe('Test Note')
      expect(result.current.activeNoteId).toBe(result.current.notes[0].id)
    })

    it('should update an existing note', () => {
      const { result } = renderHook(() => useStore())
      
      // First add a note
      act(() => {
        result.current.addNote({
          title: 'Original Title',
          content: 'Original content',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      const noteId = result.current.notes[0].id

      // Update the note
      act(() => {
        result.current.updateNote(noteId, {
          title: 'Updated Title',
          content: 'Updated content'
        })
      })

      expect(result.current.notes[0].title).toBe('Updated Title')
      expect(result.current.notes[0].content).toBe('Updated content')
    })

    it('should delete a note', () => {
      const { result } = renderHook(() => useStore())
      
      // Add a note
      act(() => {
        result.current.addNote({
          title: 'To Delete',
          content: 'Will be deleted',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 3,
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
      })

      const noteId = result.current.notes[0].id

      // Delete the note
      act(() => {
        result.current.deleteNote(noteId)
      })

      expect(result.current.notes).toHaveLength(0)
      expect(result.current.activeNoteId).toBeNull()
    })

    it('should toggle note selection', () => {
      const { result } = renderHook(() => useStore())
      
      // Add notes
      act(() => {
        result.current.addNote({
          title: 'Note 1',
          content: 'Content 1',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      const noteId = result.current.notes[0].id

      // Toggle selection
      act(() => {
        result.current.toggleNoteSelection(noteId)
      })

      expect(result.current.selectedNoteIds.has(noteId)).toBe(true)

      // Toggle again to deselect
      act(() => {
        result.current.toggleNoteSelection(noteId)
      })

      expect(result.current.selectedNoteIds.has(noteId)).toBe(false)
    })
  })

  describe('Project Operations', () => {
    it('should add a new project', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addProject({
          name: 'Test Project',
          color: '#007AFF',
          icon: '📁',
          description: 'Test description'
        })
      })

      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0].name).toBe('Test Project')
    })

    it('should update a project', () => {
      const { result } = renderHook(() => useStore())
      
      // Add project
      act(() => {
        result.current.addProject({
          name: 'Original Project',
          color: '#007AFF'
        })
      })

      const projectId = result.current.projects[0].id

      // Update project
      act(() => {
        result.current.updateProject(projectId, {
          name: 'Updated Project',
          color: '#FF0000'
        })
      })

      expect(result.current.projects[0].name).toBe('Updated Project')
      expect(result.current.projects[0].color).toBe('#FF0000')
    })

    it('should delete a project and unassign notes', () => {
      const { result } = renderHook(() => useStore())
      
      // Add project
      act(() => {
        result.current.addProject({
          name: 'Project to Delete',
          color: '#007AFF'
        })
      })

      const projectId = result.current.projects[0].id

      // Add note to project
      act(() => {
        result.current.addNote({
          title: 'Project Note',
          content: 'In project',
          projectId: projectId,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      // Delete project
      act(() => {
        result.current.deleteProject(projectId)
      })

      expect(result.current.projects).toHaveLength(0)
      expect(result.current.notes[0].projectId).toBeNull()
    })
  })

  describe('Computed Values', () => {
    it('should filter notes correctly', () => {
      const { result } = renderHook(() => useStore())
      
      // Add notes
      act(() => {
        result.current.addNote({
          title: 'React Note',
          content: 'About React',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
        
        result.current.addNote({
          title: 'Vue Note',
          content: 'About Vue',
          projectId: null,
          folderId: null,
          tags: [],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      // Set search query
      act(() => {
        result.current.setSearchQuery('React')
      })

      const filtered = result.current.filteredNotes()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('React Note')
    })

    it('should get recent notes', () => {
      const { result } = renderHook(() => useStore())
      
      // Add notes with different dates
      act(() => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 10)
        
        result.current.notes = [
          {
            id: '1',
            title: 'Old Note',
            content: 'Old content',
            projectId: null,
            folderId: null,
            tags: [],
            type: 'markdown',
            hasImages: false,
            hasCode: false,
            format: 'markdown',
            createdAt: oldDate,
            updatedAt: oldDate,
            order: 0,
            preview: [],
            metadata: {
              wordCount: 2,
              lastEditedRelative: '10 days ago',
              hasCheckboxes: false,
              taskCount: 0,
              completedTasks: 0,
              completionPercentage: 0,
              hasAttachments: false,
              hasCode: false,
              hasLinks: false
            }
          },
          {
            id: '2',
            title: 'Recent Note',
            content: 'Recent content',
            projectId: null,
            folderId: null,
            tags: [],
            type: 'markdown',
            hasImages: false,
            hasCode: false,
            format: 'markdown',
            createdAt: new Date(),
            updatedAt: new Date(),
            order: 0,
            preview: [],
            metadata: {
              wordCount: 2,
              lastEditedRelative: 'just now',
              hasCheckboxes: false,
              taskCount: 0,
              completedTasks: 0,
              completionPercentage: 0,
              hasAttachments: false,
              hasCode: false,
              hasLinks: false
            }
          }
        ]
      })

      const recent = result.current.recentNotes()
      expect(recent).toHaveLength(2)
      expect(recent[0].title).toBe('Recent Note') // Most recent first
    })
  })

  describe('Tag Operations', () => {
    it('should add a new tag', () => {
      const { result } = renderHook(() => useStore())
      
      act(() => {
        result.current.addTag('important')
      })

      expect(result.current.tags).toHaveLength(1)
      expect(result.current.tags[0].name).toBe('important')
    })

    it('should merge tags', () => {
      const { result } = renderHook(() => useStore())
      
      // Add tags
      let fromTag: any
      let toTag: any
      
      act(() => {
        fromTag = result.current.addTag('urgent')
        toTag = result.current.addTag('important')
      })

      // Add note with fromTag
      act(() => {
        result.current.addNote({
          title: 'Tagged Note',
          content: 'Has tag',
          projectId: null,
          folderId: null,
          tags: [fromTag.id],
          type: 'markdown',
          hasImages: false,
          hasCode: false,
          format: 'markdown',
          preview: [],
          metadata: {
            wordCount: 2,
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
      })

      // Merge tags
      act(() => {
        result.current.mergeTag(fromTag.id, toTag.id)
      })

      expect(result.current.tags).toHaveLength(1)
      expect(result.current.tags[0].id).toBe(toTag.id)
      expect(result.current.notes[0].tags).toContain(toTag.id)
      expect(result.current.notes[0].tags).not.toContain(fromTag.id)
    })
  })
}) 