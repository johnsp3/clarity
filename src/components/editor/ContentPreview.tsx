import React, { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { ContentFormat } from '../../types/editor'
import { PreviewHeader } from './preview/PreviewHeader'
import { getPreviewClassName, getPreviewStyles } from './preview/previewStyles'
import {
  escapeHtml,
  cleanWordContent,
  parseRTFContent,
  parseDocxContent,
  formatJSONContent,
  formatXMLContent,
  formatCSVContent,
  addImageErrorHandling
} from './preview/formatters'

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

  useEffect(() => {
    if (!content) {
      setPreviewContent('')
      return
    }

    console.log('🎨 Preview rendering content:', JSON.stringify(content.substring(0, 100)), 'as format:', format)

    let renderedContent = ''
    
    switch (format) {
      case 'markdown':
        // Parse markdown to HTML
        try {
          console.log('📝 Parsing Markdown content:', content)
          renderedContent = marked(content) as string
          
          // Add image error handling and fallback placeholders
          renderedContent = addImageErrorHandling(renderedContent)
          
          console.log('✅ Markdown rendered to:', renderedContent.substring(0, 100) + '...')
        } catch (error) {
          console.error('Markdown parsing error:', error)
          renderedContent = `<pre class="error-preview">Error parsing Markdown:\n${escapeHtml(content)}</pre>`
        }
        break
        
      case 'html':
        // For HTML, render it directly (it's already HTML)
        renderedContent = addImageErrorHandling(content)
        break
        
      case 'rich':
        // Rich text is already formatted HTML
        renderedContent = addImageErrorHandling(content)
        break

      case 'word':
        // Microsoft Word rich text - clean up and render
        renderedContent = cleanWordContent(content)
        break

      case 'rtf':
        // RTF format - show as formatted text with basic parsing
        renderedContent = parseRTFContent(content)
        break

      case 'docx':
        // DOCX/Word XML - extract and clean content
        renderedContent = parseDocxContent(content)
        break

      case 'json':
        // JSON format - pretty print with syntax highlighting
        renderedContent = formatJSONContent(content)
        break

      case 'xml':
        // XML format - pretty print with syntax highlighting
        renderedContent = formatXMLContent(content)
        break

      case 'csv':
        // CSV format - render as table
        renderedContent = formatCSVContent(content)
        break
        
      case 'code':
        // Wrap code in pre/code tags for proper display
        renderedContent = `<pre class="code-preview"><code>${escapeHtml(content)}</code></pre>`
        break
        
      case 'plain':
      default:
        // For plain text, preserve line breaks and wrap in paragraphs
        renderedContent = content
          .split('\n\n')
          .map(para => para.trim())
          .filter(para => para.length > 0)
          .map(para => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
          .join('\n')
        break
    }
    
    setPreviewContent(renderedContent)
    
    // Notify parent of the rendered content
    if (onContentUpdate) {
      onContentUpdate(renderedContent)
    }
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