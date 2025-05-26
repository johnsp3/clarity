import React, { useState, useRef, useEffect } from 'react'
import { transformText, enhanceContent } from '../utils/chatgpt-editor'
import { getOpenAIClient } from '../utils/openai-client'
import { 
  Sparkles,
  ChevronDown,
  Smile,
  Briefcase,
  Scissors,
  CheckCircle,
  Edit3,
  Zap,
  List,
  FileDown,
  Lightbulb,
  Target
} from 'lucide-react'

interface AIEditProps {
  content: string
  onRewrite: (newContent: string) => void
}

interface MenuItem {
  key: string
  label: string
  icon: React.ComponentType<any>
  emoji?: string
  category?: 'tone' | 'enhance' | 'custom'
}

export const AIEdit: React.FC<AIEditProps> = ({ content, onRewrite }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [customPrompt, setCustomPrompt] = useState('')
  const [recentPrompts, setRecentPrompts] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<'tone' | 'enhance' | 'custom'>('tone')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isApiKeyConfigured = !!getOpenAIClient()

  useEffect(() => {
    // Load recent prompts from localStorage
    const saved = localStorage.getItem('recentCustomPrompts')
    if (saved) {
      try {
        setRecentPrompts(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent prompts:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTransform = async (transformation: string, custom: string | null = null) => {
    if (!isApiKeyConfigured) {
      alert('Please configure your OpenAI API key in Settings to use AI features')
      return
    }

    if (!content.trim()) {
      alert('Please write some content first')
      return
    }

    setIsLoading(true)
    setIsOpen(false)

    try {
      let result
      if (transformation.startsWith('enhance_')) {
        const enhanceType = transformation.replace('enhance_', '')
        result = await enhanceContent(content, enhanceType)
      } else {
        result = await transformText(content, transformation, custom)
      }

      if (result.success && result.content) {
        onRewrite(result.content)
        
        // Save custom prompt to recent
        if (custom && custom.trim()) {
          const updated = [custom, ...recentPrompts.filter(p => p !== custom)].slice(0, 5)
          setRecentPrompts(updated)
          localStorage.setItem('recentCustomPrompts', JSON.stringify(updated))
        }
        
        // For markdown conversion, show a success message
        if (transformation === 'markdown') {
          console.log('✅ Markdown conversion completed. Content should now display with proper formatting.')
        }
      } else {
        alert(`Error: ${result.error || 'Unknown error occurred'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setIsLoading(false)
      setCustomPrompt('')
    }
  }

  const menuItems: Record<string, MenuItem[]> = {
    tone: [
      { key: 'happy', label: 'Make it Happy', icon: Smile, emoji: '😊' },
      { key: 'professional', label: 'Make it Professional', icon: Briefcase, emoji: '💼' },
      { key: 'grammar', label: 'Fix Grammar & Spelling', icon: CheckCircle, emoji: '✓' },
    ],
    enhance: [
      { key: 'enhance_concise', label: 'Make it Concise', icon: Scissors, emoji: '✂️' },
      { key: 'enhance_expand', label: 'Expand with Details', icon: Zap, emoji: '⚡' },
      { key: 'enhance_bullets', label: 'Convert to Bullets', icon: List, emoji: '📝' },
      { key: 'enhance_summarize', label: 'Summarize', icon: FileDown, emoji: '📄' },
      { key: 'enhance_improve', label: 'Improve Clarity', icon: Lightbulb, emoji: '💡' },
      { key: 'enhance_simplify', label: 'Simplify Language', icon: Target, emoji: '🎯' },
    ]
  }

  const categories = [
    { key: 'tone' as const, label: 'Tone & Style', icon: Smile },
    { key: 'enhance' as const, label: 'Enhance', icon: Zap },
    { key: 'custom' as const, label: 'Custom', icon: Edit3 },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out
          ${isApiKeyConfigured 
            ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#E8E8ED] hover:border-[#C7C7CC] active:scale-[0.97] active:bg-[#E8E8ED]' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
            <span>Transforming...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#1D1D1F]" />
            <span>AI Edit</span>
            <ChevronDown className="w-3 h-3 text-[#1D1D1F]" />
          </>
        )}
      </button>

      {isOpen && !isLoading && (
        <div className="absolute top-full right-0 mt-2 w-[480px] bg-white rounded-xl shadow-xl border border-gray-200 py-4 z-50">
          {/* Category Tabs */}
          <div className="px-4 pb-3 border-b border-gray-100">
            <div className="flex gap-1.5">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeCategory === category.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="max-h-80 overflow-y-auto">
            {activeCategory === 'custom' ? (
              <div className="px-5 py-4">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPrompt.trim()) {
                        handleTransform('custom', customPrompt)
                      }
                    }}
                    placeholder="Type your instruction..."
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  
                  {recentPrompts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-3 font-medium">Recent prompts:</p>
                      <div className="space-y-2">
                        {recentPrompts.slice(0, 3).map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCustomPrompt(prompt)
                              handleTransform('custom', prompt)
                            }}
                            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 p-3 rounded-lg hover:bg-gray-50 truncate border border-gray-200"
                          >
                            "{prompt}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleTransform('custom', customPrompt)}
                    disabled={!customPrompt.trim()}
                    className="w-full px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply Custom Prompt
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {menuItems[activeCategory]?.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleTransform(item.key)}
                    className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-4 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.emoji && <span className="text-lg">{item.emoji}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isApiKeyConfigured && (
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <strong>API Key Required:</strong> Configure your OpenAI API key in Settings to use AI features.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 