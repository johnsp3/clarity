import { describe, it, expect, vi, beforeEach } from 'vitest'
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
} from '../firebaseNotes'
import { auth, db } from '../firebase'

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {}
}))

// Mock Firestore functions
const mockSetDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockDeleteDoc = vi.fn()
const mockDoc = vi.fn()
const mockCollection = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockWhere = vi.fn()
const mockServerTimestamp = vi.fn(() => ({ _seconds: Date.now() / 1000, _nanoseconds: 0 }))

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  where: (...args: any[]) => mockWhere(...args),
  serverTimestamp: () => mockServerTimestamp()
}))

describe('Firebase Notes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Note Operations', () => {
    it('should save a note to Firebase', async () => {
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        projectId: null,
        folderId: null,
        tags: [],
        type: 'markdown' as const,
        hasImages: false,
        hasCode: false,
        format: 'markdown' as const,
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

      mockDoc.mockReturnValue('doc-ref')
      mockSetDoc.mockResolvedValue(undefined)

      await saveNote(mockNote)

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'notes', 'note-1')
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
        ...mockNote,
        userId: 'test-user-id'
      }))
    })

    it('should load notes from Firebase', async () => {
      const mockSnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'note-1',
            data: () => ({
              title: 'Test Note',
              content: 'Test content',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() }
            })
          })
        })
      }

      mockCollection.mockReturnValue('collection-ref')
      mockOrderBy.mockReturnValue('order-by-ref')
      mockQuery.mockReturnValue('query-ref')
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const notes = await loadNotes()

      expect(mockCollection).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'notes')
      expect(mockQuery).toHaveBeenCalledWith('collection-ref', 'order-by-ref')
      expect(mockGetDocs).toHaveBeenCalledWith('query-ref')
      expect(notes).toHaveLength(1)
      expect(notes[0].id).toBe('note-1')
    })

    it('should delete a note from Firebase', async () => {
      mockDoc.mockReturnValue('doc-ref')
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteNoteFromFirebase('note-1')

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'notes', 'note-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
    })

    it('should delete multiple notes from Firebase', async () => {
      mockDoc.mockReturnValue('doc-ref')
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteMultipleNotesFromFirebase(['note-1', 'note-2', 'note-3'])

      expect(mockDoc).toHaveBeenCalledTimes(3)
      expect(mockDeleteDoc).toHaveBeenCalledTimes(3)
    })
  })

  describe('Project Operations', () => {
    it('should save a project to Firebase', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        color: '#007AFF',
        icon: '📁',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0
      }

      mockDoc.mockReturnValue('doc-ref')
      mockSetDoc.mockResolvedValue(undefined)

      await saveProject(mockProject)

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'projects', 'project-1')
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
        id: mockProject.id,
        name: mockProject.name,
        color: mockProject.color,
        icon: mockProject.icon,
        description: mockProject.description,
        createdAt: mockProject.createdAt,
        order: mockProject.order,
        userId: 'test-user-id',
        updatedAt: expect.anything()
      }))
    })

    it('should load projects from Firebase', async () => {
      const mockSnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'project-1',
            data: () => ({
              name: 'Test Project',
              color: '#007AFF',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() }
            })
          })
        })
      }

      mockCollection.mockReturnValue('collection-ref')
      mockOrderBy.mockReturnValue('order-by-ref')
      mockQuery.mockReturnValue('query-ref')
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const projects = await loadProjects()

      expect(mockCollection).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'projects')
      expect(projects).toHaveLength(1)
      expect(projects[0].id).toBe('project-1')
    })

    it('should delete a project from Firebase', async () => {
      mockDoc.mockReturnValue('doc-ref')
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteProjectFromFirebase('project-1')

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'projects', 'project-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
    })
  })

  describe('Folder Operations', () => {
    it('should save a folder to Firebase', async () => {
      const mockFolder = {
        id: 'folder-1',
        name: 'Test Folder',
        projectId: 'project-1',
        parentId: null,
        icon: '📁',
        noteCount: 0,
        lastModified: new Date(),
        createdAt: new Date(),
        isExpanded: false,
        order: 0
      }

      mockDoc.mockReturnValue('doc-ref')
      mockSetDoc.mockResolvedValue(undefined)

      await saveFolder(mockFolder)

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'folders', 'folder-1')
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
        ...mockFolder,
        userId: 'test-user-id'
      }))
    })

    it('should load folders from Firebase', async () => {
      const mockSnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'folder-1',
            data: () => ({
              name: 'Test Folder',
              projectId: 'project-1',
              createdAt: { toDate: () => new Date() },
              lastModified: { toDate: () => new Date() }
            })
          })
        })
      }

      mockCollection.mockReturnValue('collection-ref')
      mockOrderBy.mockReturnValue('order-by-ref')
      mockQuery.mockReturnValue('query-ref')
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const folders = await loadFolders()

      expect(mockCollection).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'folders')
      expect(folders).toHaveLength(1)
      expect(folders[0].id).toBe('folder-1')
    })

    it('should delete a folder from Firebase', async () => {
      mockDoc.mockReturnValue('doc-ref')
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteFolderFromFirebase('folder-1')

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'folders', 'folder-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
    })
  })

  describe('Tag Operations', () => {
    it('should save a tag to Firebase', async () => {
      const mockTag = {
        id: 'tag-1',
        name: 'important',
        color: 'from-blue-400 to-blue-600',
        createdAt: new Date(),
        usageCount: 0
      }

      mockDoc.mockReturnValue('doc-ref')
      mockSetDoc.mockResolvedValue(undefined)

      await saveTag(mockTag)

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'tags', 'tag-1')
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
        ...mockTag,
        userId: 'test-user-id'
      }))
    })

    it('should load tags from Firebase', async () => {
      const mockSnapshot = {
        forEach: vi.fn((callback) => {
          callback({
            id: 'tag-1',
            data: () => ({
              name: 'important',
              color: 'from-blue-400 to-blue-600',
              createdAt: new Date(),
              usageCount: 0
            })
          })
        })
      }

      mockCollection.mockReturnValue('collection-ref')
      mockOrderBy.mockReturnValue('order-by-ref')
      mockQuery.mockReturnValue('query-ref')
      mockGetDocs.mockResolvedValue(mockSnapshot)

      const tags = await loadTags()

      expect(mockCollection).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'tags')
      expect(tags).toHaveLength(1)
      expect(tags[0].id).toBe('tag-1')
    })

    it('should delete a tag from Firebase', async () => {
      mockDoc.mockReturnValue('doc-ref')
      mockDeleteDoc.mockResolvedValue(undefined)

      await deleteTagFromFirebase('tag-1')

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'test-user-id', 'tags', 'tag-1')
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref')
    })
  })

  describe('Error Handling', () => {
    it('should throw error when user is not authenticated', async () => {
      // @ts-expect-error - Testing error case
      auth.currentUser = null

      await expect(saveNote({} as any)).rejects.toThrow('User not authenticated')
    })

    it('should return empty array when loading fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Network error'))

      const notes = await loadNotes()
      expect(notes).toEqual([])
    })
  })
}) 