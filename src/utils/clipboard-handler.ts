import { ContentFormat } from '../types/editor'
import { detectContentFormat } from './format-detector'

export interface ClipboardData {
  content: string
  format: ContentFormat
  originalFormat: string
}

/**
 * Enhanced clipboard handler that detects and processes various clipboard formats
 */
export class ClipboardHandler {
  /**
   * Process clipboard data and return the best content and format
   */
  static async processClipboardData(clipboardData: DataTransfer): Promise<ClipboardData> {
    const types = Array.from(clipboardData.types)
    
    // Priority order for clipboard data types
    const priorityTypes = [
      'text/html',
      'text/rtf', 
      'text/plain',
      'text/uri-list',
      'application/json',
      'text/xml',
      'text/csv'
    ]

    let bestContent = ''
    let detectedFormat: ContentFormat = 'plain'
    let originalFormat = 'text/plain'

    // Try to get the best available format
    for (const type of priorityTypes) {
      if (types.includes(type)) {
        const content = clipboardData.getData(type)
        if (content && content.trim()) {
          bestContent = content
          originalFormat = type
          detectedFormat = this.mapMimeTypeToFormat(type, content)
          break
        }
      }
    }

    // If no priority type found, try any available type
    if (!bestContent) {
      for (const type of types) {
        const content = clipboardData.getData(type)
        if (content && content.trim()) {
          bestContent = content
          originalFormat = type
          detectedFormat = this.mapMimeTypeToFormat(type, content)
          break
        }
      }
    }

    // Final fallback to content-based detection
    if (bestContent && detectedFormat === 'plain') {
      detectedFormat = detectContentFormat(bestContent)
    }

    return {
      content: bestContent,
      format: detectedFormat,
      originalFormat
    }
  }

  /**
   * Map MIME types to our content formats
   */
  private static mapMimeTypeToFormat(mimeType: string, content: string): ContentFormat {
    switch (mimeType) {
      case 'text/html':
        // Further analyze HTML content
        return this.analyzeHTMLContent(content)
      
      case 'text/rtf':
        return 'rtf'
      
      case 'application/json':
      case 'text/json':
        return 'json'
      
      case 'text/xml':
      case 'application/xml':
        return 'xml'
      
      case 'text/csv':
        return 'csv'
      
      case 'text/plain':
      default: {
        // Use content-based detection for plain text
        const detectedFormat = detectContentFormat(content)
        // For plain text that looks like markdown, prioritize markdown detection
        if (detectedFormat === 'markdown') {
          return 'markdown'
        }
        return detectedFormat
      }
    }
  }

  /**
   * Analyze HTML content to determine if it's from Word, rich text, or regular HTML
   */
  private static analyzeHTMLContent(htmlContent: string): ContentFormat {
    // Check for Microsoft Word indicators
    const wordIndicators = [
      /mso-/i,
      /<o:p>/i,
      /<w:/i,
      /class=["']?Mso/i,
      /microsoft-com:office/i,
      /urn:schemas-microsoft-com/i
    ]

    if (wordIndicators.some(pattern => pattern.test(htmlContent))) {
      return 'word'
    }

    // Check for rich text formatting
    const richTextIndicators = [
      /style\s*=\s*["'][^"']*["']/i,
      /font-weight:\s*bold/i,
      /font-style:\s*italic/i,
      /text-decoration:\s*underline/i,
      /color:\s*#[0-9a-f]{3,6}/i,
      /<(strong|em|u|b|i)\b/i
    ]

    if (richTextIndicators.some(pattern => pattern.test(htmlContent))) {
      return 'rich'
    }

    // Check if it's structured HTML
    const htmlStructureIndicators = [
      /<(div|span|p|h[1-6]|ul|ol|li|table)\b/i,
      /<\/\w+>/
    ]

    if (htmlStructureIndicators.some(pattern => pattern.test(htmlContent))) {
      return 'html'
    }

    // Fallback to content-based detection
    return detectContentFormat(htmlContent)
  }

  /**
   * Clean and prepare content for editor insertion
   */
  static cleanContentForEditor(content: string, format: ContentFormat): string {
    switch (format) {
      case 'word':
        return this.cleanWordContent(content)
      
      case 'rtf':
        return this.cleanRTFContent(content)
      
      case 'html':
        return this.cleanHTMLContent(content)
      
      case 'rich':
        return this.cleanRichTextContent(content)
      
      default:
        return content
    }
  }

  /**
   * Clean Microsoft Word content
   */
  private static cleanWordContent(content: string): string {
    return content
      // Remove Word-specific XML namespaces and tags
      .replace(/<o:p\s*\/?>/gi, '')
      .replace(/<w:[^>]*>/gi, '')
      .replace(/<\/w:[^>]*>/gi, '')
      // Clean up Word CSS classes
      .replace(/class="Mso[^"]*"/gi, '')
      // Remove Word-specific styles
      .replace(/mso-[^;]*;?/gi, '')
      // Remove empty style attributes
      .replace(/style="[^"]*"/gi, (match) => {
        const cleaned = match.replace(/mso-[^;]*;?/gi, '').replace(/style="[\s;]*"/gi, '')
        return cleaned === 'style=""' ? '' : cleaned
      })
      // Clean up excessive spacing
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }

  /**
   * Clean RTF content (basic cleaning)
   */
  private static cleanRTFContent(content: string): string {
    // This is a basic RTF cleaner - for full RTF support, you'd need a proper library
    return content
      // Remove RTF control words
      .replace(/\\[a-z]+\d*/gi, '')
      // Remove RTF control symbols
      .replace(/[{}]/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Clean HTML content
   */
  private static cleanHTMLContent(content: string): string {
    return content
      // Remove script and style tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }

  /**
   * Clean rich text content
   */
  private static cleanRichTextContent(content: string): string {
    return content
      // Preserve essential formatting but clean up excessive styling
      .replace(/style="[^"]*"/gi, (match) => {
        // Keep only essential styles
        const essentialStyles = match.match(/(font-weight:\s*bold|font-style:\s*italic|text-decoration:\s*underline|color:\s*#[0-9a-f]{3,6})/gi)
        return essentialStyles ? `style="${essentialStyles.join('; ')}"` : ''
      })
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }
}

/**
 * Utility function to handle paste events in the editor
 */
export const handleEditorPaste = async (
  event: ClipboardEvent,
  onFormatDetected?: (format: ContentFormat, content: string) => void
): Promise<ClipboardData | null> => {
  if (!event.clipboardData) {
    return null
  }

  try {
    const clipboardData = await ClipboardHandler.processClipboardData(event.clipboardData)
    
    if (onFormatDetected) {
      onFormatDetected(clipboardData.format, clipboardData.content)
    }

    return clipboardData
  } catch (error) {
    console.error('Error processing clipboard data:', error)
    return null
  }
} 