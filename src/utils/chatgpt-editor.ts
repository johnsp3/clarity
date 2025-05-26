import { getOpenAIClient } from './openai-client'
import { detectContentFormat } from './format-detector'

export interface TransformationResult {
  success: boolean
  content?: string
  transformation?: string
  error?: string
}

export interface FormatDetectionResult {
  format: string
  confidence: 'high' | 'medium' | 'low'
}

// Text transformation using ChatGPT-4
export const transformText = async (
  content: string, 
  transformation: string, 
  customPrompt: string | null = null
): Promise<TransformationResult> => {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please add your API key in Settings.')
    }
    
    // Transformation prompts
    const transformations: Record<string, string> = {
      happy: "Rewrite this text with a happy, positive, and upbeat tone while keeping the same meaning and structure",
      professional: "Rewrite this text in a professional, formal business tone while maintaining clarity",
      concise: "Make this text more concise and to-the-point while keeping all important information",
      grammar: "Fix all grammar, spelling, and punctuation errors in this text. Keep the original tone and style",
      markdown: "Convert this text to proper Markdown format with appropriate headers, lists, and formatting",
      html: "Convert this text to clean, semantic HTML format with proper tags and structure",
      plaintext: "Convert this to plain text, removing all formatting while preserving the content structure"
    }
    
    const systemPrompt = customPrompt || transformations[transformation]
    
    if (!systemPrompt) {
      throw new Error('Invalid transformation type')
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are a text editor assistant. ${systemPrompt}. Return ONLY the transformed text without any explanation or additional commentary.`
        },
        { role: 'user', content: content }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
    
    return {
      success: true,
      content: response.choices[0].message.content,
      transformation: transformation || 'custom'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Auto-detect format of pasted text using AI
export const detectTextFormatAI = async (content: string): Promise<FormatDetectionResult> => {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      // Fallback to local detection
      const format = detectContentFormat(content)
      return { format, confidence: 'medium' }
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Faster model for quick detection
      messages: [
        { 
          role: 'system', 
          content: 'Analyze the given text and determine its format. Respond with ONLY one word from: "markdown", "html", "code", "json", "xml", "csv", "rich", or "plain"'
        },
        { role: 'user', content: content.substring(0, 500) } // Sample for speed
      ],
      temperature: 0,
      max_tokens: 10
    })
    
    const detectedFormat = response.choices[0].message.content.toLowerCase().trim()
    const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'plain']
    const format = validFormats.includes(detectedFormat) ? detectedFormat : 'plain'
    
    return {
      format,
      confidence: 'high'
    }
  } catch (error) {
    // Fallback to local detection
    const format = detectContentFormat(content)
    return { format, confidence: 'low' }
  }
}

// Enhance existing content with AI suggestions
export const enhanceContent = async (content: string, enhancement: string): Promise<TransformationResult> => {
  const enhancements: Record<string, string> = {
    expand: "Expand this text with more details, examples, and explanations while maintaining the original structure and tone",
    summarize: "Create a concise summary of this text that captures the key points and main ideas",
    bullets: "Convert this text into a well-organized bullet point list that's easy to scan and read",
    outline: "Convert this text into a structured outline with main points and sub-points",
    improve: "Improve the clarity, flow, and readability of this text while keeping the same meaning",
    simplify: "Simplify this text to make it easier to understand while preserving all important information"
  }
  
  return transformText(content, enhancement, enhancements[enhancement])
} 