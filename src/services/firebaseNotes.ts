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
import { db, auth } from './firebase';
import type { Note, Project } from '../store/useStore';
import type { Folder, Tag } from '../types/editor';

import type { FirebaseTimestamp } from '../types';
import { handleFirebaseError, logSuccess } from './errorHandling'

// Helper to convert Firestore timestamp to Date
const timestampToDate = (timestamp: FirebaseTimestamp | Date | undefined): Date => {
  // Check if it's a Firebase timestamp object
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    // Convert Firebase timestamp to Date
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return date;
  }
  
  if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return date;
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If timestamp is a string or number, try to parse it
  if (timestamp && (typeof timestamp === 'string' || typeof timestamp === 'number')) {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Default to current date if no valid timestamp
  return new Date();
};

// Helper to get current user ID and check database
const getUserId = () => {
  const user = auth?.currentUser;
  if (!user) throw new Error('User not authenticated');
  if (!db) throw new Error('Database not initialized');
  return user.uid;
};

// Notes operations
export const saveNote = async (note: Note): Promise<void> => {
  try {
    const userId = getUserId();
    const noteRef = doc(db!, 'users', userId, 'notes', note.id);
    
    // Convert Date objects to Firebase timestamps for proper storage
    const noteData = {
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt : (note.createdAt || serverTimestamp()),
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt : (note.updatedAt || serverTimestamp()),
      userId
    };
    
    await setDoc(noteRef, noteData);
    logSuccess(`Note saved to Firebase: ${note.id}`, {
      noteId: note.id,
      title: note.title?.substring(0, 50)
    });
  } catch (error) {
    handleFirebaseError(error, 'save note');
    throw error;
  }
};

export const loadNotes = async (): Promise<Note[]> => {
  try {
    const userId = getUserId();
    const notesRef = collection(db!, 'users', userId, 'notes');
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
    
    logSuccess(`Loaded ${notes.length} notes from Firebase`);
    return notes;
  } catch (error) {
    handleFirebaseError(error, 'load notes');
    return [];
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const noteRef = doc(db!, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
    logSuccess(`Note deleted from Firebase: ${noteId}`);
  } catch (error) {
    handleFirebaseError(error, 'delete note');
    throw error;
  }
};

// Alias for backward compatibility
export const deleteNoteFromFirebase = deleteNote;

// Projects operations
export const saveProject = async (project: Project): Promise<void> => {
  try {
    const userId = getUserId();
    const projectRef = doc(db!, 'users', userId, 'projects', project.id);
    
    const projectData = {
      ...project,
      createdAt: project.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId
    };
    
    await setDoc(projectRef, projectData);
    logSuccess(`Project saved to Firebase: ${project.id}`, {
      projectId: project.id,
      name: project.name
    });
  } catch (error) {
    handleFirebaseError(error, 'save project');
    throw error;
  }
};

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const userId = getUserId();
    const projectsRef = collection(db!, 'users', userId, 'projects');
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
    
    logSuccess(`Loaded ${projects.length} projects from Firebase`);
    return projects;
  } catch (error) {
    handleFirebaseError(error, 'load projects');
    return [];
  }
};

export const deleteProjectFromFirebase = async (projectId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const projectRef = doc(db!, 'users', userId, 'projects', projectId);
    await deleteDoc(projectRef);
    logSuccess(`Project deleted from Firebase: ${projectId}`);
  } catch (error) {
    handleFirebaseError(error, 'delete project');
    throw error;
  }
};

// Folders operations
export const saveFolder = async (folder: Folder): Promise<void> => {
  try {
    const userId = getUserId();
    const folderRef = doc(db!, 'users', userId, 'folders', folder.id);
    
    const folderData = {
      ...folder,
      createdAt: folder.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId
    };
    
    await setDoc(folderRef, folderData);
    logSuccess(`Folder saved to Firebase: ${folder.id}`, {
      folderId: folder.id,
      name: folder.name
    });
  } catch (error) {
    handleFirebaseError(error, 'save folder');
    throw error;
  }
};

export const loadFolders = async (): Promise<Folder[]> => {
  try {
    const userId = getUserId();
    const foldersRef = collection(db!, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('order', 'asc'));
    
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
    
    logSuccess(`Loaded ${folders.length} folders from Firebase`);
    return folders;
  } catch (error) {
    handleFirebaseError(error, 'load folders');
    return [];
  }
};

// Delete folder from Firebase
export const deleteFolderFromFirebase = async (folderId: string): Promise<void> => {
  try {
    const userId = getUserId();
    const folderRef = doc(db!, 'users', userId, 'folders', folderId);
    await deleteDoc(folderRef);
    logSuccess(`Folder deleted from Firebase: ${folderId}`);
  } catch (error) {
    handleFirebaseError(error, 'delete folder');
    throw error;
  }
};

// Tags operations
export const saveTag = async (tag: Tag): Promise<void> => {
  try {
    const userId = getUserId();
    const tagRef = doc(db!, 'users', userId, 'tags', tag.id);
    
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
    const tagsRef = collection(db!, 'users', userId, 'tags');
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
    const tagRef = doc(db!, 'users', userId, 'tags', tagId);
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
    const notesRef = collection(db!, 'users', userId, 'notes');
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
    const notesRef = collection(db!, 'users', userId, 'notes');
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
      const noteRef = doc(db!, 'users', userId, 'notes', noteId);
      return deleteDoc(noteRef);
    });
    
    await Promise.all(deletePromises);
    console.log('Multiple notes deleted from Firebase:', noteIds.length);
  } catch (error) {
    console.error('Error deleting multiple notes:', error);
    throw error;
  }
}; 