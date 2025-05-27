import React, { useEffect, useState, useRef } from 'react'
import { detectTextFormatAI } from '../utils/chatgpt-editor'
import { 
  Hash, 
  Code, 
  FileText,
  Database,
  Globe,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react'

interface FormatBadgeProps {
  content: string
  visible?: boolean
  format?: string
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ content, visible = true, format: providedFormat }) => {
  const [format, setFormat] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium')
  const [isDetecting, setIsDetecting] = useState(false)
  
  // Refs for cleanup and debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (providedFormat) {
      setFormat(providedFormat)
      setConfidence('high')
      return
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const detectFormat = async () => {
      // Check if component is unmounted
      if (isUnmountedRef.current) return
      
      if (!content || content.length < 10) {
        setFormat('plain')
        setIsDetecting(false)
        return
      }

      // Skip if content hasn't changed significantly
      if (lastContentRef.current === content) {
        return
      }
      
      lastContentRef.current = content
      setIsDetecting(true)
      
      try {
        // Use ChatGPT API for format detection (now with queue management)
        console.log('🤖 FormatBadge: Requesting format detection (queued)')
        const result = await detectTextFormatAI(content)
        
        // Check if component is still mounted and content hasn't changed
        if (!isUnmountedRef.current && lastContentRef.current === content) {
          console.log('🎯 FormatBadge: Format detection result:', result)
          setFormat(result.format)
          setConfidence(result.confidence)
        }
      } catch (error) {
        console.error('❌ FormatBadge: Format detection failed:', error)
        // Only update state if component is still mounted
        if (!isUnmountedRef.current) {
          setFormat('plain')
          setConfidence('low')
        }
      } finally {
        // Only update state if component is still mounted
        if (!isUnmountedRef.current) {
          setIsDetecting(false)
        }
      }
    }

    // Debounce format detection with longer delay to reduce API calls
    timeoutRef.current = setTimeout(detectFormat, 1000) // Increased from 500ms to 1000ms
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, providedFormat])

  if (!visible || !format || isDetecting) return null

  const formatConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string }> = {
    markdown: {
      icon: Hash,
      label: 'Markdown',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    html: {
      icon: Code,
      label: 'HTML',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    code: {
      icon: Code,
      label: 'Code',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    json: {
      icon: Database,
      label: 'JSON',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    xml: {
      icon: Globe,
      label: 'XML',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    csv: {
      icon: FileSpreadsheet,
      label: 'CSV',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    rich: {
      icon: Sparkles,
      label: 'Rich Text',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    },
    word: {
      icon: FileText,
      label: 'Word Document',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    docx: {
      icon: FileText,
      label: 'Word DOCX',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    rtf: {
      icon: FileText,
      label: 'Rich Text Format',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    },
    plain: {
      icon: FileText,
      label: 'Plain Text',
      color: 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const config = formatConfig[format] || formatConfig.plain
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {confidence === 'high' && (
        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60" title="High confidence detection" />
      )}
    </div>
  )
} 