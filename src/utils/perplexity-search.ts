import { decryptData } from '../services/encryption'
import { handleApiError, logSuccess, errorLogger } from '../services/errorHandling'

export interface PerplexityClient {
  search: (query: string) => Promise<{
    choices: Array<{
      message: {
        content: string
      }
    }>
    sources?: Array<{
      url: string
      title?: string
    }>
  }>
}

export interface SearchResult {
  success: boolean
  content?: string
  sources?: Array<{
    url: string
    title?: string
  }>
  error?: string
}

// Initialize Perplexity client with error handling
const createPerplexityClient = (apiKey: string): PerplexityClient => {
  return {
    search: async (query: string) => {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online', // Online model for web search
            messages: [
              {
                role: 'user',
                content: query
              }
            ],
            stream: false
          })
        })
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          const apiError = {
            message: error.error?.message || `Perplexity API error: ${response.statusText}`,
            status: response.status,
            code: error.error?.code,
            response: error
          }
          
          handleApiError(apiError, 'Perplexity')
          throw new Error(apiError.message)
        }
        
        const data = await response.json()
        
        // Log successful API call
        if (data.usage) {
          errorLogger.log({
            message: 'Perplexity API usage',
            severity: 'info',
            category: 'api',
            details: {
              prompt_tokens: data.usage.prompt_tokens,
              completion_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens,
              model: data.model
            }
          })
        }
        
        return data
      } catch (error) {
        // Network errors
        const err = error as Error
        if (err.name === 'TypeError' && err.message?.includes('fetch')) {
          const networkError = {
            message: 'Network error: Unable to connect to Perplexity',
            code: 'network_error'
          }
          handleApiError(networkError, 'Perplexity')
          throw new Error('Unable to connect to Perplexity. Please check your internet connection.')
        }
        
        throw error
      }
    }
  }
}

export const getPerplexityClient = (): PerplexityClient | null => {
  try {
    const encryptedKey = localStorage.getItem('encryptedPerplexityApiKey')
    if (!encryptedKey) return null
    
    const apiKey = decryptData(encryptedKey)
    if (!apiKey || apiKey === 'dummy-perplexity-key-replace-me') return null
    
    return createPerplexityClient(apiKey)
  } catch (error) {
    console.error('Failed to create Perplexity client:', error)
    return null
  }
}

// Search the web using Perplexity
export const searchWeb = async (query: string): Promise<SearchResult> => {
  try {
    const perplexity = getPerplexityClient()
    if (!perplexity) {
      const error = {
        message: 'Perplexity API key not configured',
        code: 'missing_api_key'
      }
      handleApiError(error, 'Perplexity')
      throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
    }
    
    errorLogger.log({
      message: `Starting Perplexity search: "${query}"`,
      severity: 'info',
      category: 'api',
      details: { query }
    })
    
    const response = await perplexity.search(query)
    
    logSuccess('Perplexity search completed', {
      query,
      resultLength: response.choices[0].message.content.length,
      sourcesCount: response.sources?.length || 0
    })
    
    return {
      success: true,
      content: response.choices[0].message.content,
      sources: response.sources || []
    }
  } catch (error) {
    const err = error as Error
    
    // Check for specific error types
    if (err.message?.includes('401')) {
      handleApiError({
        message: err.message,
        status: 401,
        code: 'invalid_api_key'
      }, 'Perplexity')
    } else if (err.message?.includes('429')) {
      handleApiError({
        message: err.message,
        status: 429,
        code: 'rate_limit'
      }, 'Perplexity')
    } else if (err.message?.includes('fetch')) {
      handleApiError({
        message: err.message,
        code: 'network_error'
      }, 'Perplexity')
    } else {
      handleApiError(err, 'Perplexity')
    }
    
    return {
      success: false,
      error: err.message
    }
  }
}

// Enhanced search with specific instructions
export const searchWithContext = async (
  query: string, 
  context: 'research' | 'news' | 'technical' | 'general' = 'general'
): Promise<SearchResult> => {
  const contextPrompts = {
    research: `Research this topic in depth: ${query}. Provide comprehensive information with reliable sources.`,
    news: `Find the latest news and updates about: ${query}. Focus on recent developments and current events.`,
    technical: `Provide technical information and documentation about: ${query}. Include implementation details and best practices.`,
    general: query
  }
  
  return searchWeb(contextPrompts[context])
} 