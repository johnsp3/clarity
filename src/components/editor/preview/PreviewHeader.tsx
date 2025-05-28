import React from 'react'
import { FileText, Copy, Check } from 'lucide-react'
import { ContentFormat } from '../../../types/editor'

interface PreviewHeaderProps {
  format: ContentFormat
  isCopied: boolean
  onCopy: () => void
}

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

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({ format, isCopied, onCopy }) => {
  return (
    <div className="px-4 py-3 border-b border-[#E5E5E7] bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText size={16} className="text-gray-500" />
          <span>{formatLabels[format]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Rendered from {format.toUpperCase()}
          </span>
          <button
            onClick={onCopy}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors group"
            title="Copy formatted content"
          >
            {isCopied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} className="text-gray-500 group-hover:text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 