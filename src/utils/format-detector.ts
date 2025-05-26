import { ContentFormat } from '../types/editor'

/**
 * Enhanced content format detection with support for multiple formats
 * including Microsoft Word, RTF, JSON, XML, CSV, and better text format detection
 */
export const detectContentFormat = (content: string): ContentFormat => {
  // Remove leading/trailing whitespace for analysis
  const trimmedContent = content.trim()
  
  if (!trimmedContent) {
    return 'plain'
  }

  // Check for RTF format (Rich Text Format)
  if (trimmedContent.startsWith('{\\rtf') || /^{\\rtf\d/.test(trimmedContent)) {
    return 'rtf'
  }

  // Check for Microsoft Word XML format or DOCX-like content
  if (trimmedContent.includes('<?xml') && 
      (trimmedContent.includes('w:document') || 
       trimmedContent.includes('office:word') ||
       trimmedContent.includes('microsoft-com:office'))) {
    return 'docx'
  }

  // Check for JSON format
  try {
    if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
        (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
      JSON.parse(trimmedContent)
      return 'json'
    }
  } catch {
    // Not valid JSON, continue checking
  }

  // Check for XML format (more strict detection)
  if (isXMLFormat(trimmedContent)) {
    return 'xml'
  }

  // Check for CSV format
  if (isCSVFormat(trimmedContent)) {
    return 'csv'
  }

  // Check for HTML format (more sophisticated detection)
  if (isHTMLFormat(trimmedContent)) {
    return 'html'
  }

  // Check for Markdown format (enhanced detection)
  if (isMarkdownFormat(trimmedContent)) {
    return 'markdown'
  }

  // Check for code format (enhanced detection)
  if (isCodeFormat(trimmedContent)) {
    return 'code'
  }

  // Check for Microsoft Word-like rich text patterns
  if (isWordRichTextFormat(trimmedContent)) {
    return 'word'
  }

  // Check for general rich text patterns
  if (isRichTextFormat(trimmedContent)) {
    return 'rich'
  }

  // Default to plain text
  return 'plain'
}

/**
 * Detect if content is HTML format
 */
function isHTMLFormat(content: string): boolean {
  // Check for HTML document structure
  if (content.includes('<!DOCTYPE') || content.includes('<html')) {
    return true
  }

  // Check for common HTML tags
  const htmlTags = [
    /<(div|span|p|h[1-6]|ul|ol|li|table|tr|td|th|img|a|strong|em|b|i)\b[^>]*>/i,
    /<\/(div|span|p|h[1-6]|ul|ol|li|table|tr|td|th|img|a|strong|em|b|i)>/i
  ]

  const htmlTagCount = htmlTags.filter(regex => regex.test(content)).length
  
  // Check for HTML attributes
  const hasAttributes = /<\w+\s+[^>]*\w+\s*=\s*["'][^"']*["'][^>]*>/i.test(content)
  
  // Check for self-closing tags
  const hasSelfClosing = /<\w+[^>]*\/>/i.test(content)
  
  // If we have multiple HTML indicators, it's likely HTML
  return htmlTagCount >= 1 && (hasAttributes || hasSelfClosing || content.includes('</'))
}

/**
 * Detect if content is a full HTML document vs HTML fragments
 */
function isHTMLDocument(content: string): boolean {
  return content.includes('<!DOCTYPE') || 
         content.includes('<html') || 
         content.includes('<head') || 
         content.includes('<body')
}

/**
 * Detect if content is XML format (strict detection)
 */
function isXMLFormat(content: string): boolean {
  // Must start with XML declaration
  if (content.startsWith('<?xml')) {
    return true
  }
  
  // Check for well-formed XML structure
  if (content.startsWith('<') && content.endsWith('>')) {
    // Must not be HTML
    if (isHTMLDocument(content) || isHTMLFormat(content)) {
      return false
    }
    
    // Check for XML-like structure with proper tags
    const xmlPatterns = [
      /<\w+[^>]*>[\s\S]*<\/\w+>/,  // Has opening and closing tags
      /<\w+[^>]*\/>/,              // Has self-closing tags
      /<\w+:[^>]*>/,               // Has namespaced tags
    ]
    
    // Must have at least one XML pattern and proper tag structure
    const hasXMLPattern = xmlPatterns.some(pattern => pattern.test(content))
    
    // Check if it has balanced tags (basic check)
    const openTags = (content.match(/<\w+[^>]*>/g) || []).length
    const closeTags = (content.match(/<\/\w+>/g) || []).length
    const selfClosingTags = (content.match(/<\w+[^>]*\/>/g) || []).length
    
    // For valid XML, open tags should roughly equal close tags + self-closing tags
    const isBalanced = Math.abs(openTags - closeTags - selfClosingTags) <= 1
    
    return hasXMLPattern && isBalanced
  }
  
  return false
}

/**
 * Detect if content is Markdown format
 */
function isMarkdownFormat(content: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m,           // Headers (# ## ### etc) - most important
    /^\*{3,}$/m,                // Horizontal rules (asterisks)
    /^-{3,}$/m,                 // Horizontal rules (dashes)
    /^_{3,}$/m,                 // Horizontal rules (underscores)
    /^\s*[-*+]\s+.+$/m,         // Unordered lists (but not bullet points •)
    /^\s*\d+\.\s+.+$/m,         // Ordered lists
    /\[.+?\]\(.+?\)/,           // Links [text](url)
    /!\[.*?\]\(.+?\)/,          // Images ![alt](url)
    /```[\s\S]*?```/,           // Code blocks
    /`[^`\n]+`/,                // Inline code
    /^\s*>.+$/m,                // Blockquotes
    /\*{1,2}[^*\n]+\*{1,2}/,    // Bold/italic (asterisks)
    /_{1,2}[^_\n]+_{1,2}/,      // Bold/italic (underscores)
    /~~[^~\n]+~~/,              // Strikethrough
    /^\s*\|.+\|.*$/m,           // Tables
    /^\s*-+\s*\|\s*-+/m,        // Table separators
    /\[[xX\s]\]/,               // Task lists
  ]

  // Exclude content that has bullet points (•) which are not markdown
  if (content.includes('•')) {
    // If it has bullet points, it's likely formatted text, not markdown
    return false
  }

  const markdownScore = markdownPatterns.filter(pattern => pattern.test(content)).length
  
  // Check for common markdown document structure
  const hasMarkdownStructure = /^#\s+.+(\n|$)/.test(content) || // Title at start
                               content.split('\n').some(line => /^#{1,6}\s/.test(line)) // Any header

  // Special case: if content starts with a header (like "# OverKill"), it's very likely Markdown
  const startsWithHeader = /^#{1,6}\s+.+/.test(content.trim())
  
  // More lenient detection - if it starts with a header, that's a strong indicator
  if (startsWithHeader) {
    return true
  }
  
  // Require lower threshold for markdown detection
  return markdownScore >= 2 || (markdownScore >= 1 && hasMarkdownStructure)
}

/**
 * Detect if content is code format
 */
function isCodeFormat(content: string): boolean {
  const codePatterns = [
    // JavaScript/TypeScript
    /^(function|const|let|var|class|interface|type|export|import|return)\s/m,
    /=>\s*{?/,                  // Arrow functions
    /\(\)\s*=>/,                // Arrow function syntax
    /[{};]\s*$/m,               // Code block endings
    
    // Comments
    /^[\s]*\/\//m,              // Single line comments
    /^[\s]*\/\*/m,              // Block comments start
    /\*\/\s*$/m,                // Block comments end
    /^[\s]*#/m,                 // Python/shell comments
    
    // Common programming constructs
    /\bif\s*\(/,                // If statements
    /\bfor\s*\(/,               // For loops
    /\bwhile\s*\(/,             // While loops
    /\btry\s*{/,                // Try blocks
    /\bcatch\s*\(/,             // Catch blocks
    
    // Data structures
    /\[\s*\]/,                  // Empty arrays
    /{\s*}/,                    // Empty objects
    /:\s*["\d[{]/,            // Object properties
    
    // HTML/XML in code context
    /<[^>]+>/,                  // Tags (but check if it's actual code)
    
    // CSS
    /[.#][\w-]+\s*{/,           // CSS selectors
    /:\s*[^;]+;/,               // CSS properties
    
    // SQL
    /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i,
    
    // Other languages
    /\bpublic\s+class\b/,       // Java
    /\bdef\s+\w+\(/,            // Python functions
    /\bfn\s+\w+\(/,             // Rust functions
  ]

  const codeScore = codePatterns.filter(pattern => pattern.test(content)).length
  
  // Check for high density of programming symbols
  const symbolDensity = (content.match(/[{}();=]/g) || []).length / content.length
  const hasHighSymbolDensity = symbolDensity > 0.05
  
  // Check for indentation patterns common in code
  const lines = content.split('\n')
  const indentedLines = lines.filter(line => /^\s{2,}/.test(line)).length
  const hasCodeIndentation = indentedLines > lines.length * 0.3
  
  return codeScore >= 3 || (codeScore >= 2 && (hasHighSymbolDensity || hasCodeIndentation))
}

/**
 * Detect if content is Microsoft Word rich text format
 */
function isWordRichTextFormat(content: string): boolean {
  const wordPatterns = [
    // Word-specific formatting
    /mso-/i,                    // Microsoft Office styles
    /font-family:\s*["']?Times New Roman/i,
    /font-family:\s*["']?Calibri/i,
    /font-family:\s*["']?Arial/i,
    
    // Word HTML export patterns
    /<o:p>/i,                   // Word paragraph tags
    /<w:/i,                     // Word XML namespace
    /class=["']?Mso/i,          // Word CSS classes
    
    // Common Word formatting
    /text-indent:\s*-?\d+/i,    // Text indentation
    /margin-left:\s*\d+/i,      // Left margins
    /line-height:\s*\d+%/i,     // Line height percentages
    
    // Word list formatting
    /mso-list:/i,               // Word list styles
    /level\d+/i,                // Word outline levels
  ]

  return wordPatterns.filter(pattern => pattern.test(content)).length >= 2
}

/**
 * Detect if content is general rich text format
 */
function isRichTextFormat(content: string): boolean {
  const richTextPatterns = [
    // Inline styling
    /style\s*=\s*["'][^"']*["']/i,
    /font-weight:\s*(bold|[5-9]\d\d)/i,
    /font-style:\s*italic/i,
    /text-decoration:\s*underline/i,
    /color:\s*#[0-9a-f]{3,6}/i,
    /background-color:/i,
    
    // Rich text elements
    /<(strong|em|u|strike|sup|sub)\b/i,
    /<font\b/i,
    
    // Formatted lists with styling
    /<[uo]l[^>]*style/i,
    /<li[^>]*style/i,
  ]

  return richTextPatterns.filter(pattern => pattern.test(content)).length >= 2
}

/**
 * Detect if content is CSV format
 */
function isCSVFormat(content: string): boolean {
  const lines = content.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) return false
  
  // Check if most lines have the same number of commas/separators
  const separators = [',', ';', '\t']
  
  for (const sep of separators) {
    const counts = lines.map(line => (line.match(new RegExp(`\\${sep}`, 'g')) || []).length)
    const firstCount = counts[0]
    
    if (firstCount > 0) {
      const consistentCount = counts.filter(count => count === firstCount).length
      const consistency = consistentCount / counts.length
      
      if (consistency > 0.8) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Detect content format from clipboard data
 */
export const detectClipboardFormat = (clipboardData: DataTransfer): ContentFormat => {
  // Check for HTML content
  if (clipboardData.types.includes('text/html')) {
    const htmlContent = clipboardData.getData('text/html')
    if (htmlContent) {
      return detectContentFormat(htmlContent)
    }
  }
  
  // Check for RTF content
  if (clipboardData.types.includes('text/rtf')) {
    return 'rtf'
  }
  
  // Check for plain text
  if (clipboardData.types.includes('text/plain')) {
    const textContent = clipboardData.getData('text/plain')
    return detectContentFormat(textContent)
  }
  
  return 'plain'
}

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
} 