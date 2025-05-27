import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
const mockFirebase = {
  auth: null,
  db: null,
  storage: null,
  isFirebaseConfigured: () => false,
  signInWithGoogle: () => Promise.reject(new Error('Mock Firebase')),
  signOutUser: () => Promise.resolve(),
}

vi.mock('../services/firebase', () => mockFirebase)

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
}) 