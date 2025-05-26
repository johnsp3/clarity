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

// Enhanced AI-powered format detection
export const detectTextFormatAI = async (content: string): Promise<FormatDetectionResult> => {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      console.log('⚠️ OpenAI client not available for format detection')
      return { format: 'plain', confidence: 'low' }
    }
    
    // Optimize content for analysis - take first 2000 chars for speed
    const analysisContent = content.substring(0, 2000)
    
    console.log('🤖 ChatGPT analyzing content for format detection...')
    
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
      
      console.log('🎯 ChatGPT format detection result:', { format, confidence: result.confidence })
      
      return {
        format,
        confidence: result.confidence || 'high'
      }
    } catch (parseError) {
      console.error('❌ Failed to parse ChatGPT response:', parseError)
      
      // Try simple format extraction from response text
      const responseText = response.choices[0].message.content?.toLowerCase() || ''
      const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'word', 'rtf']
      
      for (const format of validFormats) {
        if (responseText.includes(format)) {
          console.log('🔍 Extracted format from response text:', format)
          return { format, confidence: 'medium' }
        }
      }
      
      return { format: 'plain', confidence: 'low' }
    }
  } catch (error) {
    console.error('❌ ChatGPT format detection error:', error)
    return { format: 'plain', confidence: 'low' }
  }
}

// Real-time format detection for content changes - now uses ChatGPT exclusively
export const detectFormatOnChange = async (content: string): Promise<FormatDetectionResult> => {
  try {
    console.log('🔍 Real-time format detection triggered for content length:', content.length)
    
    // For very short content, return plain text immediately
    if (content.trim().length < 5) {
      console.log('📝 Content too short, returning plain text')
      return { format: 'plain', confidence: 'high' }
    }
    
    // Use ChatGPT for all format detection
    console.log('🤖 Using ChatGPT for real-time format detection...')
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