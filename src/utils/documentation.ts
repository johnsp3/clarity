/**
 * @fileoverview Utility functions for documentation and code quality
 * @module utils/documentation
 */

/**
 * Represents the result of a validation operation
 * @interface ValidationResult
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean
  /** Array of error messages if validation failed */
  errors?: string[]
  /** Array of warning messages */
  warnings?: string[]
}

/**
 * Validates an email address using RFC 5322 compliant regex
 * 
 * @param {string} email - The email address to validate
 * @returns {ValidationResult} The validation result
 * 
 * @example
 * ```typescript
 * const result = validateEmail('user@example.com')
 * if (result.isValid) {
 *   console.log('Email is valid')
 * } else {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 * 
 * @see {@link https://emailregex.com/} for regex details
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  
  if (!email) {
    errors.push('Email is required')
  } else if (email.length > 254) {
    errors.push('Email is too long (max 254 characters)')
  } else {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(email)) {
      errors.push('Email format is invalid')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Formats a date into a human-readable relative time string
 * 
 * @param {Date} date - The date to format
 * @param {Date} [baseDate=new Date()] - The date to compare against (defaults to now)
 * @returns {string} A human-readable relative time string
 * 
 * @example
 * ```typescript
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
 * console.log(formatRelativeTime(yesterday)) // "1 day ago"
 * 
 * const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000)
 * console.log(formatRelativeTime(inTwoHours)) // "in 2 hours"
 * ```
 * 
 * @throws {TypeError} If date is not a valid Date object
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError('Invalid date provided')
  }
  
  const diffMs = date.getTime() - baseDate.getTime()
  const absDiffMs = Math.abs(diffMs)
  
  const seconds = Math.floor(absDiffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  
  if (years > 0) {
    return rtf.format(diffMs > 0 ? years : -years, 'year')
  } else if (months > 0) {
    return rtf.format(diffMs > 0 ? months : -months, 'month')
  } else if (weeks > 0) {
    return rtf.format(diffMs > 0 ? weeks : -weeks, 'week')
  } else if (days > 0) {
    return rtf.format(diffMs > 0 ? days : -days, 'day')
  } else if (hours > 0) {
    return rtf.format(diffMs > 0 ? hours : -hours, 'hour')
  } else if (minutes > 0) {
    return rtf.format(diffMs > 0 ? minutes : -minutes, 'minute')
  } else {
    return rtf.format(diffMs > 0 ? seconds : -seconds, 'second')
  }
}

/**
 * Debounces a function call
 * 
 * @template T - The function type
 * @param {T} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {T & { cancel: () => void }} The debounced function with a cancel method
 * 
 * @example
 * ```typescript
 * const saveToServer = (data: string) => {
 *   console.log('Saving:', data)
 * }
 * 
 * const debouncedSave = debounce(saveToServer, 1000)
 * 
 * // These calls will be debounced
 * debouncedSave('Hello')
 * debouncedSave('Hello W')
 * debouncedSave('Hello World') // Only this will execute after 1 second
 * 
 * // Cancel pending execution
 * debouncedSave.cancel()
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }) as any
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  
  return debounced as T & { cancel: () => void }
}

/**
 * Safely parses JSON with error handling
 * 
 * @template T - The expected type of the parsed JSON
 * @param {string} json - The JSON string to parse
 * @param {T} [fallback] - The fallback value if parsing fails
 * @returns {{ data: T | null; error: Error | null }} The parsed data or error
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string
 *   name: string
 * }
 * 
 * const { data, error } = safeJsonParse<User>('{"id": "1", "name": "John"}')
 * if (error) {
 *   console.error('Parse error:', error)
 * } else {
 *   console.log('User:', data)
 * }
 * ```
 */
export function safeJsonParse<T = unknown>(
  json: string,
  fallback?: T
): { data: T | null; error: Error | null } {
  try {
    const data = JSON.parse(json) as T
    return { data, error: null }
  } catch (error) {
    return {
      data: fallback ?? null,
      error: error instanceof Error ? error : new Error('Unknown parsing error')
    }
  }
} 