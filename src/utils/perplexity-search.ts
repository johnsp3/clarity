import { decryptData } from '../services/encryption'

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

// Initialize Perplexity client
const createPerplexityClient = (apiKey: string): PerplexityClient => {
  return {
    search: async (query: string) => {
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
        throw new Error(error.error?.message || `Perplexity API error: ${response.statusText}`)
      }
      
      return await response.json()
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
      throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
    }
    
    const response = await perplexity.search(query)
    
    return {
      success: true,
      content: response.choices[0].message.content,
      sources: response.sources || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
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