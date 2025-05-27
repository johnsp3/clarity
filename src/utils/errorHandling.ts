// Error handling utilities

export interface AppError {
  message: string
  code?: string
  details?: any
}

export const createError = (message: string, code?: string, details?: any): AppError => ({
  message,
  code,
  details
})

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'auth/network-request-failed' || 
         error?.message?.includes('network') ||
         error?.message?.includes('offline')
}

export const isAuthError = (error: any): boolean => {
  return error?.code?.startsWith('auth/') || 
         error?.message?.includes('authentication')
}

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.code) return `Error: ${error.code}`
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
        (error as any)?.code,
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
  let lastError: any
  
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