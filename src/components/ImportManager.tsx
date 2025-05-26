import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, FileText, FileCode, X, Check } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useStore } from '../store/useStore'
import { ContentFormat } from '../types/editor'

interface ImportResult {
  success: boolean
  title: string
  content: string
  format: ContentFormat
  error?: string
}

interface FileItem {
  file: File
  size: string
  type: 'markdown' | 'html' | 'text'
}

interface ImportManagerProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const ImportManager: React.FC<ImportManagerProps> = ({ 
  isOpen: externalIsOpen, 
  onOpenChange: externalOnOpenChange 
}) => {
  const { addNote, activeProjectId, activeFolderId } = useStore()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [options, setOptions] = useState({
    preserveFormatting: true,
    separateNotes: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([])
      setResults([])
      setImportProgress(null)
      setImportSuccess(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileType = (fileName: string): 'markdown' | 'html' | 'text' => {
    if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'markdown'
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html'
    return 'text'
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.toLowerCase()
      return ext.endsWith('.md') || ext.endsWith('.markdown') ||
             ext.endsWith('.html') || ext.endsWith('.htm') ||
             ext.endsWith('.txt')
    })

    if (files.length > 0) {
      const fileItems: FileItem[] = files.map(file => ({
        file,
        size: formatFileSize(file.size),
        type: getFileType(file.name)
      }))
      setSelectedFiles(prev => [...prev, ...fileItems])
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileItems: FileItem[] = Array.from(files).map(file => ({
      file,
      size: formatFileSize(file.size),
      type: getFileType(file.name)
    }))
    setSelectedFiles(prev => [...prev, ...fileItems])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const parseMarkdown = (content: string): { title: string; body: string } => {
    const lines = content.split('\n')
    let title = 'Imported Note'
    let bodyStart = 0

    // Try to extract title from first heading
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim()
      if (line.startsWith('# ')) {
        title = line.substring(2).trim()
        bodyStart = i + 1
        break
      }
    }

    // Convert Markdown to HTML
    let html = lines.slice(bodyStart).join('\n')
    
    // Basic Markdown to HTML conversion
    html = html
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      // Code blocks
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>')

    // Wrap in paragraphs if needed
    if (!html.includes('<p>') && !html.includes('<h')) {
      html = `<p>${html}</p>`
    }

    // Clean up list items
    html = html.replace(/(<li>.*<\/li>)\n(?=<li>)/g, '$1')
    html = html.replace(/(<li>)/g, '<ul>$1').replace(/(<\/li>)(?![\s\S]*<li>)/g, '$1</ul>')

    return { title, body: html }
  }

  const parseHTML = (content: string): { title: string; body: string } => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    
    // Try to extract title
    const title = doc.querySelector('title')?.textContent || 
                doc.querySelector('h1')?.textContent || 
                'Imported Note'
    
    // Get body content
    const bodyElement = doc.querySelector('body') || doc.documentElement
    
    // Remove scripts and styles
    bodyElement.querySelectorAll('script, style').forEach(el => el.remove())
    
    // Clean up the HTML
    const cleanHTML = bodyElement.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .trim()

    return { title, body: cleanHTML }
  }

  const handleImport = async () => {
    if (selectedFiles.length === 0) return

    setImportProgress({ current: 0, total: selectedFiles.length })
    const newResults: ImportResult[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileItem = selectedFiles[i]
      setImportProgress({ current: i + 1, total: selectedFiles.length })

      try {
        const content = await fileItem.file.text()
        let result: ImportResult

        if (fileItem.type === 'markdown') {
          const { title, body } = parseMarkdown(content)
          result = {
            success: true,
            title,
            content: body,
            format: 'markdown' as ContentFormat
          }
        } else if (fileItem.type === 'html') {
          const { title, body } = parseHTML(content)
          result = {
            success: true,
            title,
            content: body,
            format: 'html' as ContentFormat
          }
        } else {
          const lines = content.split('\n')
          const title = lines[0] || 'Imported Note'
          const body = `<p>${lines.slice(1).join('</p><p>')}</p>`
          result = {
            success: true,
            title,
            content: body,
            format: 'plain' as ContentFormat
          }
        }

        newResults.push(result)
      } catch (error) {
        newResults.push({
          success: false,
          title: fileItem.file.name,
          content: '',
          format: 'plain' as ContentFormat,
          error: `Failed to read file: ${error}`
        })
      }
    }

    setResults(newResults)
    
    // Import successful notes
    const successfulImports = newResults.filter(r => r.success)
    successfulImports.forEach(result => {
      addNote({
        title: result.title,
        content: result.content,
        projectId: activeProjectId,
        folderId: activeFolderId,
        tags: [],
        type: 'richtext',
        hasImages: result.content.includes('<img'),
        hasCode: result.content.includes('<code') || result.content.includes('<pre'),
        format: result.format,
      })
    })

    setImportProgress(null)
    setImportSuccess(true)

    // Auto-close after showing success
    setTimeout(() => {
      setIsOpen(false)
    }, 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const getFileIcon = (type: 'markdown' | 'html' | 'text') => {
    switch (type) {
      case 'markdown':
        return <FileText className="w-4 h-4 text-[#86868B]" />
      case 'html':
        return <FileCode className="w-4 h-4 text-[#86868B]" />
      default:
        return <FileText className="w-4 h-4 text-[#86868B]" />
    }
  }

  // If used as a standalone component, render the trigger button
  if (externalIsOpen === undefined) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="dropdown-item-apple"
        >
          <Upload size={16} className="text-[#86868B]" />
          Import Notes
        </button>

        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 
                                     bg-white rounded-lg shadow-2xl w-full max-w-2xl z-[101]">
              {/* Modal content here */}
              {/* ... rest of the modal content ... */}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </>
    )
  }

  // If controlled externally, just render the modal
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 
                                 bg-white rounded-lg shadow-2xl w-full max-w-2xl z-[101]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#D2D2D7]">
            <h2 className="text-apple-title-sm">Import Notes</h2>
            <p className="text-apple-caption mt-1">Import notes from Markdown, HTML, or text files</p>
          </div>

          {/* Modal Content */}
          {importSuccess ? (
            // Success State
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-[#1D1D1F] font-medium mb-2">
                Successfully imported {results.filter(r => r.success).length} notes
              </p>
              <button 
                onClick={handleClose}
                className="text-[13px] text-[#007AFF] hover:underline"
              >
                View imported notes →
              </button>
            </div>
          ) : importProgress ? (
            // Progress State
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#1D1D1F]">Importing files...</span>
                  <span className="text-[#86868B]">{importProgress.current}/{importProgress.total}</span>
                </div>
                
                <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#007AFF] transition-all duration-300" 
                    style={{width: `${(importProgress.current / importProgress.total) * 100}%`}} 
                  />
                </div>
                
                <p className="text-apple-caption truncate">
                  Processing: {selectedFiles[importProgress.current - 1]?.file.name}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Drop Zone */}
              <div className="p-6">
                <div 
                  className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
                    isDragging 
                      ? 'border-[#007AFF] bg-[rgba(0,122,255,0.1)]' 
                      : 'border-[#D2D2D7] bg-[#F5F5F7] hover:bg-white hover:border-[#007AFF]'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ minHeight: '200px', cursor: 'pointer' }}
                >
                  <div className="p-12 text-center">
                    {/* Upload Icon */}
                    <Upload className="w-12 h-12 mx-auto text-[#86868B] mb-4" />
                    
                    <p className="text-[#1D1D1F] font-medium mb-2">
                      Drop files here or click to browse
                    </p>
                    
                    <p className="text-apple-caption">
                      Supports .md, .markdown, .html, .htm, .txt files
                    </p>
                    
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".md,.markdown,.html,.htm,.txt"
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div className="mx-6 mb-6 space-y-2">
                  {selectedFiles.map((fileItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg border border-[#D2D2D7]">
                      <div className="flex items-center gap-3">
                        {getFileIcon(fileItem.type)}
                        <div>
                          <p className="text-[15px] font-medium text-[#1D1D1F]">{fileItem.file.name}</p>
                          <p className="text-apple-caption">{fileItem.size}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFile(index)}
                        className="text-[#86868B] hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Import Options */}
              {selectedFiles.length > 0 && (
                <div className="mx-6 mb-6 p-4 bg-[#F5F5F7] rounded-lg border border-[#D2D2D7]">
                  <h3 className="text-[15px] font-medium text-[#1D1D1F] mb-3">Import Options</h3>
                  
                  <label className="flex items-center gap-2 text-[15px] text-[#1D1D1F] mb-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#D2D2D7]"
                      checked={options.preserveFormatting}
                      onChange={(e) => setOptions(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                    />
                    Preserve original formatting
                  </label>
                  
                  <label className="flex items-center gap-2 text-[15px] text-[#1D1D1F]">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#D2D2D7]"
                      checked={options.separateNotes}
                      onChange={(e) => setOptions(prev => ({ ...prev, separateNotes: e.target.checked }))}
                    />
                    Create separate notes for each file
                  </label>
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          {!importSuccess && !importProgress && (
            <div className="px-6 py-4 border-t border-[#D2D2D7] flex items-center justify-end gap-3">
              <button 
                onClick={handleClose}
                className="btn-apple-ghost"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleImport}
                disabled={selectedFiles.length === 0}
                className="btn-apple-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedFiles.length} {selectedFiles.length === 1 ? 'Note' : 'Notes'}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 