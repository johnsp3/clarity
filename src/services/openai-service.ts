import { decryptData } from './encryption'

// OpenAI API Configuration
const OPENAI_API_BASE = 'https://api.openai.com/v1'
const GPT_4O_MODEL = 'gpt-4o' // Latest GPT-4o model
const GPT_4O_MINI_MODEL = 'gpt-4o-mini' // For format detection (faster/cheaper)

// Request timeout configuration
const REQUEST_TIMEOUT = 60000 // 60 seconds (increased for better reliability)
const MAX_RETRIES = 3

// Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenAIError {
  error: {
    message: string
    type: string
    code?: string
  }
}

export interface TransformationResult {
  success: boolean
  content?: string
  transformation?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface FormatDetectionResult {
  format: string
  confidence: 'high' | 'medium' | 'low'
  reasoning?: string
}

// Enhanced logging for debugging
const log = {
  info: (message: string, data?: unknown) => {
    console.log(`🤖 [OpenAI] ${message}`, data || '')
  },
  success: (message: string, data?: unknown) => {
    console.log(`✅ [OpenAI] ${message}`, data || '')
  },
  error: (message: string, error?: unknown) => {
    console.error(`❌ [OpenAI] ${message}`, error || '')
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`⚠️ [OpenAI] ${message}`, data || '')
  },
  debug: (message: string, data?: unknown) => {
    console.debug(`🔍 [OpenAI] ${message}`, data || '')
  }
}

// Get API key from encrypted storage
function getApiKey(): string | null {
  try {
    const encryptedKey = localStorage.getItem('encryptedChatGPTApiKey')
    if (!encryptedKey) {
      log.warn('No encrypted API key found in localStorage')
      return null
    }
    
    const apiKey = decryptData(encryptedKey)
    if (!apiKey || apiKey === 'dummy-chatgpt-key-replace-me') {
      log.warn('Invalid or dummy API key found')
      return null
    }
    
    if (!apiKey.startsWith('sk-')) {
      log.error('API key does not start with sk-')
      return null
    }
    
    log.debug('API key retrieved successfully')
    return apiKey
  } catch (error) {
    log.error('Failed to decrypt API key', error)
    return null
  }
}

// Create request headers
function createHeaders(apiKey: string): HeadersInit {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Clarity-App/1.0'
  }
}

// Enhanced fetch with timeout and retries
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // If rate limited, wait and retry
    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('retry-after')
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000
      
      log.warn(`Rate limited, retrying in ${waitTime}ms. Retries left: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    // If server error, retry
    if (response.status >= 500 && retries > 0) {
      log.warn(`Server error ${response.status}, retrying. Retries left: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    const err = error as Error
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout - OpenAI API took too long to respond (>${REQUEST_TIMEOUT/1000}s). This might be due to high API load or network issues. Please try again.`)
    }
    
    if (retries > 0 && err.message?.includes('fetch')) {
      log.warn(`Network error, retrying. Retries left: ${retries}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    
    throw error
  }
}

// Make chat completion request
async function createChatCompletion(
  messages: ChatMessage[],
  model: string = GPT_4O_MODEL,
  options: {
    temperature?: number
    max_tokens?: number
    stream?: boolean
  } = {}
): Promise<ChatCompletionResponse> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings.')
  }
  
  const requestBody = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 4000,
    stream: options.stream ?? false
  }
  
  log.info(`Making chat completion request to ${model}`, {
    messageCount: messages.length,
    temperature: requestBody.temperature,
    maxTokens: requestBody.max_tokens,
    contentLength: messages[messages.length - 1]?.content?.length || 0
  })
  
  try {
    const response = await fetchWithRetry(
      `${OPENAI_API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: createHeaders(apiKey),
        body: JSON.stringify(requestBody)
      }
    )
    
    if (!response.ok) {
      const errorData: OpenAIError = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}: ${response.statusText}`, type: 'api_error' }
      }))
      
      log.error(`API request failed with status ${response.status}`, errorData)
      throw new Error(errorData.error.message || `OpenAI API error: ${response.statusText}`)
    }
    
    const data: ChatCompletionResponse = await response.json()
    
    log.success('Chat completion successful', {
      model: data.model,
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason
    })
    
    return data
  } catch (error) {
    log.error('Chat completion failed', error)
    throw error
  }
}

// Validate API key by testing connection
export async function validateApiKey(apiKey: string): Promise<{
  success: boolean
  message: string
  details: string
}> {
  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      message: 'No API key provided',
      details: 'Please enter your OpenAI API key.'
    }
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      success: false,
      message: 'Invalid API key format',
      details: 'OpenAI API keys should start with "sk-". Please check your API key.'
    }
  }

  log.info('Testing API key with GPT-4o model')

  try {
    const response = await fetchWithRetry(
      `${OPENAI_API_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: createHeaders(apiKey),
        body: JSON.stringify({
          model: GPT_4O_MODEL,
          messages: [
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 5
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      log.success('API key validation successful', { model: data.model })
      
      return {
        success: true,
        message: 'ChatGPT API connection successful',
        details: `Successfully connected to OpenAI API with ${GPT_4O_MODEL}. Your API key is valid.`
      }
    } else if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: 'Invalid API key',
        details: errorData.error?.message || 'The API key is invalid or has been revoked. Please check your OpenAI account.'
      }
    } else if (response.status === 429) {
      return {
        success: false,
        message: 'Rate limit exceeded',
        details: 'Your API key has exceeded its rate limit. This might indicate the key is valid but has quota issues.'
      }
    } else if (response.status === 403) {
      return {
        success: false,
        message: 'Access forbidden',
        details: 'Your API key does not have access to the requested resource. Please check your OpenAI account permissions.'
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: 'API connection failed',
        details: errorData.error?.message || `Failed to connect to OpenAI API. Status: ${response.status}`
      }
    }
  } catch (error) {
    log.error('API key validation failed', error)
    
    const err = error as Error
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      return {
        success: false,
        message: 'Network error',
        details: 'Could not reach OpenAI API. Please check your internet connection and firewall settings.'
      }
    }
    
    return {
      success: false,
      message: 'Unexpected error',
      details: err.message || 'An unexpected error occurred while testing the ChatGPT API connection.'
    }
  }
}

// Transform text using GPT-4o
export async function transformText(
  content: string,
  transformation: string,
  customPrompt?: string
): Promise<TransformationResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Please add your API key in Settings.'
    }
  }

  log.info(`Starting text transformation: ${transformation}`, { contentLength: content.length })

  // Predefined transformation prompts
  const transformations: Record<string, string> = {
    happy: "Rewrite this text with a happy, positive, and upbeat tone while keeping the same meaning and structure. Make it sound enthusiastic and optimistic.",
    professional: "Rewrite this text in a professional, formal business tone while maintaining clarity and all important information. Use appropriate business language.",
    concise: "Make this text more concise and to-the-point while keeping all important information. Remove unnecessary words and redundancy.",
    grammar: "Fix all grammar, spelling, and punctuation errors in this text. Keep the original tone and style but make it grammatically perfect.",
    expand: "Expand this text with more details, examples, and explanations while maintaining the original structure and tone. Add valuable context and information.",
    summarize: "Create a concise summary of this text that captures the key points and main ideas. Focus on the most important information.",
    bullets: "Convert this text into a well-organized bullet point list that's easy to scan and read. Maintain all important information.",
    outline: "Convert this text into a structured outline with main points and sub-points. Use proper hierarchical formatting.",
    improve: "Improve the clarity, flow, and readability of this text while keeping the same meaning. Make it more engaging and easier to understand.",
    simplify: "Simplify this text to make it easier to understand while preserving all important information. Use simpler words and shorter sentences.",
    markdown: `You are an expert Markdown formatter.

When I say: **"Make this into a beautiful Markdown format"**, apply the following rules to ANY content I give you — whether it's raw text, bullet points, sections, requirements, guides, or technical specs.

## ✨ Formatting Goals

1. Make the Markdown visually **clean**, **beautiful**, and **developer-friendly**.
2. Use **clear section titles** with emoji icons and bold text (e.g., \`# 🔐 Security\`, \`## ✅ Best Practices\`).
3. Organize content with proper subheadings, spacing, and logical grouping.
4. Use emoji bullets in lists and tables:
   - ✅ Success / Good
   - ❌ Bad / Avoid
   - ⚠️ Warning / Caution
   - 🔋 Energy / Performance
   - 💾 Memory / Storage
   - 🧠 CPU / Logic
   - 📦 File / Resource
   - 🛠 Tools / Workflow
5. Break major sections with \`---\` lines.
6. Preserve code **only inside relevant headings** like "Code Example" or "Snippet".
7. Do NOT show raw triple backticks unless code is clearly necessary.
8. Tables must be clean, with headers bolded or icon-labeled.
9. Checklist sections should use ✅ / ❌ and follow a clean block layout.

## 💡 Examples

### Input:
These are the steps: load file, analyze text, print result.

### Output:
---
# 🛠 Workflow Steps

1. 📂 **Load File**  
   Begin by loading the input file.

2. 🧠 **Analyze Text**  
   Process content and extract insights.

3. 🖨️ **Print Result**  
   Output the findings clearly.
---

### Input:
CPU: 3%, Memory: 45MB, Energy: 9/10

### Output:

| Metric     | Value     |
|------------|-----------|
| 🧠 CPU      | ✅ 3%      |
| 💾 Memory   | ✅ 45MB    |
| 🔋 Energy   | ⚡ 9/10     |

---
Respond ONLY with the beautifully formatted Markdown. Do not include explanations, raw input, or chatty text. It should be ready for a \`README.md\` or doc page.`,
    html: "Convert this text to clean, semantic HTML that will display beautifully in a web browser. Use appropriate tags, proper structure, and formatting for an attractive visual presentation.",
    beautifulhtml: `Transform this content into beautifully formatted HTML that will render exactly like it would appear in a modern preview window of a markdown editor or macOS-style app.

Create semantic HTML with these specific requirements:

## HTML Structure Requirements:

1. **Use a clean, modern HTML structure** with semantic tags
2. **Apply inline styles** for immediate visual beauty (no external CSS needed)
3. **Use modern, Apple-inspired design principles**:
   - Clean typography with system fonts
   - Proper spacing and padding
   - Subtle shadows and rounded corners where appropriate
   - Professional color scheme

## Specific Formatting Rules:

### Headers:
- <h1> through <h6> with decreasing sizes
- Add bottom borders to h1 and h2
- Use proper margins for visual hierarchy

### Lists:
- Use <ul> with custom bullet styles
- Use <ol> with proper numbering
- Add proper spacing between items
- Support nested lists with indentation

### Text Elements:
- <p> tags for paragraphs with proper spacing
- <strong> for bold emphasis
- <em> for italic text
- <code> for inline code with background color
- <pre> for code blocks with syntax-friendly styling

### Special Elements:
- <blockquote> with left border and background
- <hr> for section breaks
- <a> tags with hover effects
- Tables with borders and alternating row colors

### Styling Guidelines:
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Base font size: 16px
- Line height: 1.6
- Color scheme: Dark text (#1a1a1a) on light background
- Code: Light gray background (#f6f8fa) with monospace font
- Links: Blue (#2563eb) with hover underline

## Example Output Structure:
<section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 2em; font-weight: 600; margin-bottom: 0.5em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e5e7;">Title</h1>
  <p style="margin-bottom: 1em;">Content...</p>
  <!-- More content -->
</section>

Return ONLY the HTML content that will render beautifully in a preview pane. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - just the content that goes inside the body.`,
    plain: `Transform this content into beautifully formatted plain text.

IMPORTANT FORMATTING RULES:
1. Use proper header hierarchy with clear visual separation
2. Add blank lines between ALL paragraphs for proper spacing
3. Use bullet points (•) for unordered lists
4. Use numbered lists (1. 2. 3.) for sequential or ordered content
5. Indent sub-items properly for visual hierarchy
6. Add horizontal separators between major sections
7. Ensure consistent spacing and alignment
8. Make the text clean, readable, and visually appealing
9. Preserve all important information while improving structure
10. Use clear section titles without special formatting

The result should be clean, well-structured plain text that is beautiful to read without any markup or special syntax.`
  }

  let systemPrompt = customPrompt || transformations[transformation] || transformation

  if (!systemPrompt) {
    return {
      success: false,
      error: `Unknown transformation: ${transformation}`
    }
  }

  // Enhanced prompt understanding for "beautiful" requests
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase()
    if (lowerPrompt.includes('beautiful') && (lowerPrompt.includes('markdown') || lowerPrompt.includes('format'))) {
      systemPrompt += '\n\nIMPORTANT: The user wants the content to look beautiful when rendered/displayed, not to see raw markup code. Focus on creating content that will be visually appealing to read.'
    }
    if (lowerPrompt.includes("don't show") && lowerPrompt.includes('raw')) {
      systemPrompt += '\n\nIMPORTANT: The user does NOT want to see raw code or markup. They want the final beautiful result that looks good when displayed.'
    }
    if (lowerPrompt.includes('just like') && lowerPrompt.includes('website')) {
      systemPrompt += '\n\nIMPORTANT: Behave exactly like ChatGPT on the website - understand the user\'s intent and provide exactly what they want to see.'
    }
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert text editor and writer who understands natural language commands perfectly, just like ChatGPT on the website. 

${systemPrompt}

CRITICAL INSTRUCTIONS:
- If the user asks for "beautiful" formatting, create content that will look visually appealing when rendered
- If they ask for Markdown, create Markdown that renders beautifully (not raw code they have to look at)
- If they ask for HTML, create HTML that displays beautifully in a browser
- If they say "don't show me raw code, show me beautiful code" - focus on the visual result, not the markup
- Understand context: "beautiful Markdown" means Markdown that looks great when rendered
- Always follow the user's intent, not just literal interpretation
- Return ONLY the transformed content without explanations or introductions
- Make it exactly what the user wants to see, not what they have to process further`
    },
    {
      role: 'user',
      content: content
    }
  ]

  try {
    const response = await createChatCompletion(messages, GPT_4O_MODEL, {
      temperature: 0.3,
      max_tokens: Math.min(4000, content.length * 2 + 500)
    })

    const transformedContent = response.choices[0]?.message?.content?.trim()

    if (!transformedContent) {
      throw new Error('Empty response from OpenAI API')
    }

    log.success(`Text transformation completed: ${transformation}`, {
      originalLength: content.length,
      transformedLength: transformedContent.length,
      usage: response.usage
    })

    return {
      success: true,
      content: transformedContent,
      transformation,
      usage: response.usage
    }
  } catch (error) {
    log.error(`Text transformation failed: ${transformation}`, error)
    const err = error as Error
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during text transformation.'
    }
  }
}

// Detect text format using GPT-4o-mini (faster and cheaper)
export async function detectTextFormat(content: string): Promise<FormatDetectionResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    log.warn('API key not available for format detection, falling back to plain text')
    return { format: 'plain', confidence: 'low' }
  }

  // For very short content, return plain text immediately
  if (content.trim().length < 10) {
    return { format: 'plain', confidence: 'high' }
  }

  // Optimize content for analysis - take first 1000 chars for speed
  const analysisContent = content.substring(0, 1000)

  log.debug('Detecting text format with GPT-4o-mini', { contentLength: analysisContent.length })

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert at analyzing text content and determining its format. Analyze the given text and determine its format type.

Respond with ONLY a JSON object in this exact format:
{
  "format": "format_name",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}

Valid formats:
- "markdown" - for Markdown syntax (headers with #, **bold**, *italic*, lists with -, links [text](url), code blocks \`\`\`, etc.)
- "html" - for HTML tags and markup (<div>, <p>, <h1>, etc.)
- "code" - for programming code (functions, variables, syntax highlighting)
- "json" - for JSON data structures with curly braces and key-value pairs
- "xml" - for XML markup with angle brackets and structured tags
- "csv" - for comma-separated values or tabular data
- "rich" - for rich text with inline formatting
- "plain" - for plain text without special formatting

Detection rules:
- Content starting with # followed by space = markdown (HIGH confidence)
- Content with HTML tags like <p>, <div>, <h1> = html (HIGH confidence)
- Content with programming syntax, functions, variables = code (HIGH confidence)
- Content with {key: value} structure = json (HIGH confidence)
- Content with <tag>content</tag> structure = xml (HIGH confidence)
- Content with commas separating values in rows = csv (HIGH confidence)

Be decisive and provide reasoning for your choice.`
    },
    {
      role: 'user',
      content: analysisContent
    }
  ]

  try {
    const response = await createChatCompletion(messages, GPT_4O_MINI_MODEL, {
      temperature: 0,
      max_tokens: 100
    })

    const responseContent = response.choices[0]?.message?.content?.trim()
    if (!responseContent) {
      throw new Error('Empty response from OpenAI API')
    }

    try {
      const result = JSON.parse(responseContent)
      const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'plain']
      const format = validFormats.includes(result.format) ? result.format : 'plain'
      const confidence = ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'medium'

      const detectionResult: FormatDetectionResult = {
        format,
        confidence,
        reasoning: result.reasoning || 'Format detected by AI analysis'
      }

      log.success('Format detection completed', detectionResult)
      return detectionResult
    } catch (parseError) {
      log.warn('Failed to parse JSON response, attempting text extraction', parseError)
      
      // Try to extract format from response text
      const responseText = responseContent.toLowerCase()
      const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich']
      
      for (const format of validFormats) {
        if (responseText.includes(format)) {
          log.debug(`Extracted format from response text: ${format}`)
          return { 
            format, 
            confidence: 'medium',
            reasoning: 'Extracted from AI response text'
          }
        }
      }
      
      return { 
        format: 'plain', 
        confidence: 'low',
        reasoning: 'Could not parse AI response'
      }
    }
  } catch (error) {
    log.error('Format detection failed', error)
    const err = error as Error
    return { 
      format: 'plain', 
      confidence: 'low',
      reasoning: `Error: ${err.message}`
    }
  }
}

// Check if API is available
export function isApiAvailable(): boolean {
  const apiKey = getApiKey()
  const available = !!apiKey
  log.debug(`API availability check: ${available}`)
  return available
}

// Get current model information
export function getModelInfo() {
  return {
    primaryModel: GPT_4O_MODEL,
    formatDetectionModel: GPT_4O_MINI_MODEL,
    apiBase: OPENAI_API_BASE
  }
}

// Export for backward compatibility
export { log as openaiLogger } 