import DOMPurify from 'isomorphic-dompurify'

// Configuration for different content types
const SANITIZE_CONFIGS = {
  // Strict: Only allow basic text formatting
  strict: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  },
  
  // Basic: Allow common formatting and links
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    KEEP_CONTENT: true,
  },
  
  // Rich: Allow most HTML but remove dangerous elements
  rich: {
    ALLOWED_TAGS: [
      'a', 'abbr', 'address', 'article', 'aside', 'b', 'blockquote', 'br', 'caption',
      'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
      'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'header', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main', 'mark', 'nav', 'ol',
      'p', 'pre', 'q', 's', 'section', 'small', 'span', 'strong', 'sub', 'summary',
      'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul'
    ],
    ALLOWED_ATTR: [
      'alt', 'class', 'colspan', 'datetime', 'dir', 'height', 'href', 'id', 'lang',
      'rel', 'rowspan', 'src', 'style', 'target', 'title', 'type', 'width'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  },
  
  // Markdown: Preserve markdown syntax
  markdown: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    // Don't sanitize markdown content, just escape HTML
    USE_PROFILES: { html: false }
  }
}

export type SanitizeLevel = keyof typeof SANITIZE_CONFIGS

/**
 * Sanitize user input based on the specified level
 */
export function sanitizeInput(input: string, level: SanitizeLevel = 'basic'): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  const config = SANITIZE_CONFIGS[level]
  
  // For markdown, just escape HTML entities
  if (level === 'markdown') {
    return escapeHtml(input)
  }
  
  return DOMPurify.sanitize(input, config)
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Sanitize filename to prevent directory traversal and other issues
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled'
  }
  
  // Remove any path separators and special characters
  return filename
    .replace(/[/\\:*?"<>|]/g, '-') // Replace invalid characters
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-{2,}/g, '-') // Remove multiple dashes
    .toLowerCase()
    .substring(0, 255) // Limit length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  try {
    const parsed = new URL(url)
    
    // Only allow http(s) and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null
    }
    
    return parsed.toString()
  } catch {
    // If it's not a valid URL, check if it's a relative path
    if (url.startsWith('/') && !url.includes('//')) {
      return sanitizeInput(url, 'strict')
    }
    
    return null
  }
}

/**
 * Sanitize JSON input
 */
export function sanitizeJson(jsonString: string): string | null {
  try {
    const parsed = JSON.parse(jsonString)
    // Re-stringify to remove any code execution attempts
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const trimmed = email.trim().toLowerCase()
  
  if (emailRegex.test(trimmed)) {
    return trimmed
  }
  
  return null
}

/**
 * Remove all HTML tags from content
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
  if (!text || text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Sanitize user-generated CSS
 */
export function sanitizeCss(css: string): string {
  if (!css || typeof css !== 'string') {
    return ''
  }
  
  // Remove any JavaScript execution attempts
  const dangerous = [
    'javascript:',
    'expression(',
    'behavior:',
    'vbscript:',
    '-moz-binding',
    '@import',
    '@charset'
  ]
  
  let sanitized = css
  dangerous.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  return sanitized
}

/**
 * Validate and sanitize hex color
 */
export function sanitizeHexColor(color: string): string | null {
  if (!color || typeof color !== 'string') {
    return null
  }
  
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  const trimmed = color.trim()
  
  if (hexRegex.test(trimmed)) {
    return trimmed.toLowerCase()
  }
  
  return null
} 