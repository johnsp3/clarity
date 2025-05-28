// Error handling utilities

export interface AppError {
  message: string
  code?: string
  details?: unknown
}

export const createError = (message: string, code?: string, details?: unknown): AppError => ({
  message,
  code,
  details
})

export const isNetworkError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string }
  return err?.code === 'auth/network-request-failed' || 
         err?.message?.includes('network') === true ||
         err?.message?.includes('offline') === true
}

export const isAuthError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string }
  return err?.code?.startsWith('auth/') === true || 
         err?.message?.includes('authentication') === true
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  const err = error as { message?: string; code?: string }
  if (err?.message) return err.message
  if (err?.code) return `Error: ${err.code}`
  return 'An unexpected error occurred'
}

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<{ data?: T; error?: AppError }> => {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    console.error(errorMessage, error)
    return { 
      error: createError(
        getErrorMessage(error),
        (error as { code?: string })?.code,
        error
      )
    }
  }
}

// Retry utility for failed operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
} 