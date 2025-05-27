import { getOpenAIClient } from './openai-client'

export interface TransformationResult {
  success: boolean
  content?: string
  transformation?: string
  error?: string
}

export interface FormatDetectionResult {
  format: string
  confidence: 'high' | 'medium' | 'low'
  reasoning?: string
}

// Request queue to ensure only one API call at a time
class APIRequestQueue {
  private isProcessing = false
  private queue: Array<() => Promise<any>> = []
  private currentController: AbortController | null = null

  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    
    while (this.queue.length > 0) {
      // Cancel any previous request
      if (this.currentController) {
        this.currentController.abort()
      }
      
      // Create new abort controller for this request
      this.currentController = new AbortController()
      
      const requestFn = this.queue.shift()!
      
      try {
        await requestFn()
      } catch (error) {
        // Log error but continue processing queue
        console.error('API request failed:', error)
      }
    }
    
    this.isProcessing = false
    this.currentController = null
  }

  // Clear queue and cancel current request
  clear() {
    this.queue.length = 0
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = null
    }
    this.isProcessing = false
  }
}

// Global request queue instance
const apiQueue = new APIRequestQueue()

// Cache for format detection to avoid duplicate requests
const formatDetectionCache = new Map<string, { result: FormatDetectionResult; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

// Text transformation using ChatGPT-4
export const transformText = async (
  content: string, 
  transformation: string, 
  customPrompt: string | null = null
): Promise<TransformationResult> => {
  return apiQueue.enqueue(async () => {
    try {
      const openai = getOpenAIClient()
      if (!openai) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.')
      }
      
      console.log('🚀 Starting text transformation:', transformation)
      
      // Transformation prompts
      const transformations: Record<string, string> = {
        happy: "Rewrite this text with a happy, positive, and upbeat tone while keeping the same meaning and structure",
        professional: "Rewrite this text in a professional, formal business tone while maintaining clarity",
        concise: "Make this text more concise and to-the-point while keeping all important information",
        grammar: "Fix all grammar, spelling, and punctuation errors in this text. Keep the original tone and style",
        markdown: `Convert this text to properly formatted Markdown with the following structure:

1. Preserve all paragraph breaks - each paragraph should be separated by a blank line
2. Convert the title or first line to a main heading using # 
3. Use appropriate subheadings (##, ###) for different sections
4. Preserve the natural flow and structure of the content
5. Use proper line breaks between paragraphs
6. Format any lists with proper bullet points (-)
7. Use **bold** for emphasis where appropriate
8. Use *italics* for subtle emphasis
9. Ensure proper spacing and readability

The result should be clean, well-structured Markdown that renders beautifully when previewed.`,
        html: "Convert this text to clean, semantic HTML format with proper tags, headings, paragraphs, and structure. Use proper HTML5 semantic elements.",
        plaintext: "Convert this to plain text, removing all formatting while preserving the content structure and readability",
        rtf: "Convert this text to Rich Text Format with proper formatting, headings, and structure that will display beautifully",
        docx: "Convert this text to Microsoft Word document format with proper headings, paragraphs, and professional formatting",
        word: "Convert this text to Microsoft Word document format with proper headings, paragraphs, and professional formatting"
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
      
      console.log('✅ Text transformation completed successfully')
      
      return {
        success: true,
        content: response.choices[0].message.content,
        transformation: transformation || 'custom'
      }
    } catch (error: any) {
      console.error('❌ Text transformation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

// Enhanced AI-powered format detection with caching and queue management
export const detectTextFormatAI = async (content: string): Promise<FormatDetectionResult> => {
  // Create cache key from content hash
  const cacheKey = content.substring(0, 500) // Use first 500 chars as cache key
  
  // Check cache first
  const cached = formatDetectionCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🎯 Using cached format detection result')
    return cached.result
  }
  
  return apiQueue.enqueue(async () => {
    try {
      const openai = getOpenAIClient()
      if (!openai) {
        console.log('⚠️ OpenAI client not available for format detection')
        return { format: 'plain', confidence: 'low' }
      }
      
      // Optimize content for analysis - take first 2000 chars for speed
      const analysisContent = content.substring(0, 2000)
      
      console.log('🤖 ChatGPT analyzing content for format detection... (queued)')
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert at analyzing text content and determining its format. Analyze the given text and determine its format type.

Respond with ONLY a JSON object in this exact format:
{
  "format": "format_name",
  "confidence": "high|medium|low"
}

Valid formats:
- "markdown" - for Markdown syntax (headers with #, **bold**, *italic*, lists with -, links [text](url), code blocks \`\`\`, etc.)
- "html" - for HTML tags and markup (<div>, <p>, <h1>, etc.)
- "code" - for programming code (functions, variables, syntax highlighting)
- "json" - for JSON data structures with curly braces and key-value pairs
- "xml" - for XML markup with angle brackets and structured tags
- "csv" - for comma-separated values or tabular data
- "rich" - for rich text with inline formatting
- "word" - for Microsoft Word formatted content
- "rtf" - for Rich Text Format
- "plain" - for plain text without special formatting

Key detection rules:
- Content starting with # followed by space = markdown header (HIGH confidence)
- Content with HTML tags like <p>, <div>, <h1> = html
- Content with programming syntax, functions, variables = code
- Content with {key: value} structure = json
- Content with <tag>content</tag> structure = xml
- Content with commas separating values in rows = csv

Be decisive and confident in your detection.`
          },
          { role: 'user', content: analysisContent }
        ],
        temperature: 0,
        max_tokens: 50
      })
      
      try {
        const result = JSON.parse(response.choices[0].message.content || '{}')
        const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'word', 'rtf', 'plain']
        const format = validFormats.includes(result.format) ? result.format : 'plain'
        
        const detectionResult = {
          format,
          confidence: result.confidence || 'high'
        }
        
        // Cache the result
        formatDetectionCache.set(cacheKey, {
          result: detectionResult,
          timestamp: Date.now()
        })
        
        console.log('🎯 ChatGPT format detection completed:', detectionResult)
        
        return detectionResult
      } catch (parseError) {
        console.error('❌ Failed to parse ChatGPT response:', parseError)
        
        // Try simple format extraction from response text
        const responseText = response.choices[0].message.content?.toLowerCase() || ''
        const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'word', 'rtf']
        
        for (const format of validFormats) {
          if (responseText.includes(format)) {
            console.log('🔍 Extracted format from response text:', format)
            const result = { format, confidence: 'medium' as const }
            
            // Cache the result
            formatDetectionCache.set(cacheKey, {
              result,
              timestamp: Date.now()
            })
            
            return result
          }
        }
        
        const fallbackResult = { format: 'plain', confidence: 'low' as const }
        
        // Cache the fallback result
        formatDetectionCache.set(cacheKey, {
          result: fallbackResult,
          timestamp: Date.now()
        })
        
        return fallbackResult
      }
    } catch (error) {
      console.error('❌ ChatGPT format detection error:', error)
      return { format: 'plain', confidence: 'low' }
    }
  })
}

// Real-time format detection for content changes - now uses ChatGPT exclusively with queue management
export const detectFormatOnChange = async (content: string): Promise<FormatDetectionResult> => {
  try {
    console.log('🔍 Real-time format detection triggered for content length:', content.length)
    
    // For very short content, return plain text immediately
    if (content.trim().length < 5) {
      console.log('📝 Content too short, returning plain text')
      return { format: 'plain', confidence: 'high' }
    }
    
    // Use ChatGPT for all format detection with queue management
    console.log('🤖 Using ChatGPT for real-time format detection (queued)...')
    const result = await detectTextFormatAI(content)
    console.log('🎯 Real-time detection result:', result)
    return result
  } catch (error) {
    console.error('❌ Error in real-time format detection:', error)
    return { format: 'plain', confidence: 'low' }
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

// Clear the API queue and cache (useful for cleanup)
export const clearAPIQueue = () => {
  apiQueue.clear()
  formatDetectionCache.clear()
  console.log('🧹 API queue and cache cleared')
} 