import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

interface FirebaseInstances {
  app: FirebaseApp | null
  auth: Auth | null
  db: Firestore | null
  storage: FirebaseStorage | null
  googleProvider: GoogleAuthProvider | null
}

// Firebase instances
const firebase: FirebaseInstances = {
  app: null,
  auth: null,
  db: null,
  storage: null,
  googleProvider: null
}

// Get Firebase config from localStorage
const getFirebaseConfig = (): FirebaseConfig | null => {
  const configStr = localStorage.getItem('firebaseConfig')
  if (!configStr) {
    return null
  }
  
  try {
    const config = JSON.parse(configStr) as FirebaseConfig
    
    // Validate required fields
    const requiredFields: (keyof FirebaseConfig)[] = [
      'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
    ]
    
    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`Missing required Firebase config field: ${field}`)
        return null
      }
    }
    
    return config
  } catch (error) {
    console.error('Error parsing Firebase config:', error)
    return null
  }
}

// Initialize Firebase with error handling
const initializeFirebase = (): boolean => {
  const firebaseConfig = getFirebaseConfig()
  
  if (!firebaseConfig) {
    console.log('No Firebase configuration found')
    return false
  }
  
  try {
    firebase.app = initializeApp(firebaseConfig)
    firebase.auth = getAuth(firebase.app)
    firebase.db = getFirestore(firebase.app)
    firebase.storage = getStorage(firebase.app)
    firebase.googleProvider = new GoogleAuthProvider()
    
    // Configure Google provider
    firebase.googleProvider.addScope('email')
    firebase.googleProvider.addScope('profile')
    
    console.log('Firebase initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    return false
  }
}

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  const hasConfig = !!localStorage.getItem('firebaseConfig')
  const hasEmail = !!localStorage.getItem('authorizedEmail')
  
  console.log('isFirebaseConfigured check:', {
    hasConfig,
    hasEmail,
    result: hasConfig && hasEmail
  })
  
  return hasConfig && hasEmail
}

// Get authorized email
export const getAuthorizedEmail = (): string | null => {
  return localStorage.getItem('authorizedEmail')
}

// Auth functions with better error handling
export const signInWithGoogle = async (): Promise<User> => {
  if (!firebase.auth || !firebase.googleProvider) {
    throw new Error('Firebase not initialized')
  }
  
  try {
    const result = await signInWithPopup(firebase.auth, firebase.googleProvider)
    const userEmail = result.user.email
    const authorizedEmail = getAuthorizedEmail()
    
    if (!userEmail) {
      await signOut(firebase.auth)
      throw new Error('No email found in Google account')
    }
    
    if (userEmail !== authorizedEmail) {
      await signOut(firebase.auth)
      throw new Error('Unauthorized email address')
    }
    
    return result.user
  } catch (error: any) {
    console.error('Sign in error:', error)
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in was cancelled')
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by browser. Please allow pop-ups for this site.')
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.')
    }
    
    throw error
  }
}

export const signOutUser = async (): Promise<void> => {
  if (!firebase.auth) {
    throw new Error('Firebase not initialized')
  }
  
  try {
    await signOut(firebase.auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw new Error('Failed to sign out. Please try again.')
  }
}

// Re-initialize Firebase (useful after configuration)
export const reinitializeFirebase = (): boolean => {
  return initializeFirebase()
}

// Utility function to check if Firebase is ready
export const isFirebaseReady = (): boolean => {
  return !!(firebase.app && firebase.auth && firebase.db && firebase.storage)
}

// Initialize on import
const initialized = initializeFirebase()

// Export Firebase instances with null checks
export const auth = firebase.auth
export const db = firebase.db
export const storage = firebase.storage

// Export initialization status
export const isInitialized = initialized 