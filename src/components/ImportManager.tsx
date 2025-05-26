import React, { useRef, useState, useCallback } from 'react'
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

export const ImportManager: React.FC = () => {
  const { addNote, activeProjectId, activeFolderId } = useStore()
  const [isOpen, setIsOpen] = useState(false)
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
      handleClose()
    }, 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedFiles([])
    setResults([])
    setImportProgress(null)
    setImportSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (type: 'markdown' | 'html' | 'text') => {
    switch (type) {
      case 'markdown':
        return <FileText className="w-4 h-4 text-[#6B6B6B]" />
      case 'html':
        return <FileCode className="w-4 h-4 text-[#6B6B6B]" />
      default:
        return <FileText className="w-4 h-4 text-[#6B6B6B]" />
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl 
                 rounded-xl shadow-sm border border-gray-200/50 hover:shadow-md 
                 transition-all duration-300 text-sm font-medium"
      >
        <Upload size={16} strokeWidth={1.5} />
        Import Notes
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 
                                   bg-white rounded-lg shadow-2xl w-full max-w-2xl z-[101]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E5E7]">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Import Notes</h2>
              <p className="text-sm text-[#6B6B6B] mt-1">Import notes from Markdown, HTML, or text files</p>
            </div>

            {/* Modal Content */}
            {importSuccess ? (
              // Success State
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#24A148] text-white flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-[#1A1A1A] font-medium mb-2">
                  Successfully imported {results.filter(r => r.success).length} notes
                </p>
                <button 
                  onClick={handleClose}
                  className="text-sm text-[#0F62FE] hover:text-[#0043CE]"
                >
                  View imported notes →
                </button>
              </div>
            ) : importProgress ? (
              // Progress State
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1A1A]">Importing files...</span>
                    <span className="text-[#6B6B6B]">{importProgress.current}/{importProgress.total}</span>
                  </div>
                  
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0F62FE] transition-all duration-300" 
                      style={{width: `${(importProgress.current / importProgress.total) * 100}%`}} 
                    />
                  </div>
                  
                  <p className="text-xs text-[#9B9B9B] truncate">
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
                        ? 'border-[#0F62FE] bg-[#E5F0FF]' 
                        : 'border-[#D1D1D3] bg-[#FAFAFA] hover:bg-[#F5F5F5] hover:border-[#0F62FE]'
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
                      <svg className="w-12 h-12 mx-auto text-[#9B9B9B] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      
                      <p className="text-[#1A1A1A] font-medium mb-2">
                        Drop files here or click to browse
                      </p>
                      
                      <p className="text-sm text-[#6B6B6B]">
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
                      <div key={index} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded border border-[#E5E5E7]">
                        <div className="flex items-center gap-3">
                          {getFileIcon(fileItem.type)}
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{fileItem.file.name}</p>
                            <p className="text-xs text-[#9B9B9B]">{fileItem.size}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeFile(index)}
                          className="text-[#6B6B6B] hover:text-[#DA1E28] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Import Options */}
                {selectedFiles.length > 0 && (
                  <div className="mx-6 mb-6 p-4 bg-[#FAFAFA] rounded border border-[#E5E5E7]">
                    <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">Import Options</h3>
                    
                    <label className="flex items-center gap-2 text-sm text-[#1A1A1A] mb-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-[#D1D1D3]"
                        checked={options.preserveFormatting}
                        onChange={(e) => setOptions(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                      />
                      Preserve original formatting
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                      <input 
                        type="checkbox" 
                        className="rounded border-[#D1D1D3]"
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
              <div className="px-6 py-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
                
                <button 
                  onClick={handleImport}
                  disabled={selectedFiles.length === 0}
                  className="px-4 py-2 text-sm font-medium bg-[#0F62FE] text-white rounded hover:bg-[#0043CE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {selectedFiles.length} {selectedFiles.length === 1 ? 'Note' : 'Notes'}
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
} 