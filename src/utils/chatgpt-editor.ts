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
      // Fallback to local detection
      const format = detectContentFormat(content)
      return { format, confidence: 'medium' }
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert at analyzing text content and determining its format. Analyze the given text and determine its format type.

Respond with ONLY a JSON object in this exact format:
{
  "format": "one_word_format",
  "confidence": "high|medium|low",
  "reasoning": "brief explanation"
}

Valid formats are:
- "markdown" - for Markdown syntax (headers with #, **bold**, *italic*, lists with -, etc.)
- "html" - for HTML tags and markup
- "code" - for programming code (functions, variables, syntax)
- "json" - for JSON data structures
- "xml" - for XML markup
- "csv" - for comma-separated values
- "rich" - for rich text with formatting
- "word" - for Microsoft Word formatted content
- "rtf" - for Rich Text Format
- "plain" - for plain text without special formatting

Pay special attention to:
- Content starting with # followed by space and text = markdown header
- Content with HTML tags like <p>, <div>, <h1> = html
- Content with programming syntax = code
- Content with curly braces and key-value pairs = json`
        },
        { role: 'user', content: content.substring(0, 1000) } // Limit content for speed
      ],
      temperature: 0,
      max_tokens: 100
    })
    
    try {
      const result = JSON.parse(response.choices[0].message.content || '{}')
      const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'word', 'rtf', 'plain']
      const format = validFormats.includes(result.format) ? result.format : 'plain'
      
      return {
        format,
        confidence: result.confidence || 'high',
        reasoning: result.reasoning
      }
    } catch {
      // If JSON parsing fails, try simple format extraction
      const responseText = response.choices[0].message.content?.toLowerCase() || ''
      const validFormats = ['markdown', 'html', 'code', 'json', 'xml', 'csv', 'rich', 'word', 'rtf', 'plain']
      
      for (const format of validFormats) {
        if (responseText.includes(format)) {
          return { format, confidence: 'medium' }
        }
      }
      
      return { format: 'plain', confidence: 'low' }
    }
  } catch (error) {
    console.error('AI format detection error:', error)
    // Fallback to local detection
    const format = detectContentFormat(content)
    return { format, confidence: 'low' }
  }
}

// Real-time format detection for content changes
export const detectFormatOnChange = async (content: string): Promise<FormatDetectionResult> => {
  try {
    console.log('🔍 AI Format Detection - Analyzing content:', JSON.stringify(content));
    
    // For very short content, use local detection for speed
    if (content.trim().length < 10) {
      const format = detectContentFormat(content)
      console.log('📝 Short content detected as:', format);
      return { format, confidence: 'medium' }
    }
    
    // Check if OpenAI client is available before trying AI detection
    const openai = getOpenAIClient()
    if (!openai) {
      console.log('⚠️ OpenAI client not available, using local detection');
      const format = detectContentFormat(content)
      return { format, confidence: 'medium' }
    }
    
    // For longer content, use AI detection
    console.log('🤖 Using AI detection for longer content...');
    const result = await detectTextFormatAI(content);
    console.log('🎯 AI detection result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in detectFormatOnChange:', error);
    // Always fallback to local detection
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