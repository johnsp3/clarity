import { decryptData } from '../services/encryption'

export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string
        messages: Array<{ role: string; content: string }>
        temperature?: number
        max_tokens?: number
      }) => Promise<{
        choices: Array<{
          message: {
            content: string
          }
        }>
      }>
    }
  }
}

export const createOpenAIClient = (apiKey: string): OpenAIClient => {
  return {
    chat: {
      completions: {
        create: async (params) => {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`)
          }

          return await response.json()
        }
      }
    }
  }
}

export const getOpenAIClient = (): OpenAIClient | null => {
  try {
    const encryptedKey = localStorage.getItem('encryptedChatGPTApiKey')
    if (!encryptedKey) return null
    
    const apiKey = decryptData(encryptedKey)
    if (!apiKey || apiKey === 'dummy-chatgpt-key-replace-me') return null
    
    return createOpenAIClient(apiKey)
  } catch (error) {
    console.error('Failed to create OpenAI client:', error)
    return null
  }
} 