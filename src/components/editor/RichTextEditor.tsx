import React, { useState, useEffect, useRef } from 'react'
import { 
  Bold, Italic, Code, Quote,
  List, Link2,
  FileText, FileDown, Eye, EyeOff,
  Save, Heading1, Heading2,
  Printer, Upload
} from 'lucide-react'

import { Note } from '../../store/useStore'
import { FormatBadge } from '../FormatBadge'
import { StatusBar } from './StatusBar'
import { ContentPreview } from './ContentPreview'
import { NoteTagEditor } from '../NoteTagEditor'
import { calculateReadingTime } from '../../utils/format-detector'

import { ContentFormat } from '../../types/editor'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { PrintPreview } from './PrintPreview'
import { useOptimizedEditor } from '../../hooks/useOptimizedEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorToolbar } from './EditorToolbar'
import { AIEdit } from '../AIEdit'

interface RichTextEditorProps {
  note: Note
  onUpdate: (updates: Partial<Note>) => void
  onShowImport?: () => void
  onExportNotes?: () => void
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ note, onUpdate, onShowImport }) => {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [detectedFormat, setDetectedFormat] = useState<ContentFormat>('plain')
  const [showFormatBadge, setShowFormatBadge] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [previewOnlyContent, setPreviewOnlyContent] = useState<string | null>(null)

  const previewContentRef = useRef<string>('')

  // Format timestamp for display
  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    // If it's today, show time
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    }
    
    // If it's yesterday
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    }
    
    // If it's within this year, don't show year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Calculate time since creation
  const getTimeSinceCreation = (): string => {
    const diffMs = note.updatedAt.getTime() - note.createdAt.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) return 'just created'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} after creation`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} after creation`
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} after creation`
    
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} after creation`
    
    const diffYears = Math.floor(diffMonths / 12)
    return `${diffYears} year${diffYears > 1 ? 's' : ''} after creation`
  }

  // Initialize optimized Tiptap editor
  const editor = useOptimizedEditor({
    content,
    noteId: note.id,
    onChange: (newContent: string) => {
      setContent(newContent)
      onUpdate({ content: newContent })
      
      // Simulate saving
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setLastSaved(new Date())
      }, 500)
    }
  })

  // Update state when note changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    // Update editor content when note changes
    if (editor && note.content !== content) {
      editor.commands.setContent(note.content || '')
    }
  }, [note.id, note.title, note.content, editor, content])

  // Calculate stats only (no automatic format detection)
  useEffect(() => {
    // Calculate stats using the raw content for accurate word count
    const plainTextForStats = editor ? editor.getText() : content.replace(/<[^>]*>/g, '')
    const words = plainTextForStats.trim().split(/\s+/).filter((word: string) => word.length > 0).length
    const chars = plainTextForStats.length
    setWordCount(words)
    setCharCount(chars)
  }, [content, editor])

  // Function to manually set format after AI conversion
  const setFormatAfterConversion = (format: ContentFormat) => {
    setDetectedFormat(format)
    setShowFormatBadge(true)
    
    // Hide badge after showing it
    setTimeout(() => {
      setShowFormatBadge(false)
    }, 3000)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    onUpdate({ title: newTitle })
  }

  const insertText = (before: string, after: string = '') => {
    if (!editor) return
    
    // For Tiptap, we'll insert raw text/HTML depending on the format
    const selection = editor.state.selection
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to, '')
    
    editor.chain()
      .focus()
      .insertContent(before + selectedText + after)
      .run()
  }

  const insertAtLineStart = (prefix: string) => {
    if (!editor) return
    
    // For line start insertions, we'll use Tiptap commands
    editor.chain()
      .focus()
      .insertContent(prefix)
      .run()
  }

  const stats = {
    words: wordCount,
    characters: charCount,
    readingTime: calculateReadingTime(content),
    format: detectedFormat,
  }

  const exportDocument = (format: 'html' | 'preview-html' | 'markdown' | 'txt' | 'pdf') => {
    let exportContent = ''
    let mimeType = ''
    let extension = ''

    // Use the preview content for export
    const previewHtml = previewContentRef.current || content

    switch (format) {
      case 'html':
        exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Untitled'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.75; color: #1A1A1A; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; color: #1A1A1A; }
    h1 { font-size: 2.25rem; border-bottom: 1px solid #E5E5E7; padding-bottom: 0.5rem; }
    h2 { font-size: 1.875rem; border-bottom: 1px solid #E5E5E7; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }
    p { margin-bottom: 20px; color: #4A4A4A; }
    ul, ol { margin-bottom: 20px; padding-left: 2em; }
    li { margin-bottom: 8px; color: #4A4A4A; }
    blockquote { margin: 20px 0; padding: 12px 20px; color: #6B6B6B; border-left: 4px solid #E5E5E7; background-color: #F9F9F9; font-style: italic; }
    code { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: #F5F5F5; border: 1px solid #E5E5E7; border-radius: 3px; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; }
    pre { margin: 20px 0; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #F8F8F8; border: 1px solid #E5E5E7; border-radius: 6px; }
    pre code { padding: 0; background-color: transparent; border: none; font-size: 100%; color: #333; }
    a { color: #0F62FE; text-decoration: underline; transition: color 0.15s ease; }
    a:hover { color: #0043CE; }
    img { max-width: 100%; margin: 20px 0; border: 1px solid #E5E5E7; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #E5E5E7; background-color: white; }
    th, td { padding: 12px 16px; border: 1px solid #E5E5E7; }
    th { background-color: #F8F8F8; font-weight: 600; text-align: left; }
    tbody tr:hover { background-color: #F9F9F9; }
    hr { height: 1px; padding: 0; margin: 32px 0; background-color: #E5E5E7; border: 0; }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${previewHtml}
</body>
</html>`
        mimeType = 'text/html'
        extension = 'html'
        break
      case 'preview-html':
        // Export the beautiful rendered preview as HTML with styling
        exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Untitled'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.75; color: #1A1A1A; background-color: #FAFAFA; }
    .container { background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; color: #1A1A1A; }
    h1 { font-size: 2.25rem; border-bottom: 1px solid #E5E5E7; padding-bottom: 0.5rem; }
    h2 { font-size: 1.875rem; border-bottom: 1px solid #E5E5E7; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }
    p { margin-bottom: 20px; color: #4A4A4A; }
    ul, ol { margin-bottom: 20px; padding-left: 2em; }
    li { margin-bottom: 8px; color: #4A4A4A; }
    li::marker { color: #6B6B6B; }
    blockquote { margin: 20px 0; padding: 12px 20px; color: #6B6B6B; border-left: 4px solid #E5E5E7; background-color: #F9F9F9; font-style: italic; }
    code { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: #F5F5F5; border: 1px solid #E5E5E7; border-radius: 3px; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; }
    pre { margin: 20px 0; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #F8F8F8; border: 1px solid #E5E5E7; border-radius: 6px; }
    pre code { padding: 0; background-color: transparent; border: none; font-size: 100%; color: #333; }
    a { color: #0F62FE; text-decoration: underline; transition: color 0.15s ease; }
    a:hover { color: #0043CE; }
    img { max-width: 100%; margin: 20px 0; border: 1px solid #E5E5E7; border-radius: 6px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #E5E5E7; background-color: white; border-radius: 6px; overflow: hidden; }
    th, td { padding: 12px 16px; border: 1px solid #E5E5E7; }
    th { background-color: #F8F8F8; font-weight: 600; text-align: left; }
    tbody tr:hover { background-color: #F9F9F9; }
    hr { height: 1px; padding: 0; margin: 32px 0; background-color: #E5E5E7; border: 0; }
    /* Task list styles */
    input[type="checkbox"] { margin-right: 8px; transform: scale(1.1); }
    li:has(input[type="checkbox"]) { list-style: none; margin-left: -1.5em; }
    /* Missing image placeholder */
    .missing-image { display: inline-block; padding: 20px; background-color: #F5F5F7; border: 2px dashed #D2D2D7; border-radius: 8px; color: #86868B; text-align: center; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title || 'Untitled'}</h1>
    ${previewHtml}
  </div>
</body>
</html>`
        mimeType = 'text/html'
        extension = 'html'
        break
      case 'markdown': {
        // Export the beautiful rendered preview as Markdown
        // Use the preview HTML content and convert it to clean Markdown
        const previewHtmlForMarkdown = previewContentRef.current || content
        exportContent = convertHtmlToMarkdown(previewHtmlForMarkdown, title || 'Untitled')
        mimeType = 'text/markdown'
        extension = 'md'
        break
      }
      case 'txt': {
        // For text export, convert HTML to plain text
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = previewHtml
        const plainText = tempDiv.textContent || tempDiv.innerText || ''
        exportContent = `${title || 'Untitled'}\n\n${plainText}`
        mimeType = 'text/plain'
        extension = 'txt'
        break
      }
      case 'pdf':
        // For PDF, we'll use the print preview
        setShowPrintPreview(true)
        return
    }

    const blob = new Blob([exportContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'untitled'}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Update preview content ref
  const updatePreviewContent = (html: string) => {
    previewContentRef.current = html
  }

  const convertHtmlToMarkdown = (htmlContent: string, title: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Start with the note title, but don't duplicate if it's already in content
    let markdown = ''
    const contentText = tempDiv.textContent || ''
    if (!contentText.toLowerCase().includes(title.toLowerCase())) {
      markdown = `# ${title}\n\n`
    }
    
    // Convert HTML elements to Markdown (helper function - currently using extractMarkdownFromElement instead)
    
    // Track if we've seen the first heading to make it the main title
    let firstHeadingSeen = false
    
    // Simplified approach: extract the visible text content and structure it properly
    const extractMarkdownFromElement = (element: Element): string => {
      let result = ''
      
      // Handle different element types
      const tagName = element.tagName.toLowerCase()
      const textContent = element.textContent?.trim() || ''
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          if (!firstHeadingSeen) {
            // Make the first heading the main title
            result += `# ${textContent}\n\n`
            firstHeadingSeen = true
          } else {
            // Subsequent headings are subheadings
            result += `## ${textContent}\n\n`
          }
          break
        case 'p':
          if (textContent) {
            result += `${textContent}\n\n`
          }
          break
        case 'ul':
          Array.from(element.children).forEach(li => {
            const liText = li.textContent?.trim() || ''
            if (liText) {
              result += `- ${liText}\n`
            }
          })
          result += '\n'
          break
        case 'ol':
          Array.from(element.children).forEach((li, index) => {
            const liText = li.textContent?.trim() || ''
            if (liText) {
              result += `${index + 1}. ${liText}\n`
            }
          })
          result += '\n'
          break
        case 'blockquote':
          if (textContent) {
            result += `> ${textContent}\n\n`
          }
          break
        case 'pre':
        case 'code':
          if (textContent) {
            result += `\`\`\`\n${textContent}\n\`\`\`\n\n`
          }
          break
        case 'hr':
          result += '---\n\n'
          break
        default:
          // For other elements, process children
          Array.from(element.children).forEach(child => {
            result += extractMarkdownFromElement(child)
          })
          break
      }
      
      return result
    }
    
    // Process all top-level elements
    Array.from(tempDiv.children).forEach(element => {
      markdown += extractMarkdownFromElement(element)
    })
    
    // If no structured content found, fall back to plain text with proper formatting
    if (!markdown.trim()) {
      const plainText = tempDiv.textContent?.trim() || ''
      if (plainText) {
        // Try to detect if it's a simple list format
        const lines = plainText.split('\n').map(line => line.trim()).filter(line => line)
        if (lines.length > 1) {
          // Check if it looks like a title + list
          const firstLine = lines[0]
          const restLines = lines.slice(1)
          
          markdown += `# ${firstLine}\n\n`
          restLines.forEach(line => {
            if (line.startsWith('-') || line.startsWith('•')) {
              markdown += `- ${line.replace(/^[-•]\s*/, '')}\n`
            } else {
              markdown += `- ${line}\n`
            }
          })
          markdown += '\n'
        } else {
          markdown += plainText + '\n\n'
        }
      }
    }
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()
    
    return markdown
  }

  const getFormatDisplayName = (format: ContentFormat): string => {
    switch (format) {
      case 'markdown':
        return 'Markdown Format'
      case 'html':
        return 'HTML'
      case 'code':
        return 'Code'
      case 'rich':
        return 'Rich Text'
      case 'word':
        return 'Word Document'
      case 'docx':
        return 'Word DOCX'
      case 'rtf':
        return 'Rich Text Format'
      case 'json':
        return 'JSON'
      case 'xml':
        return 'XML'
      case 'csv':
        return 'CSV Data'
      case 'plain':
        return 'Plain Text'
      default:
        return (format as string).charAt(0).toUpperCase() + (format as string).slice(1)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Fixed Professional Toolbar */}
      <div className="border-b border-[#E5E5E7] bg-white flex-shrink-0">
        {/* Main Toolbar */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Quick Insert Tools for Raw Formats */}
            <div className="flex items-center gap-0.5 mr-2">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 
                                   transition-colors text-sm font-medium flex items-center gap-1.5">
                    Quick Insert
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                    sideOffset={5}
                  >
                    <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-gray-500">
                      Markdown
                    </DropdownMenu.Label>
                    <DropdownMenu.Item 
                      onClick={() => insertText('# ')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Heading1 size={14} />
                      Heading 1
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('## ')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Heading2 size={14} />
                      Heading 2
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('**', '**')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Bold size={14} />
                      Bold
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('*', '*')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Italic size={14} />
                      Italic
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('[', '](url)')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Link2 size={14} />
                      Link
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('`', '`')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Code size={14} />
                      Inline Code
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('```\n', '\n```')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Code size={14} />
                      Code Block
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertAtLineStart('- ')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <List size={14} />
                      List Item
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertAtLineStart('> ')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Quote size={14} />
                      Quote
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                    
                    <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-gray-500">
                      HTML
                    </DropdownMenu.Label>
                    <DropdownMenu.Item 
                      onClick={() => insertText('<h1>', '</h1>')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      &lt;h1&gt; Heading
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('<p>', '</p>')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      &lt;p&gt; Paragraph
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('<strong>', '</strong>')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      &lt;strong&gt; Bold
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      onClick={() => insertText('<a href="">', '</a>')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                    >
                      &lt;a&gt; Link
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Format Info - Only shown after conversion */}
            {detectedFormat !== 'plain' && (
              <div className="px-3 py-1 rounded bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                <span>Format: <span className="font-medium">{getFormatDisplayName(detectedFormat)}</span></span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">Converted</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Save Status */}
            {isSaving ? (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Save size={12} className="animate-pulse" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-xs text-gray-500">
                Saved {formatTimestamp(lastSaved)}
              </span>
            ) : null}

            <div className="w-px h-6 bg-gray-200" />

            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                       flex items-center gap-1.5 ${
                showPreview 
                  ? 'bg-[#E5F0FF] text-[#0F62FE]' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              Preview
            </button>

            {/* Import/Export Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 
                               transition-colors text-sm font-medium flex items-center gap-1.5">
                  <FileDown size={14} />
                  Import/Export
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[160px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                  sideOffset={5}
                >
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('html')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export as HTML
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('preview-html')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export Preview as HTML
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('txt')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export as Text
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('markdown')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export Preview as Markdown
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('pdf')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Printer size={14} className="text-gray-600" />
                    Print to PDF
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  
                  <DropdownMenu.Label className="px-3 py-1.5 text-xs font-medium text-gray-500">
                    File Operations
                  </DropdownMenu.Label>
                  <DropdownMenu.Item 
                    onClick={onShowImport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload size={14} className="text-gray-600" />
                    Import Notes
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* AI Edit */}
            <AIEdit 
              content={content}
              onRewrite={(newContent, format) => {
                console.log(`🎯 [RichTextEditor] AI transformation received:`, {
                  format,
                  contentLength: newContent.length,
                  contentPreview: newContent.substring(0, 100)
                })
                
                // For markdown transformations, update the content
                if (format === 'markdown') {
                  setContent(newContent)
                  onUpdate({ content: newContent })
                  
                  // Clear any preview-only content
                  setPreviewOnlyContent(null)
                  
                  if (editor) {
                    console.log(`📝 [RichTextEditor] Updating content for markdown transformation`)
                    
                    // Clear the editor first to ensure clean state
                    editor.commands.clearContent()
                    
                    // Insert the transformed content
                    editor.commands.insertContent({
                      type: 'paragraph',
                      content: [{
                        type: 'text',
                        text: newContent
                      }]
                    })
                    
                    // Ensure the editor doesn't try to parse it as HTML
                    editor.setOptions({
                      parseOptions: {
                        preserveWhitespace: 'full'
                      }
                    })
                    
                    console.log('✅ [RichTextEditor] Content updated in editor')
                  }
                  
                  // Set format after conversion
                  setFormatAfterConversion('markdown' as ContentFormat)
                  
                  // Automatically show preview
                  if (!showPreview) {
                    console.log('👁️ [RichTextEditor] Auto-enabling preview for markdown transformation')
                    setShowPreview(true)
                  }
                } else {
                  // For other transformations (tone changes, etc), use normal content setting
                  setContent(newContent)
                  onUpdate({ content: newContent })
                  setPreviewOnlyContent(null)
                  
                  if (editor) {
                    editor.commands.setContent(newContent)
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Secondary Toolbar - Note Info */}
        <div className="px-4 py-2 border-t border-[#E5E5E7] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Note Type */}
            <span className="text-xs text-gray-500 font-medium uppercase">
              RICH TEXT EDITOR
            </span>
            
            {/* Tags */}
            <NoteTagEditor noteId={note.id} noteTags={note.tags} />
          </div>

          {/* Format Detection Badge */}
          {showFormatBadge && (
            <FormatBadge 
              content={content}
              format={detectedFormat} 
              visible={showFormatBadge} 
            />
          )}
        </div>
        
        {/* Tiptap Toolbar */}
        <EditorToolbar editor={editor} />
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'}`}>
          {/* Title Input */}
          <div className="px-8 pt-8 pb-4">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 
                       focus:outline-none bg-transparent"
            />
            
            {/* Timestamp Display */}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="group-hover:text-gray-700 transition-colors" 
                      title={note.createdAt.toLocaleString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}>
                  Created: {formatTimestamp(note.createdAt)}
                </span>
              </div>
              
              <div className="w-px h-4 bg-gray-300" />
              
              <div className="flex items-center gap-1.5 group">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="group-hover:text-gray-700 transition-colors"
                      title={note.updatedAt.toLocaleString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) + ` (${getTimeSinceCreation()})`}>
                  Modified: {formatTimestamp(note.updatedAt)}
                  {note.createdAt.getTime() !== note.updatedAt.getTime() && (
                    <span className="text-gray-400 ml-1">({getTimeSinceCreation()})</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Tiptap Editor */}
          <div className="flex-1">
            <TiptapEditor editor={editor} />
          </div>
        </div>

        {/* Preview Panel */}
        <ContentPreview 
          content={previewOnlyContent || content}
          format={detectedFormat}
          isVisible={showPreview}
          onContentUpdate={updatePreviewContent}
        />
      </div>

      {/* Status Bar */}
      <StatusBar stats={stats} />

      {/* Print Preview Modal */}
      <PrintPreview 
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        content={previewContentRef.current}
        title={title}
      />
    </div>
  )
}
