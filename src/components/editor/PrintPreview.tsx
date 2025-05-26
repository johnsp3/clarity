import React, { useEffect, useRef, useState } from 'react'
import { X, Printer } from 'lucide-react'

interface PrintPreviewProps {
  isOpen: boolean
  onClose: () => void
  content: string
  title: string
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  isOpen, 
  onClose, 
  content, 
  title 
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handlePrint = () => {
    setIsPrinting(true)
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'absolute'
    printFrame.style.top = '-9999px'
    printFrame.style.left = '-9999px'
    document.body.appendChild(printFrame)
    
    const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document
    if (!printDocument) return
    
    // Get the current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    // Create the print document
    printDocument.open()
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Untitled Document'}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Georgia, serif;
              line-height: 1.6;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 2em;
            }
            .header h1 {
              font-size: 2em;
              margin-bottom: 0.5em;
            }
            .header .date {
              font-size: 0.9em;
              color: #666;
            }
            h1 { font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em; page-break-after: avoid; }
            h2 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; page-break-after: avoid; }
            h3 { font-size: 1.2em; margin-top: 1em; margin-bottom: 0.5em; page-break-after: avoid; }
            p { margin-bottom: 1em; text-align: justify; }
            ul, ol { margin-bottom: 1em; padding-left: 2em; }
            li { margin-bottom: 0.5em; }
            blockquote { 
              border-left: 3px solid #e5e7eb; 
              padding-left: 1em; 
              margin-left: 0;
              font-style: italic;
              color: #4b5563;
            }
            code { 
              background-color: #f3f4f6; 
              padding: 0.125em 0.25em; 
              font-family: monospace;
              font-size: 0.9em;
            }
            pre { 
              background-color: #f3f4f6; 
              padding: 1em; 
              overflow-x: auto;
              page-break-inside: avoid;
            }
            img { 
              max-width: 100%; 
              height: auto;
              page-break-inside: avoid;
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
              page-break-inside: avoid;
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 0.5em;
              text-align: left;
            }
            th { 
              background-color: #f9fafb; 
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title || 'Untitled Document'}</h1>
            <div class="date">${currentDate}</div>
          </div>
          ${content}
        </body>
      </html>
    `)
    printDocument.close()
    
    // Wait for content to load then print
    printFrame.onload = () => {
      printFrame.contentWindow?.print()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(printFrame)
        setIsPrinting(false)
      }, 100)
    }
  }

  if (!isOpen) return null

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-5xl h-[90vh] relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-lg z-10">
          <h2 className="text-lg font-semibold text-gray-900">Print Preview</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F62FE] text-white rounded-md 
                       hover:bg-[#0D55D9] transition-colors disabled:opacity-50"
            >
              <Printer size={16} />
              {isPrinting ? 'Printing...' : 'Print to PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Preview Area - Absolute positioned with proper spacing */}
        <div className="absolute top-[73px] left-0 right-0 bottom-0 bg-gray-100 overflow-y-auto p-8 rounded-b-lg">
          <div className="mx-auto max-w-[850px]">
            <div 
              ref={printRef}
              className="bg-white shadow-lg p-16 mb-8"
              style={{
                fontFamily: 'Georgia, serif',
                lineHeight: '1.6',
                color: '#000',
              }}
            >
              {/* Document Header */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{title || 'Untitled Document'}</h1>
                <p className="text-sm text-gray-600">{currentDate}</p>
              </div>

              {/* Document Content */}
              <div 
                className="prose prose-lg max-w-none print-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for the preview */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 12px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Prose content styling */
        .prose h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .prose h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .prose h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .prose p {
          margin-bottom: 1em;
          text-align: justify;
        }
        
        .prose ul,
        .prose ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }
        
        .prose li {
          margin-bottom: 0.5em;
        }
        
        .prose blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          margin-bottom: 1em;
          font-style: italic;
          color: #4b5563;
        }
        
        .prose code {
          background-color: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .prose pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        
        .prose pre code {
          background: none;
          padding: 0;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin-top: 1em;
          margin-bottom: 1em;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        
        .prose th,
        .prose td {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
          text-align: left;
        }
        
        .prose th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        
        .prose a {
          color: #0F62FE;
          text-decoration: underline;
        }
        
        .prose hr {
          border: 0;
          border-top: 1px solid #e5e7eb;
          margin: 2em 0;
        }
      `}} />
    </div>
  )
} 