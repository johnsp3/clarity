import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { handleFirebaseError, logSuccess, errorLogger } from './errorHandling'

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
    errorLogger.log({
      message: 'No Firebase configuration found',
      severity: 'warning',
      category: 'firebase',
      userMessage: 'Firebase is not configured',
      action: 'Run the setup wizard to configure Firebase'
    })
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
    
    // Only log to console, not to the error notification system
    console.log('Firebase initialized successfully', {
      projectId: firebaseConfig.projectId
    })
    return true
  } catch (error) {
    handleFirebaseError(error, 'initialization')
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
    const error = new Error('Firebase not initialized')
    handleFirebaseError(error, 'authentication')
    throw error
  }
  
  try {
    errorLogger.log({
      message: 'Starting Google sign-in',
      severity: 'info',
      category: 'auth'
    })
    
    const result = await signInWithPopup(firebase.auth, firebase.googleProvider)
    const userEmail = result.user.email
    const authorizedEmail = getAuthorizedEmail()
    
    if (!userEmail) {
      await signOut(firebase.auth)
      const error = new Error('No email found in Google account')
      handleFirebaseError(error, 'authentication')
      throw error
    }
    
    if (userEmail !== authorizedEmail) {
      await signOut(firebase.auth)
      const error = {
        message: 'Unauthorized email address',
        code: 'auth/unauthorized-email'
      }
      handleFirebaseError(error, 'authentication')
      throw new Error('Unauthorized email address')
    }
    
    logSuccess('User signed in successfully', {
      email: userEmail,
      uid: result.user.uid
    })
    
    return result.user
  } catch (error) {
    // Don't double-log if we already handled it above
    const err = error as any
    if (!err.message?.includes('Unauthorized email') && !err.message?.includes('No email found')) {
      handleFirebaseError(error, 'authentication')
    }
    
    // Re-throw with user-friendly message
    const authError = error as { code?: string; message?: string }
    if (authError.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in was cancelled')
    } else if (authError.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by browser. Please allow pop-ups for this site.')
    } else if (authError.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.')
    }
    
    throw error
  }
}

export const signOutUser = async (): Promise<void> => {
  if (!firebase.auth) {
    const error = new Error('Firebase not initialized')
    handleFirebaseError(error, 'authentication')
    throw error
  }
  
  try {
    await signOut(firebase.auth)
    logSuccess('User signed out successfully')
  } catch (error) {
    handleFirebaseError(error, 'sign-out')
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