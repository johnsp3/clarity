import React, { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import { Editor } from '@tiptap/react'

interface MarkdownPreviewProps {
  editor: Editor | null
  isVisible: boolean
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  editor, 
  isVisible
}) => {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewContent, setPreviewContent] = useState('')

  useEffect(() => {
    if (!editor) return

    const updatePreview = () => {
      const html = editor.getHTML()
      setPreviewContent(html)
    }

    updatePreview()
    editor.on('update', updatePreview)

    return () => {
      editor.off('update', updatePreview)
    }
  }, [editor])

  // Synchronized scrolling
  useEffect(() => {
    if (!editor || !isVisible || !previewRef.current) return

    const editorElement = editor.view.dom.parentElement
    if (!editorElement) return

    const syncScroll = () => {
      if (previewRef.current && editorElement) {
        const scrollPercentage = editorElement.scrollTop / 
          (editorElement.scrollHeight - editorElement.clientHeight)
        
        previewRef.current.scrollTop = scrollPercentage * 
          (previewRef.current.scrollHeight - previewRef.current.clientHeight)
      }
    }

    editorElement.addEventListener('scroll', syncScroll)
    return () => editorElement.removeEventListener('scroll', syncScroll)
  }, [editor, isVisible])

  if (!isVisible) return null

  return (
    <div className="w-1/2 h-full border-l border-[#E5E5E7] bg-[#FAFAFA] flex flex-col">
      {/* Preview Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E7] bg-white">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} className="text-gray-500" />
          <span>Preview</span>
        </div>
      </div>

      {/* Preview Content */}
      <div 
        ref={previewRef}
        className="flex-1 px-8 py-6 overflow-y-auto prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />

      <style>{`
        /* Clean Professional Markdown Styles */
        .prose {
          color: #1A1A1A;
          line-height: 1.6;
          font-size: 14px;
        }
        
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
          color: #1A1A1A;
        }
        
        .prose h1 {
          font-size: 1.875rem;
          border-bottom: 1px solid #E5E5E7;
          padding-bottom: 0.5rem;
        }
        
        .prose h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid #E5E5E7;
          padding-bottom: 0.5rem;
        }
        
        .prose h3 {
          font-size: 1.25rem;
        }
        
        .prose p {
          margin-top: 0;
          margin-bottom: 16px;
          color: #4A4A4A;
        }
        
        .prose ul,
        .prose ol {
          margin-top: 0;
          margin-bottom: 16px;
          padding-left: 2em;
        }
        
        .prose li {
          margin-bottom: 4px;
          color: #4A4A4A;
        }
        
        .prose blockquote {
          margin: 16px 0;
          padding: 0 1em;
          color: #6B6B6B;
          border-left: 4px solid #E5E5E7;
        }
        
        .prose code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: #F5F5F5;
          border: 1px solid #E5E5E7;
          border-radius: 3px;
          font-family: 'SF Mono', Consolas, monospace;
        }
        
        .prose pre {
          margin-top: 0;
          margin-bottom: 16px;
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #F5F5F5;
          border: 1px solid #E5E5E7;
          border-radius: 4px;
        }
        
        .prose pre code {
          padding: 0;
          background-color: transparent;
          border: none;
          font-size: 100%;
        }
        
        .prose a {
          color: #0F62FE;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #0043CE;
        }
        
        .prose img {
          max-width: 100%;
          margin: 16px 0;
          border: 1px solid #E5E5E7;
          border-radius: 4px;
        }
        
        .prose hr {
          height: 1px;
          padding: 0;
          margin: 24px 0;
          background-color: #E5E5E7;
          border: 0;
        }
        
        .prose table {
          width: 100%;
          margin: 16px 0;
          border-collapse: collapse;
          border: 1px solid #E5E5E7;
        }
        
        .prose th,
        .prose td {
          padding: 8px 12px;
          border: 1px solid #E5E5E7;
        }
        
        .prose th {
          background-color: #F5F5F5;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
} 