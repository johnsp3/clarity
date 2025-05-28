import React, { useEffect, useState, useRef } from 'react'
import { detectTextFormat, isApiAvailable } from '../services/openai-service'
import { 
  Hash, 
  Code, 
  FileText,
  Database,
  Globe,
  FileSpreadsheet,
  Sparkles,
  Loader2
} from 'lucide-react'

interface FormatBadgeProps {
  content: string
  visible?: boolean
  format?: string
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ content, visible = true, format: providedFormat }) => {
  const [format, setFormat] = useState<string>('plain')
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high')
  const [isDetecting, setIsDetecting] = useState(false)
  const [reasoning, setReasoning] = useState<string>('')
  
  // Refs for cleanup and debouncing
  const isUnmountedRef = useRef(false)
  const lastContentRef = useRef('')
  const detectionTimeoutRef = useRef<NodeJS.Timeout>()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (providedFormat) {
      setFormat(providedFormat)
      setConfidence('high')
      setReasoning('Format provided by user')
      return
    }

    // Skip detection for very short content
    if (!content || content.trim().length < 5) {
      setFormat('plain')
      setConfidence('high')
      setReasoning('Content too short')
      return
    }

    // Skip if content hasn't changed significantly
    if (lastContentRef.current === content) {
      return
    }

    lastContentRef.current = content

    // Clear any existing timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current)
    }

    // Debounce format detection
    detectionTimeoutRef.current = setTimeout(async () => {
      if (isUnmountedRef.current) return

      setIsDetecting(true)

      try {
        console.log('🔍 [FormatBadge] Starting format detection', { contentLength: content.length })
        
        const result = await detectTextFormat(content)
        
        // Only update state if component is still mounted and content hasn't changed
        if (!isUnmountedRef.current && lastContentRef.current === content) {
          console.log('✅ [FormatBadge] Format detection completed', result)
          setFormat(result.format)
          setConfidence(result.confidence)
          setReasoning(result.reasoning || 'AI analysis')
        }
      } catch (error) {
        console.error('❌ [FormatBadge] Format detection failed:', error)
        
        // Only update state if component is still mounted
        if (!isUnmountedRef.current) {
          setFormat('plain')
          setConfidence('low')
          setReasoning('Detection failed')
        }
      } finally {
        // Only update state if component is still mounted
        if (!isUnmountedRef.current) {
          setIsDetecting(false)
        }
      }
    }, 1000) // 1 second debounce
  }, [content, providedFormat])

  if (!visible) return null

  // Don't show badge while detecting unless we have a previous format
  if (isDetecting && format === 'plain' && !providedFormat) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Detecting...</span>
      </div>
    )
  }

  const formatConfig = {
    markdown: { 
      icon: Hash, 
      label: 'Markdown', 
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Markdown formatting detected'
    },
    html: { 
      icon: Code, 
      label: 'HTML', 
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'HTML markup detected'
    },
    code: { 
      icon: Code, 
      label: 'Code', 
      color: 'bg-green-50 text-green-700 border-green-200',
      description: 'Programming code detected'
    },
    json: { 
      icon: Database, 
      label: 'JSON', 
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'JSON data structure detected'
    },
    xml: { 
      icon: Globe, 
      label: 'XML', 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      description: 'XML markup detected'
    },
    csv: { 
      icon: FileSpreadsheet, 
      label: 'CSV', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'CSV data detected'
    },
    rich: { 
      icon: Sparkles, 
      label: 'Rich Text', 
      color: 'bg-pink-50 text-pink-700 border-pink-200',
      description: 'Rich text formatting detected'
    },
    plain: { 
      icon: FileText, 
      label: 'Plain Text', 
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      description: 'Plain text content'
    }
  }

  const config = formatConfig[format as keyof typeof formatConfig] || formatConfig.plain
  const Icon = config.icon

  // Show confidence indicator for AI-detected formats
  const showConfidence = !providedFormat && isApiAvailable() && format !== 'plain'
  const confidenceColor = {
    high: 'text-green-600',
    medium: 'text-yellow-600', 
    low: 'text-red-600'
  }[confidence]

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.color} transition-all duration-200`}
      title={`${config.description}${reasoning ? ` - ${reasoning}` : ''}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      
      {showConfidence && (
        <span className={`text-xs ${confidenceColor}`}>
          •{confidence.charAt(0).toUpperCase()}
        </span>
      )}
      
      {isDetecting && (
        <Loader2 className="w-3 h-3 animate-spin opacity-50" />
      )}
    </div>
  )
} 