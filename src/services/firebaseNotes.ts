import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
// @ts-expect-error - JavaScript module
import { db, auth } from './firebase.js';
import type { Note, Project } from '../store/useStore';
import type { Folder, Tag } from '../types/editor';

// Helper to convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date();
};

// Helper to get current user ID
const getUserId = () => {
  const user = auth?.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

// Notes operations
export const saveNote = async (note: Note): Promise<void> => {
  try {
    const userId = getUserId();
    const noteRef = doc(db, 'users', userId, 'notes', note.id);
    
    const noteData = {
      ...note,
      createdAt: note.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId
    };
    
    await setDoc(noteRef, noteData);
    console.log('Note saved to Firebase:', note.id);
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const userId = getUserId();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const notes: Note[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Note);
    });
    
    console.log('Loaded notes from Firebase:', notes.length);
    return notes;
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

export const deleteNoteFromFirebase = async (noteId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
    console.log('Note deleted from Firebase:', noteId);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Projects operations
export const saveProject = async (project: Project): Promise<void> => {
  try {
    const userId = getUserId();
    const projectRef = doc(db, 'users', userId, 'projects', project.id);
    
    const projectData = {
      ...project,
      createdAt: project.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId
    };
    
    await setDoc(projectRef, projectData);
    console.log('Project saved to Firebase:', project.id);
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const userId = getUserId();
    const projectsRef = collection(db, 'users', userId, 'projects');
    const q = query(projectsRef, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    const projects: Project[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Project);
    });
    
    console.log('Loaded projects from Firebase:', projects.length);
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

export const deleteProjectFromFirebase = async (projectId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef);
    console.log('Project deleted from Firebase:', projectId);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Folders operations
export const saveFolder = async (folder: Folder): Promise<void> => {
  try {
    const userId = getUserId();
    const folderRef = doc(db, 'users', userId, 'folders', folder.id);
    
    const folderData = {
      ...folder,
      createdAt: folder.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId
    };
    
    await setDoc(folderRef, folderData);
    console.log('Folder saved to Firebase:', folder.id);
  } catch (error) {
    console.error('Error saving folder:', error);
    throw error;
  }
};

export const loadFolders = async (): Promise<Folder[]> => {
  try {
    const userId = getUserId();
    const foldersRef = collection(db, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('name', 'asc'));
    
    const snapshot = await getDocs(q);
    const folders: Folder[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      folders.push({
        id: doc.id,
        name: data.name,
        projectId: data.projectId,
        parentId: data.parentId || null,
        icon: data.icon,
        noteCount: data.noteCount || 0,
        lastModified: timestampToDate(data.lastModified || data.updatedAt),
        createdAt: timestampToDate(data.createdAt),
        isExpanded: data.isExpanded || false,
        order: data.order || 0
      });
    });
    
    console.log('Loaded folders from Firebase:', folders.length);
    return folders;
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

// Delete folder from Firebase
export const deleteFolderFromFirebase = async (folderId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const folderRef = doc(db, 'users', userId, 'folders', folderId);
    await deleteDoc(folderRef);
    console.log('Folder deleted from Firebase:', folderId);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Tags operations
export const saveTag = async (tag: Tag): Promise<void> => {
  try {
    const userId = getUserId();
    const tagRef = doc(db, 'users', userId, 'tags', tag.id);
    
    const tagData = {
      ...tag,
      userId
    };
    
    await setDoc(tagRef, tagData);
    console.log('Tag saved to Firebase:', tag.id);
  } catch (error) {
    console.error('Error saving tag:', error);
    throw error;
  }
};

export const loadTags = async (): Promise<Tag[]> => {
  try {
    const userId = getUserId();
    const tagsRef = collection(db, 'users', userId, 'tags');
    const q = query(tagsRef, orderBy('name', 'asc'));
    
    const snapshot = await getDocs(q);
    const tags: Tag[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      tags.push({
        ...data,
        id: doc.id,
      } as Tag);
    });
    
    console.log('Loaded tags from Firebase:', tags.length);
    return tags;
  } catch (error) {
    console.error('Error loading tags:', error);
    return [];
  }
};

// Delete tag from Firebase
export const deleteTagFromFirebase = async (tagId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const tagRef = doc(db, 'users', userId, 'tags', tagId);
    await deleteDoc(tagRef);
    console.log('Tag deleted from Firebase:', tagId);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

// Batch operations
export const deleteNotesInProject = async (projectId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, where('projectId', '==', projectId));
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`Deleted all notes in project: ${projectId}`);
  } catch (error) {
    console.error('Error deleting notes in project:', error);
    throw error;
  }
};

export const deleteNotesInFolder = async (folderId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, where('folderId', '==', folderId));
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`Deleted all notes in folder: ${folderId}`);
  } catch (error) {
    console.error('Error deleting notes in folder:', error);
    throw error;
  }
};

// Batch delete multiple notes
export const deleteMultipleNotesFromFirebase = async (noteIds: string[]): Promise<void> => {
  try {
    const userId = getUserId();
    const deletePromises = noteIds.map(noteId => {
      const noteRef = doc(db, 'users', userId, 'notes', noteId);
      return deleteDoc(noteRef);
    });
    
    await Promise.all(deletePromises);
    console.log('Multiple notes deleted from Firebase:', noteIds.length);
  } catch (error) {
    console.error('Error deleting multiple notes:', error);
    throw error;
  }
}; 