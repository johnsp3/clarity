import React, { useState, useEffect, useRef } from 'react'
import { 
  Bold, Italic, Code, Quote,
  List, Link2,
  FileText, FileDown, Eye, EyeOff,
  Save, MoreVertical, Heading1, Heading2,
  Printer
} from 'lucide-react'

import { Note } from '../../store/useStore'
import { FormatBadge } from '../FormatBadge'
import { StatusBar } from './StatusBar'
import { ContentPreview } from './ContentPreview'
import { NoteTagEditor } from '../NoteTagEditor'
import { detectContentFormat, calculateReadingTime } from '../../utils/format-detector'
import { ContentFormat } from '../../types/editor'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { PrintPreview } from './PrintPreview'
import { ImportManager } from '../ImportManager'
import { useNoteEditor } from '../../hooks/useNoteEditor'
import { TiptapEditor } from './TiptapEditor'
import { EditorToolbar } from './EditorToolbar'
import { AIEdit } from '../AIEdit'

interface RichTextEditorProps {
  note: Note
  onUpdate: (updates: Partial<Note>) => void
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ note, onUpdate }) => {
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
  const previewContentRef = useRef<string>('')

  // Initialize Tiptap editor
  const editor = useNoteEditor(
    content, 
    (newContent) => {
      setContent(newContent)
      onUpdate({ content: newContent })
      
      // Simulate saving
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setLastSaved(new Date())
      }, 500)
    },
    (format) => {
      // Handle format detection from clipboard paste
      setDetectedFormat(format as ContentFormat)
      setShowFormatBadge(true)
      
      // Hide the badge after a few seconds
      setTimeout(() => {
        setShowFormatBadge(false)
      }, 4000)
    }
  )

  // Update state when note changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    // Update editor content when note changes
    if (editor && note.content !== content) {
      editor.commands.setContent(note.content || '')
    }
  }, [note.id, note.title, note.content, editor, content])

  // Detect content format
  useEffect(() => {
    const format = detectContentFormat(content)
    setDetectedFormat(format)
    
    // Calculate stats using editor text content
    if (editor) {
      const plainText = editor.getText()
      const words = plainText.trim().split(/\s+/).filter(word => word.length > 0).length
      const chars = plainText.length
      setWordCount(words)
      setCharCount(chars)
    }
  }, [content, editor])

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

  const exportDocument = (format: 'html' | 'markdown' | 'txt' | 'pdf') => {
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
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
    p { margin-bottom: 16px; line-height: 1.6; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #e5e5e7; padding-left: 16px; color: #666; }
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
      case 'markdown':
        // If it's already markdown, use raw content, otherwise convert
        if (detectedFormat === 'markdown') {
          exportContent = content
        } else {
          // Simple HTML to Markdown conversion
          exportContent = `# ${title || 'Untitled'}\n\n${content}`
        }
        mimeType = 'text/markdown'
        extension = 'md'
        break
      case 'txt':
        exportContent = `${title || 'Untitled'}\n\n${content}`
        mimeType = 'text/plain'
        extension = 'txt'
        break
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

  const getFormatDisplayName = (format: ContentFormat): string => {
    switch (format) {
      case 'markdown':
        return 'Markdown'
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
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Fixed Professional Toolbar */}
      <div className="border-b border-[#E5E5E7] bg-white">
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

            {/* Format Info */}
            <div className="px-3 py-1 rounded bg-gray-50 text-sm text-gray-600">
              Format: <span className="font-medium">{getFormatDisplayName(detectedFormat)}</span>
            </div>
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
                Saved {new Date(lastSaved).toLocaleTimeString()}
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

            {/* Export Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 
                               transition-colors text-sm font-medium flex items-center gap-1.5">
                  <FileDown size={14} />
                  Export
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
                    onClick={() => exportDocument('markdown')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export as Markdown
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('txt')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText size={14} className="text-gray-600" />
                    Export as Text
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item 
                    onClick={() => exportDocument('pdf')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Printer size={14} className="text-gray-600" />
                    Print to PDF
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Import Notes */}
            <ImportManager />

            {/* AI Edit */}
            <AIEdit 
              content={content}
              onRewrite={(newContent) => {
                setContent(newContent)
                onUpdate({ content: newContent })
                if (editor) {
                  editor.commands.setContent(newContent)
                }
              }}
            />

            {/* More Options */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[160px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                  sideOffset={5}
                >
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    Word count: {stats.words}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    Characters: {stats.characters}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    Reading time: {stats.readingTime} min
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
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
          </div>

          {/* Tiptap Editor */}
          <div className="flex-1">
            <TiptapEditor editor={editor} />
          </div>
        </div>

        {/* Preview Panel */}
        <ContentPreview 
          content={content}
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
