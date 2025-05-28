import { Note, Project } from '../../store/useStore'
import { Folder, Tag } from '../../types/editor'

/**
 * Interface for note-related operations
 */
export interface INoteService {
  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>
  update(id: string, data: Partial<Note>): Promise<Note>
  delete(id: string): Promise<void>
  deleteMultiple(ids: string[]): Promise<void>
  getAll(): Promise<Note[]>
  getById(id: string): Promise<Note | null>
  getByProject(projectId: string): Promise<Note[]>
  getByFolder(folderId: string): Promise<Note[]>
  search(query: string): Promise<Note[]>
}

/**
 * Interface for project-related operations
 */
export interface IProjectService {
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>
  update(id: string, data: Partial<Project>): Promise<Project>
  delete(id: string): Promise<void>
  getAll(): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  reorder(projects: Project[]): Promise<void>
}

/**
 * Interface for folder-related operations
 */
export interface IFolderService {
  create(folder: Omit<Folder, 'id' | 'createdAt' | 'lastModified'>): Promise<Folder>
  update(id: string, data: Partial<Folder>): Promise<Folder>
  delete(id: string): Promise<void>
  getAll(): Promise<Folder[]>
  getById(id: string): Promise<Folder | null>
  getByProject(projectId: string): Promise<Folder[]>
  move(folderId: string, newParentId: string | null): Promise<void>
}

/**
 * Interface for tag-related operations
 */
export interface ITagService {
  create(name: string): Promise<Tag>
  update(id: string, data: Partial<Tag>): Promise<Tag>
  delete(id: string): Promise<void>
  getAll(): Promise<Tag[]>
  getById(id: string): Promise<Tag | null>
  merge(fromId: string, toId: string): Promise<void>
  getUsageCount(id: string): Promise<number>
}

/**
 * Interface for authentication operations
 */
export interface IAuthService {
  signIn(): Promise<void>
  signOut(): Promise<void>
  getCurrentUser(): Promise<{ uid: string; email: string | null } | null>
  onAuthStateChanged(callback: (user: any) => void): () => void
}

/**
 * Interface for storage operations
 */
export interface IStorageService {
  uploadImage(file: File, path: string): Promise<string>
  deleteImage(url: string): Promise<void>
  getDownloadUrl(path: string): Promise<string>
}

/**
 * Main service registry interface
 */
export interface IServiceRegistry {
  notes: INoteService
  projects: IProjectService
  folders: IFolderService
  tags: ITagService
  auth: IAuthService
  storage: IStorageService
} 