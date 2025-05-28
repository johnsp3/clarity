import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Represents the state of an async operation
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

/**
 * Options for the useAsyncState hook
 */
interface UseAsyncStateOptions<T> {
  initialData?: T | null
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
}

/**
 * Custom hook for managing async state with consistent loading, error, and data handling
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute, reset } = useAsyncState<User[]>({
 *   onSuccess: (users) => console.log('Loaded users:', users),
 *   onError: (error) => console.error('Failed to load users:', error)
 * })
 * 
 * // Execute async operation
 * await execute(async () => {
 *   const response = await fetch('/api/users')
 *   return response.json()
 * })
 * ```
 */
export function useAsyncState<T>(options: UseAsyncStateOptions<T> = {}) {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  /**
   * Execute an async operation
   */
  const execute = useCallback(async (
    asyncFunction: (signal?: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    // Cancel any pending operation
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setState({
      data: state.data,
      loading: true,
      error: null,
      isIdle: false,
      isLoading: true,
      isSuccess: false,
      isError: false
    })

    let attempts = 0
    let lastError: Error | null = null

    while (attempts <= retryCount) {
      try {
        const result = await asyncFunction(abortControllerRef.current.signal)
        
        if (isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            isIdle: false,
            isLoading: false,
            isSuccess: true,
            isError: false
          })
          
          onSuccess?.(result)
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        attempts++

        if (attempts <= retryCount) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
        }
      }
    }

    // All retries failed
    if (isMountedRef.current && lastError) {
      setState({
        data: null,
        loading: false,
        error: lastError,
        isIdle: false,
        isLoading: false,
        isSuccess: false,
        isError: true
      })
      
      onError?.(lastError)
    }

    return null
  }, [state.data, onSuccess, onError, retryCount, retryDelay])

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({
      data: initialData,
      loading: false,
      error: null,
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      isError: false
    })
  }, [initialData])

  /**
   * Set data manually
   */
  const setData = useCallback((data: T | null) => {
    setState({
      data,
      loading: false,
      error: null,
      isIdle: false,
      isLoading: false,
      isSuccess: true,
      isError: false
    })
  }, [])

  /**
   * Set error manually
   */
  const setError = useCallback((error: Error) => {
    setState({
      data: null,
      loading: false,
      error,
      isIdle: false,
      isLoading: false,
      isSuccess: false,
      isError: true
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError
  }
}

/**
 * Hook for managing multiple async operations
 */
export function useAsyncStates<T extends Record<string, any>>() {
  const states = useRef<Record<string, any>>({})

  const getState = useCallback(<K extends keyof T>(key: K) => {
    if (!states.current[key as string]) {
      throw new Error(`Async state "${String(key)}" not initialized`)
    }
    return states.current[key as string] as ReturnType<typeof useAsyncState<T[K]>>
  }, [])

  const initState = useCallback(<K extends keyof T>(
    _key: K,
    _options?: UseAsyncStateOptions<T[K]>
  ) => {
    // This is a limitation - hooks can't be called dynamically
    // For now, return a placeholder that warns about the limitation
    console.warn('useAsyncStates.initState cannot dynamically create hooks. Consider using individual useAsyncState hooks instead.')
    return {} as any
  }, [])

  return {
    getState,
    initState
  }
} 