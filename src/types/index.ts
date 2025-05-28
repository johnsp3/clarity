// Re-export all types from editor.ts
export * from './editor'

import type { ContentFormat } from './editor'

// Firebase types
export interface FirebaseTimestamp {
  seconds: number
  nanoseconds: number
  toDate(): Date
}

export interface BatchOperation {
  type: 'set' | 'update' | 'delete'
  collection: string
  id: string
  data?: Record<string, unknown>
}

// Error types
export interface AppError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Drag and Drop types
export interface DragResult {
  draggableId: string
  type: string
  source: {
    droppableId: string
    index: number
  }
  destination?: {
    droppableId: string
    index: number
  }
  reason: 'DROP' | 'CANCEL'
}

// Logger types
export interface Logger {
  info: (message: string, data?: Record<string, unknown>) => void
  success: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, error?: Error | Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  debug: (message: string, data?: Record<string, unknown>) => void
}

// API Response types
export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  citations?: string[]
}

// Note types
export interface Note {
  id: string
  title: string
  content: string
  projectId: string
  folderId?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isPinned?: boolean
  isArchived?: boolean
  format?: ContentFormat
  userId: string
}

export interface Project {
  id: string
  name: string
  color: string
  icon?: string
  createdAt: Date
  updatedAt: Date
  noteCount: number
  userId: string
  order: number
}

// User types
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: string
  autoSave: boolean
  autoSaveInterval: number
  spellCheck: boolean
  wordWrap: boolean
  showLineNumbers: boolean
  tabSize: number
  defaultFormat: ContentFormat
}

// Search types
export interface SearchResult {
  id: string
  title: string
  content: string
  projectId: string
  projectName: string
  tags: string[]
  updatedAt: Date
  matchedField: 'title' | 'content' | 'tags'
  snippet: string
}

// Import/Export types
export interface ImportOptions {
  format: 'json' | 'markdown' | 'html' | 'csv'
  projectId?: string
  folderId?: string
  tags?: string[]
  overwrite: boolean
}

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html' | 'pdf'
  includeMetadata: boolean
  includeAttachments: boolean
  noteIds?: string[]
  projectIds?: string[]
}

// Command Palette types
export interface Command {
  id: string
  name: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  action: () => void | Promise<void>
  category?: string
  keywords?: string[]
}

// Toast types
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Virtualization types
export interface VirtualItem {
  index: number
  start: number
  size: number
  end: number
}

export interface VirtualizerOptions {
  count: number
  getScrollElement: () => HTMLElement | null
  estimateSize: (index: number) => number
  overscan?: number
}

// AI Edit types
export interface AIEditRequest {
  content: string
  instruction: string
  format?: ContentFormat
  temperature?: number
  maxTokens?: number
}

export interface AIEditResponse {
  editedContent: string
  explanation?: string
  confidence?: number
  tokensUsed?: number
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// Component Props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
}

// Form types
export interface FormField<T = string> {
  value: T
  error?: string
  touched?: boolean
}

export interface FormState<T extends Record<string, unknown>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
} 