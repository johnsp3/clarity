import React, { useEffect, useState } from 'react'
import { FormatBadgeProps } from '../../types/editor'
import { FileText, Code, FileCode, Type, File, Braces, FileSpreadsheet } from 'lucide-react'

export const FormatBadge: React.FC<FormatBadgeProps> = ({ format, visible }) => {
  const [shouldShow, setShouldShow] = useState(visible)

  useEffect(() => {
    if (visible) {
      setShouldShow(true)
      const timer = setTimeout(() => {
        setShouldShow(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const getIcon = () => {
    switch (format) {
      case 'markdown':
        return <FileText size={14} />
      case 'html':
        return <FileCode size={14} />
      case 'code':
        return <Code size={14} />
      case 'rich':
        return <Type size={14} />
      case 'word':
      case 'docx':
        return <File size={14} />
      case 'rtf':
        return <FileText size={14} />
      case 'json':
        return <Braces size={14} />
      case 'xml':
        return <FileCode size={14} />
      case 'csv':
        return <FileSpreadsheet size={14} />
      case 'plain':
      default:
        return <FileText size={14} />
    }
  }

  const getDisplayName = () => {
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

  if (!shouldShow) return null

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E5F0FF] text-[#0F62FE] 
                    text-xs font-medium rounded border border-[#CCE1FF]">
      {getIcon()}
      <span>{getDisplayName()} detected</span>
    </div>
  )
} 