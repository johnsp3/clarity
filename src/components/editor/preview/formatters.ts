// Helper functions for formatting different content types

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function cleanWordContent(content: string): string {
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

export function parseRTFContent(content: string): string {
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

export function parseDocxContent(content: string): string {
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

export function formatJSONContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    return `<pre class="json-preview"><code>${escapeHtml(formatted)}</code></pre>`
  } catch {
    return `<pre class="json-preview error"><code>Invalid JSON:\n${escapeHtml(content)}</code></pre>`
  }
}

export function formatXMLContent(content: string): string {
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

export function formatCSVContent(content: string): string {
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

export function addImageErrorHandling(html: string): string {
  // Add error handling for images
  return html.replace(
    /<img([^>]*)>/g,
    '<img$1 onerror="this.onerror=null; this.src=\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+\'; this.alt=\'Image not found\'">'
  )
} 