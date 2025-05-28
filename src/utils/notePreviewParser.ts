import { PreviewBlock, Note } from '../store/useStore'

export function parseNotePreview(htmlContent: string): PreviewBlock[] {
  const preview: PreviewBlock[] = []
  
  if (!htmlContent || htmlContent.trim() === '') {
    return preview
  }
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Check if parsing resulted in error
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      // If HTML parsing failed, treat as plain text
      preview.push({
        type: 'text',
        content: htmlContent.slice(0, 150)
      })
      return preview
    }
    
    // Extract first 3-4 content blocks
    const elements = doc.body.children
    
    // If no HTML elements, treat as plain text
    if (elements.length === 0 && doc.body.textContent) {
      preview.push({
        type: 'text',
        content: doc.body.textContent.slice(0, 150)
      })
      return preview
    }
    
    for (let i = 0; i < Math.min(elements.length, 4); i++) {
      const el = elements[i]
      
      // Parse different content types
      if (el.tagName === 'UL' && el.classList.contains('task-list')) {
        const tasks = el.querySelectorAll('li')
        const completed = el.querySelectorAll('input[type="checkbox"]:checked').length
        preview.push({
          type: 'checklist',
          completed,
          total: tasks.length
        })
      } else if (el.tagName === 'PRE') {
        const code = el.querySelector('code')
        const language = code?.className.match(/language-(\w+)/)?.[1] || 'code'
        const codeContent = code?.textContent || el.textContent || ''
        preview.push({
          type: 'code',
          language,
          preview: codeContent.slice(0, 50) + (codeContent.length > 50 ? '...' : '')
        })
      } else if (el.tagName === 'UL' || el.tagName === 'OL') {
        preview.push({
          type: 'list',
          items: el.querySelectorAll('li').length
        })
      } else if (el.tagName === 'P') {
        const links = el.querySelectorAll('a')
        if (links.length > 0) {
          preview.push({
            type: 'link',
            url: links[0].href
          })
        } else if (el.textContent && el.textContent.trim()) {
          preview.push({
            type: 'text',
            content: el.textContent.slice(0, 150)
          })
        }
      } else if (el.textContent && el.textContent.trim()) {
        // Handle other elements with text content
        preview.push({
          type: 'text',
          content: el.textContent.slice(0, 150)
        })
      }
    }
  } catch (error) {
    console.error('Error parsing note preview:', error)
    // Fallback to plain text
    preview.push({
      type: 'text',
      content: htmlContent.replace(/<[^>]*>/g, '').slice(0, 150)
    })
  }
  
  return preview
}

export function calculateNoteMetadata(htmlContent: string, updatedAt: Date): Note['metadata'] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const text = doc.body.textContent || ''
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  
  const checkboxes = doc.querySelectorAll('input[type="checkbox"]')
  const checkedBoxes = doc.querySelectorAll('input[type="checkbox"]:checked')
  
  return {
    wordCount,
    lastEditedRelative: formatRelativeTime(updatedAt),
    hasCheckboxes: checkboxes.length > 0,
    taskCount: checkboxes.length,
    completedTasks: checkedBoxes.length,
    completionPercentage: checkboxes.length > 0 
      ? Math.round((checkedBoxes.length / checkboxes.length) * 100)
      : 0,
    hasAttachments: htmlContent.includes('<img'),
    hasCode: htmlContent.includes('<pre>'),
    hasLinks: htmlContent.includes('<a ')
  }
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return date.toLocaleDateString()
} 