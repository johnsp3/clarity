import React, { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { ContentFormat } from '../../types/editor'
import { PreviewHeader } from './preview/PreviewHeader'
import { getPreviewClassName, getPreviewStyles } from './preview/previewStyles'

interface ContentPreviewProps {
  content: string
  format: ContentFormat
  isVisible: boolean
  onContentUpdate?: (html: string) => void
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({ 
  content,
  format,
  isVisible,
  onContentUpdate
}) => {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewContent, setPreviewContent] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  // Configure marked options for better markdown rendering
  marked.setOptions({
    breaks: true,
    gfm: true
  })

  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Add image error handling to rendered content
  const addImageErrorHandling = (html: string): string => {
    return html.replace(
      /<img([^>]*)>/g,
      '<img$1 onerror="this.onerror=null; this.src=\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==\'; this.alt=\'Image not available\';">'
    )
  }

  useEffect(() => {
    if (!content) {
      setPreviewContent('')
      return
    }

    console.log('🎨 [ContentPreview] Rendering content as format:', format)
    console.log('📄 [ContentPreview] Content preview:', content.substring(0, 200))

    let renderedContent = ''
    
    try {
      switch (format) {
        case 'markdown':
          // Parse markdown to HTML
          try {
            console.log('📝 [ContentPreview] Parsing Markdown content')
            
            // Validate markdown content
            if (typeof content !== 'string') {
              throw new Error('Content must be a string for markdown parsing')
            }
            
            renderedContent = marked(content) as string
            
            // Validate the parsed result
            if (!renderedContent) {
              throw new Error('Markdown parsing resulted in empty content')
            }
            
            // Add image error handling
            renderedContent = addImageErrorHandling(renderedContent)
            
            console.log('✅ [ContentPreview] Markdown successfully rendered')
          } catch (error) {
            console.error('❌ [ContentPreview] Markdown parsing error:', error)
            renderedContent = `
              <div class="error-preview">
                <h3>Markdown Parsing Error</h3>
                <p>Failed to parse the markdown content.</p>
                <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
              </div>
            `
          }
          break
          
        default:
          // For any other format, display as plain text
          console.log('📄 [ContentPreview] Rendering as plain text (default)')
          renderedContent = `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(content)}</pre>`
          break
      }
    } catch (error) {
      console.error('❌ [ContentPreview] Unexpected error during rendering:', error)
      renderedContent = `<div class="error-preview">
        <h3>Preview Error</h3>
        <p>An unexpected error occurred while rendering the preview.</p>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>`
    }
    
    // Final validation
    if (!renderedContent) {
      console.warn('⚠️ [ContentPreview] Rendered content is empty, using fallback')
      renderedContent = '<p class="text-gray-500">No content to preview</p>'
    }
    
    setPreviewContent(renderedContent)
    
    // Notify parent of the rendered content
    if (onContentUpdate) {
      onContentUpdate(renderedContent)
    }
    
    console.log('🎯 [ContentPreview] Preview update complete')
  }, [content, format, onContentUpdate])

  const handleCopy = async () => {
    if (!previewRef.current) return
    
    try {
      // Get the formatted text content from the preview
      const formattedText = previewRef.current.innerText || previewRef.current.textContent || ''
      
      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText)
      
      // Show success state
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy content:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="w-1/2 h-full border-l border-[#E5E5E7] bg-[#FAFAFA] flex flex-col">
      <PreviewHeader 
        format={format}
        isCopied={isCopied}
        onCopy={handleCopy}
      />

      {/* Preview Content */}
      <div 
        ref={previewRef}
        className={`flex-1 px-8 py-6 overflow-y-auto ${getPreviewClassName(format)}`}
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />

      <style>{getPreviewStyles()}</style>
    </div>
  )
} 