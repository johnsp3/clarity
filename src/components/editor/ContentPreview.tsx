import React, { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import { marked } from 'marked'
import { ContentFormat } from '../../types/editor'

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

  // Configure marked options for better markdown rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  })

  useEffect(() => {
    if (!content) {
      setPreviewContent('')
      return
    }

    console.log('🎨 Preview rendering content:', JSON.stringify(content), 'as format:', format)

    let renderedContent = ''
    
    switch (format) {
      case 'markdown':
        // Parse markdown to HTML
        try {
          console.log('📝 Parsing Markdown content:', content)
          renderedContent = marked(content) as string
          console.log('✅ Markdown rendered to:', renderedContent.substring(0, 100) + '...')
        } catch (error) {
          console.error('Markdown parsing error:', error)
          renderedContent = `<pre class="error-preview">Error parsing Markdown:\n${escapeHtml(content)}</pre>`
        }
        break
        
      case 'html':
        // For HTML, render it directly (it's already HTML)
        renderedContent = content
        break
        
      case 'rich':
        // Rich text is already formatted HTML
        renderedContent = content
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

  if (!isVisible) return null

  const formatLabels: Record<ContentFormat, string> = {
    markdown: 'Markdown Preview',
    html: 'HTML Preview',
    rich: 'Rich Text Preview',
    plain: 'Plain Text Preview',
    code: 'Code Preview',
    word: 'Microsoft Word Preview',
    rtf: 'Rich Text Format Preview',
    docx: 'Word Document Preview',
    json: 'JSON Preview',
    xml: 'XML Preview',
    csv: 'CSV Data Preview'
  }

  return (
    <div className="w-1/2 h-full border-l border-[#E5E5E7] bg-[#FAFAFA] flex flex-col">
      {/* Preview Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E7] bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText size={16} className="text-gray-500" />
            <span>{formatLabels[format]}</span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Rendered from {format.toUpperCase()}
          </span>
        </div>
      </div>

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

// Helper function to get appropriate CSS class for different formats
function getPreviewClassName(format: ContentFormat): string {
  switch (format) {
    case 'code':
      return 'font-mono text-sm'
    case 'json':
    case 'xml':
      return 'font-mono text-sm'
    case 'csv':
      return 'csv-preview'
    default:
      return 'prose prose-sm max-w-none'
  }
}

// Helper function to clean Microsoft Word content
function cleanWordContent(content: string): string {
  return content
    // Remove Word-specific XML namespaces and tags
    .replace(/<o:p\s*\/?>/gi, '')
    .replace(/<w:[^>]*>/gi, '')
    .replace(/<\/w:[^>]*>/gi, '')
    // Clean up Word CSS classes
    .replace(/class="Mso[^"]*"/gi, '')
    // Remove Word-specific styles
    .replace(/mso-[^;]*;?/gi, '')
    // Clean up excessive spacing
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper function to parse RTF content (basic parsing)
function parseRTFContent(content: string): string {
  // This is a basic RTF parser - for full RTF support, you'd need a proper library
  const parsed = content
    // Remove RTF control words
    .replace(/\\[a-z]+\d*/gi, '')
    // Remove RTF control symbols
    .replace(/[{}]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return `<div class="rtf-content"><p>${escapeHtml(parsed)}</p></div>`
}

// Helper function to parse DOCX/Word XML content
function parseDocxContent(content: string): string {
  try {
    // Extract text content from Word XML
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')
    
    // Try to extract text from common Word XML elements
    const textElements = doc.querySelectorAll('w\\:t, t')
    const extractedText = Array.from(textElements)
      .map(el => el.textContent)
      .filter(text => text && text.trim())
      .join(' ')

    if (extractedText) {
      return `<div class="docx-content">${escapeHtml(extractedText).replace(/\n/g, '<br>')}</div>`
    }
  } catch (error) {
    console.error('Error parsing DOCX content:', error)
  }

  // Fallback: show as formatted XML
  return `<pre class="xml-preview">${escapeHtml(content)}</pre>`
}

// Helper function to format JSON content
function formatJSONContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    return `<pre class="json-preview"><code>${escapeHtml(formatted)}</code></pre>`
  } catch {
    return `<pre class="json-preview error"><code>Invalid JSON:\n${escapeHtml(content)}</code></pre>`
  }
}

// Helper function to format XML content
function formatXMLContent(content: string): string {
  try {
    // Basic XML formatting
    const formatted = content
      .replace(/></g, '>\n<')
      .replace(/^\s*\n/gm, '')
    
    return `<pre class="xml-preview"><code>${escapeHtml(formatted)}</code></pre>`
  } catch {
    return `<pre class="xml-preview"><code>${escapeHtml(content)}</code></pre>`
  }
}

// Helper function to format CSV content as table
function formatCSVContent(content: string): string {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return '<p>Empty CSV</p>'

  // Detect separator
  const separators = [',', ';', '\t']
  let separator = ','
  let maxCount = 0

  for (const sep of separators) {
    const count = (lines[0].match(new RegExp(`\\${sep}`, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      separator = sep
    }
  }

  const rows = lines.map(line => 
    line.split(separator).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  )

  const headers = rows[0]
  const dataRows = rows.slice(1)

  let tableHTML = '<table class="csv-table">'
  
  // Headers
  if (headers.length > 0) {
    tableHTML += '<thead><tr>'
    headers.forEach(header => {
      tableHTML += `<th>${escapeHtml(header)}</th>`
    })
    tableHTML += '</tr></thead>'
  }

  // Data rows
  if (dataRows.length > 0) {
    tableHTML += '<tbody>'
    dataRows.forEach(row => {
      tableHTML += '<tr>'
      row.forEach(cell => {
        tableHTML += `<td>${escapeHtml(cell)}</td>`
      })
      tableHTML += '</tr>'
    })
    tableHTML += '</tbody>'
  }

  tableHTML += '</table>'
  return tableHTML
}

// Helper function to get preview styles
function getPreviewStyles(): string {
  return `
    /* Clean Professional Styles */
    .prose {
      color: #1A1A1A;
      line-height: 1.75;
      font-size: 15px;
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
      font-size: 2.25rem;
      border-bottom: 1px solid #E5E5E7;
      padding-bottom: 0.5rem;
    }
    
    .prose h2 {
      font-size: 1.875rem;
      border-bottom: 1px solid #E5E5E7;
      padding-bottom: 0.5rem;
    }
    
    .prose h3 {
      font-size: 1.5rem;
    }
    
    .prose h4 {
      font-size: 1.25rem;
    }
    
    .prose h5 {
      font-size: 1.125rem;
    }
    
    .prose h6 {
      font-size: 1rem;
    }
    
    .prose p {
      margin-top: 0;
      margin-bottom: 20px;
      color: #4A4A4A;
    }
    
    .prose ul,
    .prose ol {
      margin-top: 0;
      margin-bottom: 20px;
      padding-left: 2em;
    }
    
    .prose li {
      margin-bottom: 8px;
      color: #4A4A4A;
    }
    
    .prose li::marker {
      color: #6B6B6B;
    }
    
    .prose ul ul,
    .prose ul ol,
    .prose ol ul,
    .prose ol ol {
      margin-top: 8px;
      margin-bottom: 8px;
    }
    
    .prose blockquote {
      margin: 20px 0;
      padding: 12px 20px;
      color: #6B6B6B;
      border-left: 4px solid #E5E5E7;
      background-color: #F9F9F9;
      font-style: italic;
    }
    
    .prose code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: #F5F5F5;
      border: 1px solid #E5E5E7;
      border-radius: 3px;
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    
    .prose pre {
      margin-top: 0;
      margin-bottom: 20px;
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #F8F8F8;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
    }
    
    .prose pre code {
      padding: 0;
      background-color: transparent;
      border: none;
      font-size: 100%;
      color: #333;
    }
    
    .prose a {
      color: #0F62FE;
      text-decoration: underline;
      transition: color 0.15s ease;
    }
    
    .prose a:hover {
      color: #0043CE;
    }
    
    .prose img {
      max-width: 100%;
      margin: 20px 0;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .prose hr {
      height: 1px;
      padding: 0;
      margin: 32px 0;
      background-color: #E5E5E7;
      border: 0;
    }
    
    .prose table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
      border: 1px solid #E5E5E7;
      background-color: white;
    }
    
    .prose th,
    .prose td {
      padding: 12px 16px;
      border: 1px solid #E5E5E7;
    }
    
    .prose th {
      background-color: #F8F8F8;
      font-weight: 600;
      text-align: left;
    }
    
    .prose tbody tr:hover {
      background-color: #F9F9F9;
    }
    
    /* Code preview styles */
    .code-preview {
      background-color: #F8F8F8;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      padding: 20px;
      overflow: auto;
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
      line-height: 1.6;
      color: #1A1A1A;
    }

    /* JSON preview styles */
    .json-preview {
      background-color: #F8F8F8;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      padding: 20px;
      overflow: auto;
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
      line-height: 1.6;
    }

    .json-preview.error {
      background-color: #FEF2F2;
      border-color: #FECACA;
      color: #DC2626;
    }

    /* XML preview styles */
    .xml-preview {
      background-color: #F8F8F8;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      padding: 20px;
      overflow: auto;
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
      line-height: 1.6;
      color: #1A1A1A;
    }

    /* Task list styles */
    .prose input[type="checkbox"] {
      margin-right: 8px;
      transform: scale(1.1);
    }
    
    .prose li:has(input[type="checkbox"]) {
      list-style: none;
      margin-left: -1.5em;
    }

    /* CSV table styles */
    .csv-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
      background-color: white;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      overflow: hidden;
    }

    .csv-table th {
      background-color: #F8F8F8;
      padding: 12px 16px;
      border: 1px solid #E5E5E7;
      font-weight: 600;
      text-align: left;
      color: #1A1A1A;
    }

    .csv-table td {
      padding: 10px 16px;
      border: 1px solid #E5E5E7;
      color: #4A4A4A;
    }

    .csv-table tbody tr:nth-child(even) {
      background-color: #FAFAFA;
    }

    .csv-table tbody tr:hover {
      background-color: #F0F9FF;
    }

    /* RTF content styles */
    .rtf-content {
      background-color: #FAFAFA;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      padding: 20px;
      color: #4A4A4A;
      line-height: 1.6;
    }

    /* DOCX content styles */
    .docx-content {
      background-color: white;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
      padding: 20px;
      color: #1A1A1A;
      line-height: 1.6;
      font-family: 'Times New Roman', serif;
    }

    /* Error preview styles */
    .error-preview {
      background-color: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 6px;
      padding: 20px;
      color: #DC2626;
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    
    /* Enhanced list styles */
    .prose ul > li {
      position: relative;
      padding-left: 0.375em;
    }
    
    .prose ol > li {
      position: relative;
      padding-left: 0.375em;
    }
    
    /* Task list styles */
    .prose ul > li > input[type="checkbox"] {
      position: absolute;
      left: -1.75em;
      top: 0.375em;
    }
    
    /* Nested list indentation */
    .prose ul ul,
    .prose ol ul {
      list-style-type: circle;
    }
    
    .prose ul ul ul,
    .prose ol ul ul,
    .prose ol ol ul {
      list-style-type: square;
    }
  `
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
} 