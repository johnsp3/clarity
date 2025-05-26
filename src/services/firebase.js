import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Get Firebase config from localStorage
const getFirebaseConfig = () => {
  const configStr = localStorage.getItem('firebaseConfig');
  if (!configStr) {
    return null;
  }
  
  try {
    return JSON.parse(configStr);
  } catch (error) {
    console.error('Error parsing Firebase config:', error);
    return null;
  }
};

// Initialize Firebase only if config exists
let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;

const initializeFirebase = () => {
  const firebaseConfig = getFirebaseConfig();
  
  if (!firebaseConfig) {
    console.log('No Firebase configuration found');
    return false;
  }
  
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  const hasConfig = !!localStorage.getItem('firebaseConfig');
  const hasEmail = !!localStorage.getItem('authorizedEmail');
  
  console.log('isFirebaseConfigured check:', {
    hasConfig,
    hasEmail,
    result: hasConfig && hasEmail
  });
  
  return hasConfig && hasEmail;
};

// Get authorized email
export const getAuthorizedEmail = () => {
  return localStorage.getItem('authorizedEmail');
};

// Initialize on import
const initialized = initializeFirebase();

// Auth functions
export const signInWithGoogle = async () => {
  if (!initialized) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userEmail = result.user.email;
    const authorizedEmail = getAuthorizedEmail();
    
    if (userEmail !== authorizedEmail) {
      await signOut(auth);
      throw new Error(`Unauthorized email. Only ${authorizedEmail} can access this app.`);
    }
    
    return result.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (!initialized) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Re-initialize Firebase (useful after configuration)
export const reinitializeFirebase = () => {
  return initializeFirebase();
};

// Export Firebase instances
export { auth, db, storage }; 